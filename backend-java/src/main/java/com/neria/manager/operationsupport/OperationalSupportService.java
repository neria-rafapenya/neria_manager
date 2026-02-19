package com.neria.manager.operationsupport;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.neria.manager.common.entities.ServiceCatalog;
import com.neria.manager.common.entities.TenantServiceConfig;
import com.neria.manager.common.entities.TenantServiceOperationalSupport;
import com.neria.manager.common.repos.ServiceCatalogRepository;
import com.neria.manager.common.repos.TenantServiceConfigRepository;
import com.neria.manager.common.repos.TenantServiceOperationalSupportRepository;
import com.neria.manager.runtime.ExecuteRequest;
import com.neria.manager.runtime.RuntimeService;
import java.time.LocalDateTime;
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
public class OperationalSupportService {
  private static final Logger log = LoggerFactory.getLogger(OperationalSupportService.class);
  private static final String DEFAULT_PROMPT =
      "Eres un asistente interno de soporte operativo para empleados. "
          + "No uses datos personales ni informacion sensible. "
          + "No tienes acceso a scoring ni a bases de datos. "
          + "Responde con borradores claros y accionables. "
          + "Devuelve un JSON estricto (sin markdown) con esta estructura: "
          + "{\"draft\": string, \"bullets\": array, \"warnings\": array, "
          + "\"questions\": array, \"sources\": array, \"disclaimer\": string}.";

  private final TenantServiceOperationalSupportRepository supportRepository;
  private final ServiceCatalogRepository serviceCatalogRepository;
  private final TenantServiceConfigRepository configRepository;
  private final RuntimeService runtimeService;
  private final ObjectMapper objectMapper;

  public OperationalSupportService(
      TenantServiceOperationalSupportRepository supportRepository,
      ServiceCatalogRepository serviceCatalogRepository,
      TenantServiceConfigRepository configRepository,
      RuntimeService runtimeService,
      ObjectMapper objectMapper) {
    this.supportRepository = supportRepository;
    this.serviceCatalogRepository = serviceCatalogRepository;
    this.configRepository = configRepository;
    this.runtimeService = runtimeService;
    this.objectMapper = objectMapper;
  }

  public List<OperationalSupportSummary> listEntries(String tenantId, String serviceCode) {
    String normalized = normalizeServiceCode(serviceCode);
    requireService(normalized);
    return supportRepository
        .findByTenantIdAndServiceCodeOrderByCreatedAtDesc(tenantId, normalized)
        .stream()
        .map(this::toSummary)
        .toList();
  }

  public OperationalSupportDetail getEntry(
      String tenantId, String serviceCode, String entryId) {
    String normalized = normalizeServiceCode(serviceCode);
    requireService(normalized);
    TenantServiceOperationalSupport entry =
        supportRepository
            .findByIdAndTenantIdAndServiceCode(entryId, tenantId, normalized)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Entry not found"));
    return toDetail(entry);
  }

