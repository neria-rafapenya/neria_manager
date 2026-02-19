package com.neria.manager.selfassessment;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.neria.manager.common.entities.ServiceCatalog;
import com.neria.manager.common.entities.TenantServiceConfig;
import com.neria.manager.common.entities.TenantServiceSelfAssessment;
import com.neria.manager.common.repos.ServiceCatalogRepository;
import com.neria.manager.common.repos.TenantServiceConfigRepository;
import com.neria.manager.common.repos.TenantServiceSelfAssessmentRepository;
import com.neria.manager.runtime.ExecuteRequest;
import com.neria.manager.runtime.RuntimeService;
import java.time.LocalDateTime;
import java.util.ArrayList;
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
public class SelfAssessmentsService {
  private static final Logger log = LoggerFactory.getLogger(SelfAssessmentsService.class);
  private static final String DEFAULT_PROMPT =
      "Eres un asistente experto en evaluacion de cumplimiento y madurez. "
          + "Analiza las respuestas, detecta inconsistencias, identifica brechas y devuelve recomendaciones accionables. "
          + "No inventes datos, usa solo lo proporcionado. "
          + "Devuelve un JSON estricto (sin markdown) con esta estructura: {\"averageScore\": number, \"scorePercent\": number, \"level\": string, \"gaps\": array, \"highlights\": array, \"consistencyWarnings\": array, \"recommendations\": array, \"report\": string}. "
          + "Usa level en: Inicial, Basico, Intermedio, Avanzado, Optimizado.";

  private final TenantServiceSelfAssessmentRepository assessmentRepository;
  private final ServiceCatalogRepository serviceCatalogRepository;
  private final TenantServiceConfigRepository configRepository;
  private final RuntimeService runtimeService;
  private final ObjectMapper objectMapper;

  public SelfAssessmentsService(
      TenantServiceSelfAssessmentRepository assessmentRepository,
      ServiceCatalogRepository serviceCatalogRepository,
      TenantServiceConfigRepository configRepository,
      RuntimeService runtimeService,
      ObjectMapper objectMapper) {
    this.assessmentRepository = assessmentRepository;
    this.serviceCatalogRepository = serviceCatalogRepository;
    this.configRepository = configRepository;
    this.runtimeService = runtimeService;
    this.objectMapper = objectMapper;
  }

  public List<SelfAssessmentSummary> listAssessments(String tenantId, String serviceCode) {
    String normalized = normalizeServiceCode(serviceCode);
    requireService(normalized);
    return assessmentRepository
        .findByTenantIdAndServiceCodeOrderByCreatedAtDesc(tenantId, normalized)
        .stream()
        .map(this::toSummary)
        .toList();
  }

  public SelfAssessmentDetail getAssessment(String tenantId, String serviceCode, String assessmentId) {
    String normalized = normalizeServiceCode(serviceCode);
    requireService(normalized);
    TenantServiceSelfAssessment assessment =
        assessmentRepository
            .findByIdAndTenantIdAndServiceCode(assessmentId, tenantId, normalized)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Assessment not found"));
    return toDetail(assessment);
  }

  public SelfAssessmentDetail createAssessment(
      String tenantId, String serviceCode, SelfAssessmentRequest request) {
    String normalized = normalizeServiceCode(serviceCode);
    requireService(normalized);

    if (request == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Assessment payload required");
    }

    TenantServiceConfig config =
        configRepository.findByTenantIdAndServiceCode(tenantId, normalized).orElse(null);

    AssessmentInput input = normalizeInput(request);

    TenantServiceSelfAssessment assessment = new TenantServiceSelfAssessment();
    assessment.setId(UUID.randomUUID().toString());
    assessment.setTenantId(tenantId);
    assessment.setServiceCode(normalized);
    assessment.setTitle(resolveTitle(request, input));
    assessment.setAssessmentType(input.assessmentType);
    assessment.setStatus("completed");
    assessment.setCreatedAt(LocalDateTime.now());
    assessment.setUpdatedAt(LocalDateTime.now());

    if (config == null || config.getProviderId() == null || config.getProviderId().isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Provider not configured for AI assessment");
    }

    assessment.setProviderId(config.getProviderId());

    String model = resolveModel();
    assessment.setModel(model);

    Map<String, Object> inputPayload = input.toPayload();
    assessment.setInputJson(toJson(inputPayload));

    boolean includeReport =
        request.includeReport == null || Boolean.TRUE.equals(request.includeReport);

    AiAssessmentOutput aiOutput =
        runAiAssessment(tenantId, normalized, config, model, inputPayload, includeReport);

    if (aiOutput == null || aiOutput.result == null || aiOutput.result.isEmpty()) {
      throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI assessment failed");
    }

    Map<String, Object> resultPayload = new LinkedHashMap<>(aiOutput.result);
    Object reportFromResult = resultPayload.remove("report");
    assessment.setResultJson(toJson(resultPayload));

    if (includeReport) {
      String report = aiOutput.report;
      if ((report == null || report.isBlank()) && reportFromResult != null) {
        report = String.valueOf(reportFromResult);
      }
      if (report != null && !report.isBlank()) {
        assessment.setReportText(report);
      } else {
        assessment.setStatus("partial");
      }
    }

    TenantServiceSelfAssessment saved = assessmentRepository.save(assessment);
    return toDetail(saved);
  }

