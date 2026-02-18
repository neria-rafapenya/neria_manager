package com.neria.manager.jira;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.neria.manager.common.entities.ChatConversation;
import com.neria.manager.common.entities.ChatMessage;
import com.neria.manager.common.entities.TenantServiceConfig;
import com.neria.manager.common.repos.ChatConversationRepository;
import com.neria.manager.common.repos.ChatMessageRepository;
import com.neria.manager.runtime.ExecuteRequest;
import com.neria.manager.runtime.RuntimeService;
import com.neria.manager.tenantservices.TenantServicesService;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class JiraIssuesService {
  private static final Logger log = LoggerFactory.getLogger(JiraIssuesService.class);
  private final TenantServicesService tenantServicesService;
  private final TenantServiceJiraService tenantServiceJiraService;
  private final ChatConversationRepository conversationRepository;
  private final ChatMessageRepository messageRepository;
  private final RuntimeService runtimeService;
  private final ObjectMapper objectMapper;
  private final HttpClient httpClient =
      HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(15)).build();

  public JiraIssuesService(
      TenantServicesService tenantServicesService,
      TenantServiceJiraService tenantServiceJiraService,
      ChatConversationRepository conversationRepository,
      ChatMessageRepository messageRepository,
      RuntimeService runtimeService,
      ObjectMapper objectMapper) {
    this.tenantServicesService = tenantServicesService;
    this.tenantServiceJiraService = tenantServiceJiraService;
    this.conversationRepository = conversationRepository;
    this.messageRepository = messageRepository;
    this.runtimeService = runtimeService;
    this.objectMapper = objectMapper;
  }

  public Map<String, Object> createIssue(
      String tenantId,
      String userId,
      String conversationId,
      CreateJiraIssueRequest dto) {
    ChatConversation conversation =
        conversationRepository
            .findByIdAndTenantId(conversationId, tenantId)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Conversation not found"));
    if (!conversation.getUserId().equals(userId)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Conversation does not belong to user");
    }

    var access =
        tenantServicesService.requireServiceAccess(
            tenantId, conversation.getServiceCode(), userId);
    if (access == null || !access.jiraEnabled || !access.jiraConfigured) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Jira is not enabled for this service");
    }

    TenantServiceConfig config =
        tenantServicesService.getConfig(tenantId, conversation.getServiceCode());
    if (config == null || config.getJiraProjectKey() == null || config.getJiraProjectKey().isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Jira projectKey is required");
    }

    String sourceContent = resolveMessageContent(tenantId, conversationId, dto);
    if (sourceContent == null || sourceContent.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Message content is required");
    }

    IssueDraft draft =
        generateIssueDraft(
            tenantId,
            conversation,
            config,
            sourceContent);

    var jira = tenantServiceJiraService.resolve(tenantId, conversation.getServiceCode());
    if (jira == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Jira credentials missing");
    }

    String issueKey = createJiraIssue(jira, config, draft, conversation.getServiceCode());
    Map<String, Object> response = new LinkedHashMap<>();
    response.put("issueKey", issueKey);
    response.put("issueUrl", buildIssueUrl(jira.baseUrl, issueKey));
    response.put("createdAt", LocalDateTime.now());
    response.put("summary", draft.summary);
    response.put("issueType", draft.issueType);
    response.put("priority", draft.priority);
    response.put("labels", draft.labels);
    return response;
  }

  private String resolveMessageContent(
      String tenantId, String conversationId, CreateJiraIssueRequest dto) {
    if (dto == null) {
      return null;
    }
    if (dto.messageContent != null && !dto.messageContent.isBlank()) {
      return dto.messageContent;
    }
    if (dto.messageId != null && !dto.messageId.isBlank()) {
      ChatMessage message =
          messageRepository
              .findByIdAndTenantIdAndConversationId(dto.messageId, tenantId, conversationId)
              .orElse(null);
      if (message != null) {
        return message.getContent();
      }
    }
    return null;
  }

  private IssueDraft generateIssueDraft(
      String tenantId,
      ChatConversation conversation,
      TenantServiceConfig config,
      String content) {
    String model = conversation.getModel();
    if (model == null || model.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Model is required for Jira draft");
    }
    String defaultIssueType =
        config.getJiraDefaultIssueType() != null && !config.getJiraDefaultIssueType().isBlank()
            ? config.getJiraDefaultIssueType()
            : "Task";

    String systemPrompt =
        "Eres un asistente que genera incidencias Jira. "
            + "Devuelve solo un JSON válido con las claves: "
            + "summary, description, issueType, priority, labels. "
            + "summary y description son obligatorias. "
            + "issueType debe ser un texto (Bug, Task, Story, etc). "
            + "priority debe ser un texto (Highest, High, Medium, Low, Lowest). "
            + "labels debe ser un array de strings.";
    String userPrompt =
        "Contexto del servicio: "
            + conversation.getServiceCode()
            + "\n\nMensaje:\n"
            + content
            + "\n\nDevuelve el JSON.";

    ExecuteRequest request = new ExecuteRequest();
    request.providerId = conversation.getProviderId();
    request.model = model;
    request.serviceCode = conversation.getServiceCode();
    request.payload =
        Map.of(
            "messages",
            List.of(
                Map.of("role", "system", "content", systemPrompt),
                Map.of("role", "user", "content", userPrompt)));

    Map<String, Object> response = runtimeService.execute(tenantId, request);
    Object output = response.get("output");
    String raw = extractAssistantContent(output);

    IssueDraft draft = parseIssueDraft(raw);
    if (draft.summary == null || draft.summary.isBlank()) {
      draft.summary = truncate(content, 120);
    }
    if (draft.description == null || draft.description.isBlank()) {
      draft.description = content;
    }
    if (draft.issueType == null || draft.issueType.isBlank()) {
      draft.issueType = defaultIssueType;
    }
    if (draft.labels == null) {
      draft.labels = List.of();
    }
    if (config.getJiraAutoLabelWithServiceName() != null
        && config.getJiraAutoLabelWithServiceName()) {
      draft.labels =
          appendLabel(draft.labels, conversation.getServiceCode());
    }
    if (config.getJiraAllowUserPriorityOverride() == null
        || !config.getJiraAllowUserPriorityOverride()) {
      draft.priority = null;
    }
    return draft;
  }

  private String createJiraIssue(
      TenantServiceJiraService.ResolvedJira jira,
      TenantServiceConfig config,
      IssueDraft draft,
      String serviceCode) {
    String baseUrl = normalizeBaseUrl(jira.baseUrl);
    String auth = Base64.getEncoder().encodeToString(
        (jira.email + ":" + jira.apiToken).getBytes(StandardCharsets.UTF_8));

    Map<String, Object> fields = new LinkedHashMap<>();
    fields.put("project", Map.of("key", config.getJiraProjectKey()));
    fields.put("summary", draft.summary);
    fields.put("issuetype", Map.of("name", draft.issueType));
    if (draft.priority != null && !draft.priority.isBlank()) {
      fields.put("priority", Map.of("name", draft.priority));
    }
    if (draft.labels != null && !draft.labels.isEmpty()) {
      fields.put("labels", draft.labels);
    }
    fields.put("description", toADF(draft.description));

    Map<String, Object> payload = Map.of("fields", fields);
    String json;
    try {
      json = objectMapper.writeValueAsString(payload);
    } catch (Exception ex) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid Jira payload");
    }

    HttpRequest request =
        HttpRequest.newBuilder()
            .uri(URI.create(baseUrl + "/rest/api/3/issue"))
            .timeout(Duration.ofSeconds(30))
            .header("Authorization", "Basic " + auth)
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(json))
            .build();

    try {
      HttpResponse<String> response =
          httpClient.send(request, HttpResponse.BodyHandlers.ofString());
      if (response.statusCode() < 200 || response.statusCode() >= 300) {
        throw new ResponseStatusException(
            HttpStatus.BAD_REQUEST, "Jira error: " + response.body());
      }
      Map<String, Object> parsed =
          objectMapper.readValue(response.body(), new TypeReference<Map<String, Object>>() {});
      Object key = parsed.get("key");
      if (key == null) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Jira response missing key");
      }
      return String.valueOf(key);
    } catch (ResponseStatusException ex) {
      throw ex;
    } catch (Exception ex) {
      log.warn("Jira create issue failed", ex);
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Jira request failed");
    }
  }

  private String buildIssueUrl(String baseUrl, String key) {
    String normalized = normalizeBaseUrl(baseUrl);
    return normalized + "/browse/" + key;
  }

  private String normalizeBaseUrl(String baseUrl) {
    if (baseUrl == null) {
      return "";
    }
    String trimmed = baseUrl.trim();
    if (trimmed.endsWith("/")) {
      return trimmed.substring(0, trimmed.length() - 1);
    }
    return trimmed;
  }

  private Map<String, Object> toADF(String text) {
    String safe = text != null ? text : "";
    return Map.of(
        "type",
        "doc",
        "version",
        1,
        "content",
        List.of(
            Map.of(
                "type",
                "paragraph",
                "content",
                List.of(Map.of("type", "text", "text", safe)))));
  }

  private IssueDraft parseIssueDraft(String raw) {
    if (raw == null || raw.isBlank()) {
      return new IssueDraft();
    }
    String json = extractJson(raw);
    if (json == null) {
      return new IssueDraft();
    }
    try {
      Map<String, Object> parsed =
          objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {});
      IssueDraft draft = new IssueDraft();
      draft.summary = asString(parsed.get("summary"));
      draft.description = asString(parsed.get("description"));
      draft.issueType = asString(parsed.get("issueType"));
      draft.priority = asString(parsed.get("priority"));
      draft.labels = toStringList(parsed.get("labels"));
      return draft;
    } catch (Exception ex) {
      return new IssueDraft();
    }
  }

  private String extractAssistantContent(Object output) {
    if (!(output instanceof Map<?, ?> map)) {
      return null;
    }
    Object choicesObj = map.get("choices");
    if (choicesObj instanceof List<?> choices && !choices.isEmpty()) {
      Object first = choices.get(0);
      if (first instanceof Map<?, ?> firstMap) {
        Object message = firstMap.get("message");
        if (message instanceof Map<?, ?> messageMap) {
          Object content = messageMap.get("content");
          if (content != null) {
            return String.valueOf(content).trim();
          }
        }
        Object text = firstMap.get("text");
        if (text != null) {
          return String.valueOf(text).trim();
        }
      }
    }
    Object responseField = map.get("response");
    return responseField != null ? String.valueOf(responseField).trim() : null;
  }

  private String extractJson(String raw) {
    int start = raw.indexOf('{');
    int end = raw.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return raw.substring(start, end + 1);
    }
    return null;
  }

  private String asString(Object value) {
    return value != null ? String.valueOf(value) : null;
  }

  private List<String> toStringList(Object value) {
    if (value instanceof List<?> list) {
      return list.stream().map(String::valueOf).toList();
    }
    return List.of();
  }

  private String truncate(String text, int max) {
    if (text == null) {
      return null;
    }
    if (text.length() <= max) {
      return text;
    }
    return text.substring(0, max);
  }

  private List<String> appendLabel(List<String> labels, String label) {
    if (label == null || label.isBlank()) {
      return labels;
    }
    String normalized = label.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9_-]", "-");
    if (normalized.isBlank()) {
      return labels;
    }
    if (labels == null || labels.isEmpty()) {
      return List.of(normalized);
    }
    if (labels.contains(normalized)) {
      return labels;
    }
    var next = new java.util.ArrayList<>(labels);
    next.add(normalized);
    return next;
  }

  public static class CreateJiraIssueRequest {
    public String messageId;
    public String messageContent;
  }

  private static class IssueDraft {
    public String summary;
    public String description;
    public String issueType;
    public String priority;
    public List<String> labels;
  }
}
