package com.neria.manager.preevaluation;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.neria.manager.common.entities.ServiceCatalog;
import com.neria.manager.common.entities.TenantServiceConfig;
import com.neria.manager.common.entities.TenantServicePreEvaluation;
import com.neria.manager.common.repos.ServiceCatalogRepository;
import com.neria.manager.common.repos.TenantServiceConfigRepository;
import com.neria.manager.common.repos.TenantServicePreEvaluationRepository;
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
public class PreEvaluationsService {
  private static final Logger log = LoggerFactory.getLogger(PreEvaluationsService.class);
  private static final String DEFAULT_PROMPT =
      "Eres un motor de reglas simulado para pre-evaluacion de productos financieros. "
          + "No tienes acceso a scoring real ni a bases de datos. "
          + "Debes estimar una probabilidad orientativa basandote solo en la informacion proporcionada. "
          + "No inventes datos. Si falta informacion, indicarlo. "
          + "Devuelve un JSON estricto (sin markdown) con esta estructura: "
          + "{\"probability\": number, \"decision\": string, \"factors\": array, "
          + "\"questions\": array, \"nextSteps\": array, \"explanation\": string, \"disclaimer\": string}. "
          + "probability debe estar entre 0 y 100. decision: baja, media o alta.";

  private final TenantServicePreEvaluationRepository preEvaluationRepository;
  private final ServiceCatalogRepository serviceCatalogRepository;
  private final TenantServiceConfigRepository configRepository;
  private final RuntimeService runtimeService;
  private final ObjectMapper objectMapper;

  public PreEvaluationsService(
      TenantServicePreEvaluationRepository preEvaluationRepository,
      ServiceCatalogRepository serviceCatalogRepository,
      TenantServiceConfigRepository configRepository,
      RuntimeService runtimeService,
      ObjectMapper objectMapper) {
    this.preEvaluationRepository = preEvaluationRepository;
    this.serviceCatalogRepository = serviceCatalogRepository;
    this.configRepository = configRepository;
    this.runtimeService = runtimeService;
    this.objectMapper = objectMapper;
  }

  public List<PreEvaluationSummary> listPreEvaluations(String tenantId, String serviceCode) {
    String normalized = normalizeServiceCode(serviceCode);
    requireService(normalized);
    return preEvaluationRepository
        .findByTenantIdAndServiceCodeOrderByCreatedAtDesc(tenantId, normalized)
        .stream()
        .map(this::toSummary)
        .toList();
  }

  public PreEvaluationDetail getPreEvaluation(
      String tenantId, String serviceCode, String evaluationId) {
    String normalized = normalizeServiceCode(serviceCode);
    requireService(normalized);
    TenantServicePreEvaluation evaluation =
        preEvaluationRepository
            .findByIdAndTenantIdAndServiceCode(evaluationId, tenantId, normalized)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pre-evaluation not found"));
    return toDetail(evaluation);
  }