  private AiAssessmentOutput runAiAssessment(
      String tenantId,
      String serviceCode,
      TenantServiceConfig config,
      String model,
      Map<String, Object> input,
      boolean includeReport) {
    String prompt = buildPrompt(config, input, includeReport);
    ExecuteRequest exec = new ExecuteRequest();
    exec.providerId = config.getProviderId();
    exec.model = model;
    exec.serviceCode = serviceCode;
    exec.payload =
        Map.of(
            "messages",
            List.of(
                Map.of("role", "system", "content", prompt),
                Map.of(
                    "role",
                    "user",
                    "content",
                    toJson(Map.of("input", input)))));
    try {
      Object response = runtimeService.execute(tenantId, exec);
      Object output = response instanceof Map ? ((Map<?, ?>) response).get("output") : response;
      String content = extractAssistantContent(output);
      Map<String, Object> parsed = parseJsonObject(content);
      if (parsed == null || parsed.isEmpty()) {
        return null;
      }
      AiAssessmentOutput result = new AiAssessmentOutput();
      result.result = parsed;
      Object report = parsed.get("report");
      if (report != null) {
        result.report = String.valueOf(report);
      }
      return result;
    } catch (Exception ex) {
      log.warn("Self assessment AI failed: {}", ex.getMessage());
      return null;
    }
  }

  private String buildPrompt(
      TenantServiceConfig config, Map<String, Object> input, boolean includeReport) {
    StringBuilder sb = new StringBuilder();
    if (config != null && config.getSystemPrompt() != null && !config.getSystemPrompt().isBlank()) {
      sb.append(config.getSystemPrompt().trim()).append("\n\n");
    }
    sb.append(DEFAULT_PROMPT);
    sb.append("\n\nIdioma: espanol.");
    sb.append("\nFormato: JSON estricto, sin markdown.");
    sb.append("\nInclude report: ").append(includeReport);
    Object type = input.get("assessmentType");
    if (type != null) {
      sb.append("\nTipo de evaluacion: ").append(type);
    }
    Object framework = input.get("framework");
    if (framework != null && !String.valueOf(framework).isBlank()) {
      sb.append("\nMarco/Normativa: ").append(framework);
    }
    return sb.toString();
  }

  private SelfAssessmentSummary toSummary(TenantServiceSelfAssessment assessment) {
    SelfAssessmentSummary summary = new SelfAssessmentSummary();
    summary.id = assessment.getId();
    summary.title = assessment.getTitle();
    summary.assessmentType = assessment.getAssessmentType();
    summary.status = assessment.getStatus();
    summary.createdAt = assessment.getCreatedAt();
    summary.updatedAt = assessment.getUpdatedAt();
    summary.result = parseJsonMap(assessment.getResultJson());
    return summary;
  }

  private SelfAssessmentDetail toDetail(TenantServiceSelfAssessment assessment) {
    SelfAssessmentDetail detail = new SelfAssessmentDetail();
    detail.summary = toSummary(assessment);
    detail.input = parseJsonMap(assessment.getInputJson());
    detail.result = parseJsonMap(assessment.getResultJson());
    detail.report = assessment.getReportText();
    detail.model = assessment.getModel();
    detail.providerId = assessment.getProviderId();
    return detail;
  }

  private AssessmentInput normalizeInput(SelfAssessmentRequest request) {
    AssessmentInput input = new AssessmentInput();
    input.assessmentType =
        request.assessmentType != null && !request.assessmentType.isBlank()
            ? request.assessmentType.trim()
            : "general";
    input.framework = request.framework != null ? request.framework.trim() : "";
    input.notes = request.notes != null ? request.notes.trim() : "";
    input.attachments = request.attachments != null ? request.attachments : List.of();

    if (request.items == null || request.items.isEmpty()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "items required");
    }

    List<AssessmentItem> items = new ArrayList<>();
    for (SelfAssessmentItem item : request.items) {
      if (item == null || item.question == null || item.question.isBlank()) {
        continue;
      }
      AssessmentItem normalized = new AssessmentItem();
      normalized.question = item.question.trim();
      normalized.answer = item.answer != null ? item.answer.trim() : "";
      normalized.evidence = item.evidence != null ? item.evidence.trim() : "";
      normalized.score = sanitizeScore(item.score);
      items.add(normalized);
    }

