package com.neria.manager.jira;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.neria.manager.common.entities.TenantServiceJira;
import com.neria.manager.common.repos.TenantServiceJiraRepository;
import com.neria.manager.common.services.EncryptionService;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class TenantServiceJiraService {
  private final TenantServiceJiraRepository repository;
  private final EncryptionService encryptionService;
  private final ObjectMapper objectMapper;

  public TenantServiceJiraService(
      TenantServiceJiraRepository repository,
      EncryptionService encryptionService,
      ObjectMapper objectMapper) {
    this.repository = repository;
    this.encryptionService = encryptionService;
    this.objectMapper = objectMapper;
  }

  public JiraCredentials get(String tenantId, String serviceCode) {
    Optional<TenantServiceJira> stored =
        repository.findByTenantIdAndServiceCode(tenantId, serviceCode);
    if (stored.isEmpty()) {
      return null;
    }
    TenantServiceJira entity = stored.get();
    Map<String, Object> config = decryptConfig(entity.getEncryptedConfig());
    return JiraCredentials.fromEntity(entity, config);
  }

  public JiraCredentials upsert(String tenantId, String serviceCode, JiraCredentialsRequest request) {
    if (request == null || request.baseUrl == null || request.baseUrl.isBlank()) {
      repository.deleteByTenantIdAndServiceCode(tenantId, serviceCode);
      return null;
    }
    String baseUrl = request.baseUrl.trim();
    String email = request.email != null ? request.email.trim() : "";
    String apiToken = request.apiToken != null ? request.apiToken.trim() : "";
    boolean enabled = request.enabled == null || request.enabled;

    if (email.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Jira email required");
    }
    if (apiToken.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Jira API token required");
    }

    Map<String, Object> config =
        Map.of(
            "baseUrl", baseUrl,
            "email", email,
            "apiToken", apiToken);

    TenantServiceJira entity =
        repository
            .findByTenantIdAndServiceCode(tenantId, serviceCode)
            .orElseGet(
                () -> {
                  TenantServiceJira created = new TenantServiceJira();
                  created.setId(UUID.randomUUID().toString());
                  created.setTenantId(tenantId);
                  created.setServiceCode(serviceCode);
                  created.setCreatedAt(LocalDateTime.now());
                  return created;
                });
    entity.setEnabled(enabled);
    entity.setEncryptedConfig(encryptConfig(config));
    entity.setUpdatedAt(LocalDateTime.now());
    TenantServiceJira saved = repository.save(entity);
    return JiraCredentials.fromEntity(saved, config);
  }

  public void delete(String tenantId, String serviceCode) {
    repository.deleteByTenantIdAndServiceCode(tenantId, serviceCode);
  }

  public ResolvedJira resolve(String tenantId, String serviceCode) {
    Optional<TenantServiceJira> stored =
        repository.findByTenantIdAndServiceCode(tenantId, serviceCode);
    if (stored.isEmpty() || !stored.get().isEnabled()) {
      return null;
    }
    TenantServiceJira entity = stored.get();
    Map<String, Object> config = decryptConfig(entity.getEncryptedConfig());
    return new ResolvedJira(
        asString(config.get("baseUrl")),
        asString(config.get("email")),
        asString(config.get("apiToken")));
  }

  public boolean isConfigured(String tenantId, String serviceCode) {
    ResolvedJira resolved = resolve(tenantId, serviceCode);
    if (resolved == null) {
      return false;
    }
    return resolved.baseUrl != null
        && !resolved.baseUrl.isBlank()
        && resolved.email != null
        && !resolved.email.isBlank()
        && resolved.apiToken != null
        && !resolved.apiToken.isBlank();
  }

  private Map<String, Object> decryptConfig(String encrypted) {
    if (encrypted == null || encrypted.isBlank()) {
      return Map.of();
    }
    try {
      String decrypted = encryptionService.decrypt(encrypted);
      return objectMapper.readValue(decrypted, new TypeReference<Map<String, Object>>() {});
    } catch (Exception ex) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid Jira config");
    }
  }

  private String encryptConfig(Map<String, Object> config) {
    try {
      String json = objectMapper.writeValueAsString(config);
      return encryptionService.encrypt(json);
    } catch (Exception ex) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid Jira config");
    }
  }

  private String asString(Object value) {
    return value != null ? String.valueOf(value) : null;
  }

  public static class JiraCredentialsRequest {
    public String baseUrl;
    public String email;
    public String apiToken;
    public Boolean enabled;
  }

  public static class JiraCredentials {
    public String baseUrl;
    public String email;
    public boolean enabled;
    public boolean hasToken;

    public static JiraCredentials fromEntity(TenantServiceJira entity, Map<String, Object> config) {
      JiraCredentials response = new JiraCredentials();
      response.baseUrl = config != null ? String.valueOf(config.getOrDefault("baseUrl", "")) : "";
      response.email = config != null ? String.valueOf(config.getOrDefault("email", "")) : "";
      response.enabled = entity.isEnabled();
      response.hasToken = config != null && config.get("apiToken") != null;
      return response;
    }
  }

  public static class ResolvedJira {
    public final String baseUrl;
    public final String email;
    public final String apiToken;

    public ResolvedJira(String baseUrl, String email, String apiToken) {
      this.baseUrl = baseUrl;
      this.email = email;
      this.apiToken = apiToken;
    }
  }
}