  public OperationalSupportDetail createEntry(
      String tenantId, String serviceCode, OperationalSupportRequest request) {
    String normalized = normalizeServiceCode(serviceCode);
    requireService(normalized);

    if (request == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payload required");
    }

    OperationalSupportInput input = normalizeInput(request);

    TenantServiceConfig config =
        configRepository.findByTenantIdAndServiceCode(tenantId, normalized).orElse(null);

    TenantServiceOperationalSupport entry = new TenantServiceOperationalSupport();
    entry.setId(UUID.randomUUID().toString());
    entry.setTenantId(tenantId);
    entry.setServiceCode(normalized);
    entry.setTitle(resolveTitle(request, input));
    entry.setEntryType(input.entryType);
    entry.setStatus("completed");
    entry.setCreatedAt(LocalDateTime.now());
    entry.setUpdatedAt(LocalDateTime.now());

    Map<String, Object> inputPayload = input.toPayload();
    entry.setInputJson(toJson(inputPayload));

    if ("template".equals(input.entryType)) {
      String templateText = request.template != null ? request.template.trim() : "";
      if (templateText.isEmpty()) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "template required");
      }
      entry.setReportText(templateText);
      entry.setResultJson(toJson(Map.of("template", templateText)));
      return toDetail(supportRepository.save(entry));
    }

    if (config == null || config.getProviderId() == null || config.getProviderId().isBlank()) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST, "Provider not configured for operational support");
    }

    entry.setProviderId(config.getProviderId());
    String model = resolveModel();
    entry.setModel(model);

    AiDraftOutput aiOutput = runDraft(tenantId, normalized, config, model, inputPayload);

    if (aiOutput == null || aiOutput.result == null || aiOutput.result.isEmpty()) {
      throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI draft failed");
    }

    Map<String, Object> resultPayload = new LinkedHashMap<>(aiOutput.result);
    Object draft = resultPayload.get("draft");
    entry.setResultJson(toJson(resultPayload));
    if (draft != null && !String.valueOf(draft).isBlank()) {
      entry.setReportText(String.valueOf(draft));
    }

    return toDetail(supportRepository.save(entry));
  }

  private AiDraftOutput runDraft(
      String tenantId,
      String serviceCode,
      TenantServiceConfig config,
      String model,
      Map<String, Object> input) {
    String prompt = buildPrompt(config, input);
    ExecuteRequest exec = new ExecuteRequest();
    exec.providerId = config.getProviderId();
    exec.model = model;
    exec.serviceCode = serviceCode;
    exec.payload =
        Map.of(
            "messages",
            List.of(
                Map.of("role", "system", "content", prompt),
                Map.of("role", "user", "content", toJson(Map.of("input", input)))));
    try {
      Object response = runtimeService.execute(tenantId, exec);
      Object output = response instanceof Map ? ((Map<?, ?>) response).get("output") : response;
      String content = extractAssistantContent(output);
      Map<String, Object> parsed = parseJsonObject(content);
      if (parsed == null || parsed.isEmpty()) {
        return null;
      }
      AiDraftOutput result = new AiDraftOutput();
      result.result = parsed;
      return result;
    } catch (Exception ex) {
      log.warn("Operational support draft failed: {}", ex.getMessage());
      return null;
    }
  }

  private String buildPrompt(TenantServiceConfig config, Map<String, Object> input) {
    StringBuilder sb = new StringBuilder();
    if (config != null && config.getSystemPrompt() != null && !config.getSystemPrompt().isBlank()) {
      sb.append(config.getSystemPrompt().trim()).append("\n\n");
    }
    sb.append(DEFAULT_PROMPT);
    sb.append("\n\nIdioma: espanol.");
    sb.append("\nFormato: JSON estricto, sin markdown.");

    boolean docs = config != null && Boolean.TRUE.equals(config.getInternalDocsEnabled());
    boolean policies = config != null && Boolean.TRUE.equals(config.getInternalPoliciesEnabled());
    boolean templates = config != null && Boolean.TRUE.equals(config.getInternalTemplatesEnabled());

    sb.append("\nFuentes internas permitidas: ");
    sb.append(docs ? "documentacion" : "sin_documentacion");
    sb.append(", ");
    sb.append(policies ? "normativas" : "sin_normativas");
    sb.append(", ");
    sb.append(templates ? "plantillas" : "sin_plantillas");

    Object intent = input.get("intent");
    if (intent != null && !String.valueOf(intent).isBlank()) {
      sb.append("\nIntencion: ").append(intent);
    }
    Object template = input.get("template");
    if (template != null && !String.valueOf(template).isBlank()) {
      sb.append("\nPlantilla sugerida: ").append(template);
    }
    return sb.toString();
  }

  private OperationalSupportSummary toSummary(TenantServiceOperationalSupport entry) {
    OperationalSupportSummary summary = new OperationalSupportSummary();
    summary.id = entry.getId();
    summary.title = entry.getTitle();
    summary.entryType = entry.getEntryType();
    summary.status = entry.getStatus();
    summary.createdAt = entry.getCreatedAt();
    summary.updatedAt = entry.getUpdatedAt();
    summary.result = parseJsonMap(entry.getResultJson());
    return summary;
  }

  private OperationalSupportDetail toDetail(TenantServiceOperationalSupport entry) {
    OperationalSupportDetail detail = new OperationalSupportDetail();
    detail.summary = toSummary(entry);
    detail.input = parseJsonMap(entry.getInputJson());
    detail.result = parseJsonMap(entry.getResultJson());
    detail.report = entry.getReportText();
    detail.model = entry.getModel();
    detail.providerId = entry.getProviderId();
    return detail;
  }

  private OperationalSupportInput normalizeInput(OperationalSupportRequest request) {
    OperationalSupportInput input = new OperationalSupportInput();
    input.entryType =
        request.entryType != null && !request.entryType.isBlank()
            ? request.entryType.trim().toLowerCase(Locale.ROOT)
            : "draft";
    if (!"draft".equals(input.entryType) && !"template".equals(input.entryType)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "entryType invalid");
    }
    input.intent = request.intent != null ? request.intent.trim() : "";
    input.question = request.question != null ? request.question.trim() : "";
    input.context = request.context != null ? request.context.trim() : "";
    input.template = request.template != null ? request.template.trim() : "";

    if ("draft".equals(input.entryType) && input.question.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "question required");
    }
    return input;
  }

  private String resolveTitle(OperationalSupportRequest request, OperationalSupportInput input) {
    if (request.title != null && !request.title.isBlank()) {
      return request.title.trim();
    }
    if (!input.intent.isBlank()) {
      return "Soporte operativo - " + input.intent;
    }
    return "Soporte operativo";
  }

  private ServiceCatalog requireService(String serviceCode) {
    ServiceCatalog service =
        serviceCatalogRepository
            .findByCode(serviceCode)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Service not found"));
    if (!service.isEnabled()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Service disabled");
    }
    return service;
  }

  private String normalizeServiceCode(String serviceCode) {
    if (serviceCode == null) {
      return "";
    }
    return serviceCode.trim().toLowerCase(Locale.ROOT);
  }

  private String resolveModel() {
    String fromEnv = System.getenv("OPERATIONAL_SUPPORT_MODEL");
    if (fromEnv == null || fromEnv.isBlank()) {
      fromEnv = System.getenv("SELF_ASSESSMENT_MODEL");
    }
    if (fromEnv == null || fromEnv.isBlank()) {
      fromEnv = System.getenv("EMAIL_AUTOMATION_MODEL");
    }
    return fromEnv != null && !fromEnv.isBlank() ? fromEnv : "gpt-4.1-mini";
  }

  private String toJson(Object payload) {
    try {
      return objectMapper.writeValueAsString(payload);
    } catch (Exception ex) {
      return "{}";
    }
  }

  @SuppressWarnings("unchecked")
  private Map<String, Object> parseJsonMap(String value) {
    if (value == null || value.isBlank()) {
      return Map.of();
    }
    try {
      return objectMapper.readValue(value, Map.class);
    } catch (Exception ex) {
      return Map.of();
    }
  }

  private Map<String, Object> parseJsonObject(String content) {
    if (content == null || content.isBlank()) {
      return Map.of();
    }
    String trimmed = content.trim();
    int first = trimmed.indexOf('{');
    int last = trimmed.lastIndexOf('}');
    if (first >= 0 && last > first) {
      trimmed = trimmed.substring(first, last + 1);
    }
    try {
      return objectMapper.readValue(trimmed, Map.class);
    } catch (Exception ex) {
      return Map.of();
    }
  }

  @SuppressWarnings("unchecked")
  private String extractAssistantContent(Object output) {
    if (!(output instanceof Map)) {
      return String.valueOf(output);
    }
    Map<String, Object> parsed = (Map<String, Object>) output;
    Object choicesObj = parsed.get("choices");
    if (choicesObj instanceof List<?> choices && !choices.isEmpty()) {
      Object first = choices.get(0);
      if (first instanceof Map<?, ?> firstMap) {
        Object message = firstMap.get("message");
        if (message instanceof Map<?, ?> messageMap) {
          Object content = messageMap.get("content");
          if (content != null) {
            return String.valueOf(content);
          }
        }
        Object text = firstMap.get("text");
        if (text != null) {
          return String.valueOf(text);
        }
      }
    }
    Object outputText = parsed.get("output");
    return outputText != null ? String.valueOf(outputText) : String.valueOf(output);
  }

  private static class AiDraftOutput {
    private Map<String, Object> result;
  }

  public static class OperationalSupportRequest {
    public String title;
    public String entryType;
    public String intent;
    public String question;
    public String context;
    public String template;
  }

  private static class OperationalSupportInput {
    private String entryType;
    private String intent;
    private String question;
    private String context;
    private String template;

    private Map<String, Object> toPayload() {
      Map<String, Object> payload = new LinkedHashMap<>();
      payload.put("entryType", entryType);
      payload.put("intent", intent);
      payload.put("question", question);
      payload.put("context", context);
      payload.put("template", template);
      return payload;
    }
  }

  public static class OperationalSupportSummary {
    public String id;
    public String title;
    public String entryType;
    public String status;
    public LocalDateTime createdAt;
    public LocalDateTime updatedAt;
    public Map<String, Object> result;
  }

  public static class OperationalSupportDetail {
    public OperationalSupportSummary summary;
    public Map<String, Object> input;
    public Map<String, Object> result;
    public String report;
    public String model;
    public String providerId;
  }
}
