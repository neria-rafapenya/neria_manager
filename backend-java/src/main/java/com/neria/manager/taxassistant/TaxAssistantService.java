package com.neria.manager.taxassistant;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.neria.manager.common.entities.ServiceCatalog;
import com.neria.manager.common.entities.TenantServiceConfig;
import com.neria.manager.common.entities.TenantServiceTaxAssistant;
import com.neria.manager.common.repos.ServiceCatalogRepository;
import com.neria.manager.common.repos.TenantServiceConfigRepository;
import com.neria.manager.common.repos.TenantServiceTaxAssistantRepository;
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
public class TaxAssistantService {
  private static final Logger log = LoggerFactory.getLogger(TaxAssistantService.class);
  private static final String DEFAULT_PROMPT =
      "Eres un asistente para la declaracion de la renta en Espana. "
          + "No eres asesor fiscal y no das consejo legal. "
          + "No pidas datos bancarios ni identificadores sensibles. "
          + "Devuelve un JSON estricto (sin markdown) con esta estructura: "
          + "{\"summary\": string, \"checklist\": array, \"nextSteps\": array, "
          + "\"warnings\": array, \"questions\": array, \"disclaimer\": string}.";

  private final TenantServiceTaxAssistantRepository taxRepository;
  private final ServiceCatalogRepository serviceCatalogRepository;
  private final TenantServiceConfigRepository configRepository;
  private final RuntimeService runtimeService;
  private final ObjectMapper objectMapper;

  public TaxAssistantService(
      TenantServiceTaxAssistantRepository taxRepository,
      ServiceCatalogRepository serviceCatalogRepository,
      TenantServiceConfigRepository configRepository,
      RuntimeService runtimeService,
      ObjectMapper objectMapper) {
    this.taxRepository = taxRepository;
    this.serviceCatalogRepository = serviceCatalogRepository;
    this.configRepository = configRepository;
    this.runtimeService = runtimeService;
    this.objectMapper = objectMapper;
  }

  public List<TaxAssistantSummary> listCases(String tenantId, String serviceCode) {
    String normalized = normalizeServiceCode(serviceCode);
    requireService(normalized);
    return taxRepository
        .findByTenantIdAndServiceCodeOrderByCreatedAtDesc(tenantId, normalized)
        .stream()
        .map(this::toSummary)
        .toList();
  }

  public TaxAssistantDetail getCase(String tenantId, String serviceCode, String caseId) {
    String normalized = normalizeServiceCode(serviceCode);
    requireService(normalized);
    TenantServiceTaxAssistant entry =
        taxRepository
            .findByIdAndTenantIdAndServiceCode(caseId, tenantId, normalized)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Case not found"));
    return toDetail(entry);
  }

  public TaxAssistantDetail createCase(
      String tenantId, String serviceCode, TaxAssistantRequest request) {
    String normalized = normalizeServiceCode(serviceCode);
    requireService(normalized);

    if (request == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payload required");
    }

    TaxAssistantInput input = normalizeInput(request);
    TenantServiceConfig config =
        configRepository.findByTenantIdAndServiceCode(tenantId, normalized).orElse(null);

    TenantServiceTaxAssistant entry = new TenantServiceTaxAssistant();
    entry.setId(UUID.randomUUID().toString());
    entry.setTenantId(tenantId);
    entry.setServiceCode(normalized);
    entry.setTitle(resolveTitle(request, input));
    entry.setTaxYear(input.taxYear);
    entry.setRegion(input.region);
    entry.setFilingType(input.filingType);
    entry.setStatus("completed");
    entry.setCreatedAt(LocalDateTime.now());
    entry.setUpdatedAt(LocalDateTime.now());

    if (config != null && config.getProviderId() != null && !config.getProviderId().isBlank()) {
      entry.setProviderId(config.getProviderId());
    }

    String model = resolveModel();
    entry.setModel(model);

    Map<String, Object> inputPayload = input.toPayload();
    entry.setInputJson(toJson(inputPayload));

    Map<String, Object> resultPayload = new LinkedHashMap<>();
    resultPayload.put(
        "totals",
        Map.of(
            "income", input.totalIncome,
            "deductions", input.totalDeductions,
            "netBase", input.netBase));

    boolean includeSummary = request.includeSummary == null || request.includeSummary;
    if (includeSummary && config != null && config.getProviderId() != null && !config.getProviderId().isBlank()) {
      Map<String, Object> aiResult = runSummary(tenantId, normalized, config, model, inputPayload, resultPayload);
      if (aiResult != null && !aiResult.isEmpty()) {
        resultPayload.putAll(aiResult);
        Object summary = aiResult.get("summary");
        if (summary != null && !String.valueOf(summary).isBlank()) {
          entry.setReportText(String.valueOf(summary));
        }
      } else {
        entry.setStatus("partial");
      }
    }

    entry.setResultJson(toJson(resultPayload));

    TenantServiceTaxAssistant saved = taxRepository.save(entry);
    return toDetail(saved);
  }