    if (items.isEmpty()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "items required");
    }

    input.items = items;
    return input;
  }

  private Integer sanitizeScore(Integer score) {
    if (score == null) return null;
    if (score < 0) return 0;
    if (score > 5) return 5;
    return score;
  }

  private AssessmentResult computeResult(AssessmentInput input) {
    AssessmentResult result = new AssessmentResult();
    result.assessmentType = input.assessmentType;
    result.framework = input.framework;
    result.items = input.items;

    int total = 0;
    int count = 0;
    for (AssessmentItem item : input.items) {
      if (item.score != null) {
        total += item.score;
        count += 1;
      }
    }

    double average = count > 0 ? ((double) total) / count : 0d;
    int maxScore = count * 5;
    double scorePercent = maxScore > 0 ? (total * 100d) / maxScore : 0d;

    result.averageScore = round1(average);
    result.scorePercent = round1(scorePercent);
    result.level = resolveLevel(average);

    List<Map<String, Object>> gaps = new ArrayList<>();
    List<Map<String, Object>> highlights = new ArrayList<>();
    List<String> warnings = new ArrayList<>();
    List<String> recommendations = new ArrayList<>();

    for (AssessmentItem item : input.items) {
      int score = item.score != null ? item.score : 0;
      if (score <= 2) {
        gaps.add(Map.of("question", item.question, "score", score));
        recommendations.add("Refuerza: " + item.question);
      } else if (score >= 4) {
        highlights.add(Map.of("question", item.question, "score", score));
      }
      if (score >= 4 && item.answer != null && item.answer.length() < 12) {
        warnings.add("Puntuacion alta con poca evidencia en: " + item.question);
      }
      if (score <= 2 && item.answer != null && item.answer.length() > 200) {
        warnings.add("Respuesta extensa con puntuacion baja en: " + item.question);
      }
    }

    result.gaps = gaps;
    result.highlights = highlights;
    result.consistencyWarnings = warnings;
    result.recommendations = recommendations;

    return result;
  }

  private String resolveLevel(double averageScore) {
    if (averageScore <= 1.5) return "Inicial";
    if (averageScore <= 2.5) return "Basico";
    if (averageScore <= 3.5) return "Intermedio";
    if (averageScore <= 4.5) return "Avanzado";
    return "Optimizado";
  }

  private double round1(double value) {
    return Math.round(value * 10d) / 10d;
  }

  private String resolveTitle(SelfAssessmentRequest request, AssessmentInput input) {
    if (request.title != null && !request.title.isBlank()) {
      return request.title.trim();
    }
    return "Autoevaluacion " + input.assessmentType;
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
    String fromEnv = System.getenv("SELF_ASSESSMENT_MODEL");
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

  private static class AiAssessmentOutput {
    private Map<String, Object> result;
    private String report;
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

  public static class SelfAssessmentRequest {
    public String title;
    public String assessmentType;
    public String framework;
    public String notes;
    public List<SelfAssessmentItem> items;
    public List<Map<String, Object>> attachments;
    public Boolean includeReport;
  }

  public static class SelfAssessmentItem {
    public String question;
    public String answer;
    public Integer score;
    public String evidence;
  }

  private static class AssessmentInput {
    private String assessmentType;
    private String framework;
    private String notes;
    private List<AssessmentItem> items;
    private List<Map<String, Object>> attachments;

    private Map<String, Object> toPayload() {
      Map<String, Object> payload = new LinkedHashMap<>();
      payload.put("assessmentType", assessmentType);
      payload.put("framework", framework);
      payload.put("notes", notes);
      payload.put("items", items != null ? items.stream().map(AssessmentItem::toPayload).toList() : List.of());
      payload.put("attachments", attachments);
      return payload;
    }
  }

  private static class AssessmentItem {
    private String question;
    private String answer;
    private Integer score;
    private String evidence;

    private Map<String, Object> toPayload() {
      Map<String, Object> payload = new LinkedHashMap<>();
      payload.put("question", question);
      payload.put("answer", answer);
      payload.put("score", score);
      payload.put("evidence", evidence);
      return payload;
    }
  }

  private static class AssessmentResult {
    private String assessmentType;
    private String framework;
    private double averageScore;
    private double scorePercent;
    private String level;
    private List<Map<String, Object>> gaps;
    private List<Map<String, Object>> highlights;
    private List<String> consistencyWarnings;
    private List<String> recommendations;
    private List<AssessmentItem> items;

    private Map<String, Object> toPayload() {
      Map<String, Object> payload = new LinkedHashMap<>();
      payload.put("assessmentType", assessmentType);
      payload.put("framework", framework);
      payload.put("averageScore", averageScore);
      payload.put("scorePercent", scorePercent);
      payload.put("level", level);
      payload.put("gaps", gaps);
      payload.put("highlights", highlights);
      payload.put("consistencyWarnings", consistencyWarnings);
      payload.put("recommendations", recommendations);
      payload.put("items", items != null ? items.stream().map(AssessmentItem::toPayload).toList() : List.of());
      return payload;
    }
  }

  public static class SelfAssessmentSummary {
    public String id;
    public String title;
    public String assessmentType;
    public String status;
    public LocalDateTime createdAt;
    public LocalDateTime updatedAt;
    public Map<String, Object> result;
  }

  public static class SelfAssessmentDetail {
    public SelfAssessmentSummary summary;
    public Map<String, Object> input;
    public Map<String, Object> result;
    public String report;
    public String model;
    public String providerId;
  }
}