  public PreEvaluationDetail createPreEvaluation(
      String tenantId, String serviceCode, PreEvaluationRequest request) {
    String normalized = normalizeServiceCode(serviceCode);
    requireService(normalized);

    if (request == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Pre-evaluation payload required");
    }

    PreEvaluationInput input = normalizeInput(request);

    TenantServiceConfig config =
        configRepository.findByTenantIdAndServiceCode(tenantId, normalized).orElse(null);

    if (config == null || config.getProviderId() == null || config.getProviderId().isBlank()) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST, "Provider not configured for pre-evaluation");
    }

    TenantServicePreEvaluation evaluation = new TenantServicePreEvaluation();
    evaluation.setId(UUID.randomUUID().toString());
    evaluation.setTenantId(tenantId);
    evaluation.setServiceCode(normalized);
    evaluation.setTitle(resolveTitle(request, input));
    evaluation.setProductType(input.productType);
    evaluation.setStatus("completed");
    evaluation.setCreatedAt(LocalDateTime.now());
    evaluation.setUpdatedAt(LocalDateTime.now());
    evaluation.setProviderId(config.getProviderId());

    String model = resolveModel();
    evaluation.setModel(model);

    Map<String, Object> inputPayload = input.toPayload();
    evaluation.setInputJson(toJson(inputPayload));

    AiPreEvaluationOutput aiOutput =
        runAiPreEvaluation(tenantId, normalized, config, model, inputPayload);

    if (aiOutput == null || aiOutput.result == null || aiOutput.result.isEmpty()) {
      throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI pre-evaluation failed");
    }

    Map<String, Object> resultPayload = new LinkedHashMap<>(aiOutput.result);
    Object explanation = resultPayload.get("explanation");
    evaluation.setResultJson(toJson(resultPayload));

    if (explanation != null && !String.valueOf(explanation).isBlank()) {
      evaluation.setReportText(String.valueOf(explanation));
    }

    TenantServicePreEvaluation saved = preEvaluationRepository.save(evaluation);
    return toDetail(saved);
  }

  private AiPreEvaluationOutput runAiPreEvaluation(
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
      AiPreEvaluationOutput result = new AiPreEvaluationOutput();
      result.result = parsed;
      return result;
    } catch (Exception ex) {
      log.warn("Pre-evaluation AI failed: {}", ex.getMessage());
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
    Object productType = input.get("productType");
    if (productType != null && !String.valueOf(productType).isBlank()) {
      sb.append("\nProducto: ").append(productType);
    }
    return sb.toString();
  }

  private PreEvaluationSummary toSummary(TenantServicePreEvaluation evaluation) {
    PreEvaluationSummary summary = new PreEvaluationSummary();
    summary.id = evaluation.getId();
    summary.title = evaluation.getTitle();
    summary.productType = evaluation.getProductType();
    summary.status = evaluation.getStatus();
    summary.createdAt = evaluation.getCreatedAt();
    summary.updatedAt = evaluation.getUpdatedAt();
    summary.result = parseJsonMap(evaluation.getResultJson());
    return summary;
  }

  private PreEvaluationDetail toDetail(TenantServicePreEvaluation evaluation) {
    PreEvaluationDetail detail = new PreEvaluationDetail();
    detail.summary = toSummary(evaluation);
    detail.input = parseJsonMap(evaluation.getInputJson());
    detail.result = parseJsonMap(evaluation.getResultJson());
    detail.report = evaluation.getReportText();
    detail.model = evaluation.getModel();
    detail.providerId = evaluation.getProviderId();
    return detail;
  }

  private PreEvaluationInput normalizeInput(PreEvaluationRequest request) {
    PreEvaluationInput input = new PreEvaluationInput();
    input.productType =
        request.productType != null && !request.productType.isBlank()
            ? request.productType.trim()
            : "general";
    input.notes = request.notes != null ? request.notes.trim() : "";
    input.items = request.items != null ? request.items : List.of();

    if (input.items.isEmpty()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "items required");
    }
    boolean hasQuestion =
        input.items.stream().anyMatch(item -> item != null && item.question != null && !item.question.isBlank());
    if (!hasQuestion) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "items required");
    }
    return input;
  }

  private String resolveTitle(PreEvaluationRequest request, PreEvaluationInput input) {
    if (request.title != null && !request.title.isBlank()) {
      return request.title.trim();
    }
    return "Pre-evaluacion " + input.productType;
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
    String fromEnv = System.getenv("PRE_EVALUATION_MODEL");
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

  private static class AiPreEvaluationOutput {
    private Map<String, Object> result;
  }

  public static class PreEvaluationRequest {
    public String title;
    public String productType;
    public String notes;
    public List<PreEvaluationItem> items;
  }

  public static class PreEvaluationItem {
    public String question;
    public String answer;
  }

  private static class PreEvaluationInput {
    private String productType;
    private String notes;
    private List<PreEvaluationItem> items;

    private Map<String, Object> toPayload() {
      Map<String, Object> payload = new LinkedHashMap<>();
      payload.put("productType", productType);
      payload.put("notes", notes);
      payload.put(
          "items",
          items != null
              ? items.stream().map(PreEvaluationInput::itemToPayload).toList()
              : List.of());
      return payload;
    }

    private static Map<String, Object> itemToPayload(PreEvaluationItem item) {
      if (item == null) {
        return Map.of();
      }
      Map<String, Object> payload = new LinkedHashMap<>();
      payload.put("question", item.question);
      payload.put("answer", item.answer);
      return payload;
    }
  }

  public static class PreEvaluationSummary {
    public String id;
    public String title;
    public String productType;
    public String status;
    public LocalDateTime createdAt;
    public LocalDateTime updatedAt;
    public Map<String, Object> result;
  }

  public static class PreEvaluationDetail {
    public PreEvaluationSummary summary;
    public Map<String, Object> input;
    public Map<String, Object> result;
    public String report;
    public String model;
    public String providerId;
  }
}