  private Map<String, Object> runSummary(
      String tenantId,
      String serviceCode,
      TenantServiceConfig config,
      String model,
      Map<String, Object> input,
      Map<String, Object> result) {
    String prompt = buildPrompt(config, input, result);
    ExecuteRequest exec = new ExecuteRequest();
    exec.providerId = config.getProviderId();
    exec.model = model;
    exec.serviceCode = serviceCode;
    exec.payload =
        Map.of(
            "messages",
            List.of(
                Map.of("role", "system", "content", prompt),
                Map.of("role", "user", "content", toJson(Map.of("input", input, "result", result)))));
    try {
      Object response = runtimeService.execute(tenantId, exec);
      Object output = response instanceof Map ? ((Map<?, ?>) response).get("output") : response;
      String content = extractAssistantContent(output);
      return parseJsonObject(content);
    } catch (Exception ex) {
      log.warn("Tax assistant summary failed: {}", ex.getMessage());
      return null;
    }
  }

  private String buildPrompt(
      TenantServiceConfig config, Map<String, Object> input, Map<String, Object> result) {
    StringBuilder sb = new StringBuilder();
    if (config != null && config.getSystemPrompt() != null && !config.getSystemPrompt().isBlank()) {
      sb.append(config.getSystemPrompt().trim()).append("\n\n");
    }
    sb.append(DEFAULT_PROMPT);
    sb.append("\n\nIdioma: espanol.");
    sb.append("\nSi faltan datos, pregunta con tacto y propone supuestos conservadores.");
    sb.append("\nNo des cifras finales oficiales. Indica que es orientativo.");
    sb.append("\nIncluye una checklist de documentos a reunir.");
    sb.append("\n\nEntrada:");
    sb.append("\n" + toJson(Map.of("input", input, "result", result)));
    return sb.toString();
  }

  private TaxAssistantSummary toSummary(TenantServiceTaxAssistant entry) {
    TaxAssistantSummary summary = new TaxAssistantSummary();
    summary.id = entry.getId();
    summary.title = entry.getTitle();
    summary.taxYear = entry.getTaxYear();
    summary.region = entry.getRegion();
    summary.status = entry.getStatus();
    summary.createdAt = entry.getCreatedAt();
    summary.updatedAt = entry.getUpdatedAt();
    summary.result = parseJsonMap(entry.getResultJson());
    return summary;
  }

  private TaxAssistantDetail toDetail(TenantServiceTaxAssistant entry) {
    TaxAssistantDetail detail = new TaxAssistantDetail();
    detail.summary = toSummary(entry);
    detail.input = parseJsonMap(entry.getInputJson());
    detail.result = parseJsonMap(entry.getResultJson());
    detail.report = entry.getReportText();
    detail.model = entry.getModel();
    detail.providerId = entry.getProviderId();
    return detail;
  }

