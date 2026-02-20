package com.neria.manager.logs;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.neria.manager.common.entities.TenantRequestLog;
import com.neria.manager.common.security.AuthContext;
import com.neria.manager.common.entities.Tenant;
import com.neria.manager.tenants.TenantsService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingRequestWrapper;
import org.springframework.web.util.ContentCachingResponseWrapper;

@Component
@Order(Ordered.LOWEST_PRECEDENCE - 10)
public class TenantRequestLogFilter extends OncePerRequestFilter {
  private static final Set<String> METHODS =
      new HashSet<>(Arrays.asList("POST", "PUT", "PATCH", "DELETE"));
  private static final int MAX_BODY_BYTES = 32 * 1024;
  private static final int MAX_PAYLOAD_CHARS = 8000;
  private static final int MAX_QUERY_CHARS = 1024;
  private static final Set<String> SENSITIVE_KEYS =
      new HashSet<>(
          Arrays.asList(
              "password",
              "token",
              "secret",
              "apikey",
              "api_key",
              "authorization",
              "cookie",
              "accesskey",
              "refresh",
              "credential",
              "session"));

  private final ObjectMapper objectMapper;
  private final TenantRequestLogsService logsService;
  private final TenantsService tenantsService;

  public TenantRequestLogFilter(
      ObjectMapper objectMapper, TenantRequestLogsService logsService, TenantsService tenantsService) {
    this.objectMapper = objectMapper;
    this.logsService = logsService;
    this.tenantsService = tenantsService;
  }

  @Override
  protected boolean shouldNotFilter(HttpServletRequest request) {
    return !METHODS.contains(request.getMethod());
  }

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {
    ContentCachingRequestWrapper cachedRequest = new ContentCachingRequestWrapper(request, MAX_BODY_BYTES);
    ContentCachingResponseWrapper cachedResponse = new ContentCachingResponseWrapper(response);
    try {
      filterChain.doFilter(cachedRequest, cachedResponse);
    } finally {
      try {
        recordLog(cachedRequest, cachedResponse);
      } catch (Exception ignored) {
        // Do not block responses if logging fails.
      }
      cachedResponse.copyBodyToResponse();
    }
  }

  private void recordLog(ContentCachingRequestWrapper request, ContentCachingResponseWrapper response) {
    AuthContext auth = (AuthContext) request.getAttribute("auth");
    if (auth == null || auth.getRole() == null || !"tenant".equals(auth.getRole())) {
      return;
    }
    if (auth.getTenantId() == null || auth.getTenantId().isBlank()) {
      return;
    }

    TenantRequestLog log = new TenantRequestLog();
    log.setId(UUID.randomUUID().toString());
    log.setTenantId(auth.getTenantId());
    log.setUserId(auth.getSub());
    log.setRole(auth.getRole());
    log.setServiceCode(auth.getServiceCode());
    log.setMethod(request.getMethod());
    log.setPath(request.getRequestURI());
    log.setType(resolveType(request.getRequestURI()));
    log.setQueryString(truncate(request.getQueryString(), MAX_QUERY_CHARS));
    log.setStatusCode(response.getStatus());
    log.setIpAddress(request.getRemoteAddr());
    log.setUserAgent(truncate(request.getHeader("User-Agent"), 255));
    log.setCreatedAt(LocalDateTime.now());

    Tenant tenant = tenantsService.getById(auth.getTenantId());
    if (tenant != null && tenant.getBillingEmail() != null) {
      log.setUserEmail(tenant.getBillingEmail());
    }

    String payload = extractPayload(request);
    if (payload != null && !payload.isBlank()) {
      log.setPayloadJson(payload);
    }

    logsService.record(log);
  }

  private String resolveType(String path) {
    if (path == null || path.isBlank() || "/".equals(path)) {
      return "root";
    }
    String normalized = path.startsWith("/") ? path.substring(1) : path;
    int slash = normalized.indexOf('/');
    return slash >= 0 ? normalized.substring(0, slash) : normalized;
  }

  private String extractPayload(ContentCachingRequestWrapper request) {
    String contentType = request.getContentType();
    if (contentType != null && contentType.startsWith(MediaType.MULTIPART_FORM_DATA_VALUE)) {
      return null;
    }
    byte[] bodyBytes = request.getContentAsByteArray();
    if (bodyBytes == null || bodyBytes.length == 0) {
      Map<String, String[]> params = request.getParameterMap();
      if (params == null || params.isEmpty()) {
        return null;
      }
      try {
        ObjectNode node = objectMapper.createObjectNode();
        for (var entry : params.entrySet()) {
          String key = entry.getKey();
          String[] values = entry.getValue();
          if (values == null) {
            node.put(key, "");
          } else if (values.length == 1) {
            node.put(key, values[0]);
          } else {
            ArrayNode arr = objectMapper.createArrayNode();
            for (String value : values) {
              arr.add(value);
            }
            node.set(key, arr);
          }
        }
        return truncate(objectMapper.writeValueAsString(sanitizeJson(node)), MAX_PAYLOAD_CHARS);
      } catch (Exception ex) {
        return null;
      }
    }

    String body = new String(bodyBytes, StandardCharsets.UTF_8).trim();
    if (body.isEmpty()) {
      return null;
    }
    if (contentType != null && contentType.contains(MediaType.APPLICATION_JSON_VALUE)) {
      try {
        JsonNode parsed = objectMapper.readTree(body);
        JsonNode sanitized = sanitizeJson(parsed);
        return truncate(objectMapper.writeValueAsString(sanitized), MAX_PAYLOAD_CHARS);
      } catch (Exception ex) {
        return truncate(body, MAX_PAYLOAD_CHARS);
      }
    }
    return truncate(body, MAX_PAYLOAD_CHARS);
  }

  private JsonNode sanitizeJson(JsonNode node) {
    if (node == null) {
      return null;
    }
    if (node.isObject()) {
      ObjectNode result = objectMapper.createObjectNode();
      node.fields().forEachRemaining(entry -> {
        String key = entry.getKey();
        JsonNode value = entry.getValue();
        if (isSensitiveKey(key)) {
          result.put(key, "***");
        } else {
          result.set(key, sanitizeJson(value));
        }
      });
      return result;
    }
    if (node.isArray()) {
      ArrayNode result = objectMapper.createArrayNode();
      node.forEach(item -> result.add(sanitizeJson(item)));
      return result;
    }
    return node;
  }

  private boolean isSensitiveKey(String key) {
    if (key == null) {
      return false;
    }
    String normalized = key.toLowerCase();
    for (String sensitive : SENSITIVE_KEYS) {
      if (normalized.contains(sensitive)) {
        return true;
      }
    }
    return false;
  }

  private String truncate(String value, int maxLength) {
    if (value == null) {
      return null;
    }
    if (value.length() <= maxLength) {
      return value;
    }
    return value.substring(0, maxLength);
  }
}