  private TaxAssistantInput normalizeInput(TaxAssistantRequest request) {
    TaxAssistantInput input = new TaxAssistantInput();
    input.taxYear = request.taxYear != null ? request.taxYear : LocalDateTime.now().getYear() - 1;
    input.region = safeTrim(request.region);
    input.filingType = safeTrim(request.filingType);
    input.residency = safeTrim(request.residency);
    input.dependents = request.dependents != null ? request.dependents : 0;
    input.notes = safeTrim(request.notes);
    input.incomes = normalizeItems(request.incomes);
    input.deductions = normalizeItems(request.deductions);
    input.totalIncome = sumAmounts(input.incomes);
    input.totalDeductions = sumAmounts(input.deductions);
    input.netBase = input.totalIncome - input.totalDeductions;
    return input;
  }

  private List<AmountItem> normalizeItems(List<AmountItem> items) {
    if (items == null) {
      return List.of();
    }
    List<AmountItem> normalized = new ArrayList<>();
    for (AmountItem item : items) {
      if (item == null) continue;
      AmountItem next = new AmountItem();
      next.label = safeTrim(item.label);
      next.category = safeTrim(item.category);
      next.amount = item.amount != null ? item.amount : 0d;
      if ((next.label == null || next.label.isBlank()) && next.amount == 0d) {
        continue;
      }
      normalized.add(next);
    }
    return normalized;
  }

  private double sumAmounts(List<AmountItem> items) {
    if (items == null || items.isEmpty()) {
      return 0d;
    }
    return items.stream().mapToDouble(item -> item.amount != null ? item.amount : 0d).sum();
  }

  private String resolveTitle(TaxAssistantRequest request, TaxAssistantInput input) {
    if (request.title != null && !request.title.isBlank()) {
      return request.title.trim();
    }
    return "Renta " + input.taxYear;
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
    String fromEnv = System.getenv("TAX_ASSISTANT_MODEL");
    if (fromEnv == null || fromEnv.isBlank()) {
      fromEnv = System.getenv("FINANCIAL_SIMULATOR_MODEL");
    }
    if (fromEnv == null || fromEnv.isBlank()) {
      fromEnv = System.getenv("EMAIL_AUTOMATION_MODEL");
    }
    return fromEnv != null && !fromEnv.isBlank() ? fromEnv : "gpt-4.1-mini";
  }

  private String safeTrim(String value) {
    return value != null ? value.trim() : null;
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

  public static class TaxAssistantRequest {
    public String title;
    public Integer taxYear;
    public String region;
    public String filingType;
    public String residency;
    public Integer dependents;
    public String notes;
    public List<AmountItem> incomes;
    public List<AmountItem> deductions;
    public Boolean includeSummary;
  }

  public static class AmountItem {
    public String label;
    public String category;
    public Double amount;
  }

  private static class TaxAssistantInput {
    private int taxYear;
    private String region;
    private String filingType;
    private String residency;
    private int dependents;
    private String notes;
    private List<AmountItem> incomes;
    private List<AmountItem> deductions;
    private double totalIncome;
    private double totalDeductions;
    private double netBase;

    private Map<String, Object> toPayload() {
      Map<String, Object> payload = new LinkedHashMap<>();
      payload.put("taxYear", taxYear);
      payload.put("region", region);
      payload.put("filingType", filingType);
      payload.put("residency", residency);
      payload.put("dependents", dependents);
      payload.put("notes", notes);
      payload.put("incomes", incomes != null ? incomes : List.of());
      payload.put("deductions", deductions != null ? deductions : List.of());
      payload.put("totalIncome", totalIncome);
      payload.put("totalDeductions", totalDeductions);
      payload.put("netBase", netBase);
      return payload;
    }
  }

  public static class TaxAssistantSummary {
    public String id;
    public String title;
    public Integer taxYear;
    public String region;
    public String status;
    public LocalDateTime createdAt;
    public LocalDateTime updatedAt;
    public Map<String, Object> result;
  }

  public static class TaxAssistantDetail {
    public TaxAssistantSummary summary;
    public Map<String, Object> input;
    public Map<String, Object> result;
    public String report;
    public String model;
    public String providerId;
  }
}
