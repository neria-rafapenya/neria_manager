package com.neria.manager.financialsim;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.neria.manager.common.entities.ServiceCatalog;
import com.neria.manager.common.entities.TenantServiceConfig;
import com.neria.manager.common.entities.TenantServiceFinancialSimulation;
import com.neria.manager.common.repos.ServiceCatalogRepository;
import com.neria.manager.common.repos.TenantServiceConfigRepository;
import com.neria.manager.common.repos.TenantServiceFinancialSimulationRepository;
import com.neria.manager.runtime.ExecuteRequest;
import com.neria.manager.runtime.RuntimeService;
import java.math.BigDecimal;
import java.math.RoundingMode;
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
public class FinancialSimulationsService {
  private static final Logger log = LoggerFactory.getLogger(FinancialSimulationsService.class);
  private static final String DEFAULT_CURRENCY = "EUR";
  private static final String DEFAULT_PROMPT =
      "Eres un asistente especializado en explicar simulaciones de productos financieros. "
          + "Devuelve una explicación clara, con viñetas breves y advertencias de que no es asesoramiento financiero. "
          + "No pidas datos bancarios ni información sensible. "
          + "Si faltan datos, menciona supuestos razonables.";

  private final TenantServiceFinancialSimulationRepository simulationRepository;
  private final ServiceCatalogRepository serviceCatalogRepository;
  private final TenantServiceConfigRepository configRepository;
  private final RuntimeService runtimeService;
  private final ObjectMapper objectMapper;

  public FinancialSimulationsService(
      TenantServiceFinancialSimulationRepository simulationRepository,
      ServiceCatalogRepository serviceCatalogRepository,
      TenantServiceConfigRepository configRepository,
      RuntimeService runtimeService,
      ObjectMapper objectMapper) {
    this.simulationRepository = simulationRepository;
    this.serviceCatalogRepository = serviceCatalogRepository;
    this.configRepository = configRepository;
    this.runtimeService = runtimeService;
    this.objectMapper = objectMapper;
  }

  public List<SimulationSummary> listSimulations(String tenantId, String serviceCode) {
    String normalized = normalizeServiceCode(serviceCode);
    requireService(normalized);
    return simulationRepository
        .findByTenantIdAndServiceCodeOrderByCreatedAtDesc(tenantId, normalized)
        .stream()
        .map(this::toSummary)
        .toList();
  }

  public SimulationDetail getSimulation(String tenantId, String serviceCode, String simulationId) {
    String normalized = normalizeServiceCode(serviceCode);
    requireService(normalized);
    TenantServiceFinancialSimulation simulation =
        simulationRepository
            .findByIdAndTenantIdAndServiceCode(simulationId, tenantId, normalized)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Simulation not found"));
    return toDetail(simulation);
  }

  public SimulationDetail createSimulation(
      String tenantId, String serviceCode, SimulationRequest request) {
    String normalized = normalizeServiceCode(serviceCode);
    requireService(normalized);

    TenantServiceConfig config =
        configRepository.findByTenantIdAndServiceCode(tenantId, normalized).orElse(null);

    SimulationInput input = normalizeInput(request);
    SimulationResult result = computeResult(input);

    TenantServiceFinancialSimulation simulation = new TenantServiceFinancialSimulation();
    simulation.setId(UUID.randomUUID().toString());
    simulation.setTenantId(tenantId);
    simulation.setServiceCode(normalized);
    simulation.setTitle(resolveTitle(request, input));
    simulation.setProductType(input.type);
    simulation.setCurrency(input.currency);
    simulation.setStatus("completed");
    simulation.setCreatedAt(LocalDateTime.now());
    simulation.setUpdatedAt(LocalDateTime.now());

    if (config != null && config.getProviderId() != null && !config.getProviderId().isBlank()) {
      simulation.setProviderId(config.getProviderId());
    }

    String model = resolveModel();
    simulation.setModel(model);

    Map<String, Object> inputPayload = input.toPayload();
    Map<String, Object> resultPayload = result.toPayload();
    simulation.setInputJson(toJson(inputPayload));
    simulation.setResultJson(toJson(resultPayload));

    boolean includeExplanation = request == null || request.includeExplanation == null || request.includeExplanation;
    if (includeExplanation && config != null && config.getProviderId() != null && !config.getProviderId().isBlank()) {
      String explanation = runExplanation(tenantId, normalized, config, model, inputPayload, resultPayload);
      if (explanation != null && !explanation.isBlank()) {
        simulation.setExplanation(explanation);
      } else {
        simulation.setStatus("partial");
      }
    }

    TenantServiceFinancialSimulation saved = simulationRepository.save(simulation);
    return toDetail(saved);
  }

  private String runExplanation(
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
      return extractAssistantContent(output);
    } catch (Exception ex) {
      log.warn("Financial simulator explanation failed: {}", ex.getMessage());
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
    sb.append("\n\nFormato deseado: resumen corto, puntos clave, y un bloque de advertencias.");
    sb.append("\nMoneda: ").append(input.getOrDefault("currency", DEFAULT_CURRENCY));
    return sb.toString();
  }

  private SimulationSummary toSummary(TenantServiceFinancialSimulation simulation) {
    SimulationSummary summary = new SimulationSummary();
    summary.id = simulation.getId();
    summary.title = simulation.getTitle();
    summary.type = simulation.getProductType();
    summary.currency = simulation.getCurrency();
    summary.status = simulation.getStatus();
    summary.createdAt = simulation.getCreatedAt();
    summary.updatedAt = simulation.getUpdatedAt();
    summary.result = parseJsonMap(simulation.getResultJson());
    return summary;
  }

  private SimulationDetail toDetail(TenantServiceFinancialSimulation simulation) {
    SimulationDetail detail = new SimulationDetail();
    detail.summary = toSummary(simulation);
    detail.input = parseJsonMap(simulation.getInputJson());
    detail.result = parseJsonMap(simulation.getResultJson());
    detail.explanation = simulation.getExplanation();
    detail.model = simulation.getModel();
    detail.providerId = simulation.getProviderId();
    return detail;
  }

  private SimulationInput normalizeInput(SimulationRequest request) {
    if (request == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Simulation payload required");
    }
    SimulationInput input = new SimulationInput();
    input.type = normalizeType(request.type);
    input.currency =
        request.currency != null && !request.currency.isBlank()
            ? request.currency.trim().toUpperCase(Locale.ROOT)
            : DEFAULT_CURRENCY;

    Integer termMonths = request.termMonths;
    if ((termMonths == null || termMonths <= 0) && request.termYears != null) {
      termMonths = request.termYears * 12;
    }

    if (termMonths == null || termMonths <= 0) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "termMonths is required");
    }

    input.termMonths = termMonths;
    input.annualRate = optionalPositive(request.annualRate, 0d);

    if ("savings".equals(input.type)) {
      input.initialDeposit = optionalPositive(request.initialDeposit, 0d);
      input.monthlyContribution = optionalPositive(request.monthlyContribution, 0d);
      if (input.initialDeposit == 0d && input.monthlyContribution == 0d) {
        throw new ResponseStatusException(
            HttpStatus.BAD_REQUEST, "initialDeposit or monthlyContribution required");
      }
    } else {
      input.principal = requirePositive(request.principal, "principal");
    }

    return input;
  }

  private SimulationResult computeResult(SimulationInput input) {
    SimulationResult result = new SimulationResult();
    result.type = input.type;
    result.currency = input.currency;
    result.termMonths = input.termMonths;
    result.annualRate = input.annualRate;

    double monthlyRate = input.annualRate / 1200d;

    if ("savings".equals(input.type)) {
      double initial = input.initialDeposit;
      double monthly = input.monthlyContribution;
      double finalAmount;
      if (monthlyRate == 0d) {
        finalAmount = initial + monthly * input.termMonths;
      } else {
        double factor = Math.pow(1 + monthlyRate, input.termMonths);
        finalAmount = initial * factor + monthly * ((factor - 1) / monthlyRate);
      }
      double totalContribution = initial + monthly * input.termMonths;
      result.initialDeposit = round2(initial);
      result.monthlyContribution = round2(monthly);
      result.finalAmount = round2(finalAmount);
      result.totalContribution = round2(totalContribution);
      result.totalInterest = round2(finalAmount - totalContribution);
    } else {
      double principal = input.principal;
      double payment;
      if (monthlyRate == 0d) {
        payment = principal / input.termMonths;
      } else {
        payment = principal * (monthlyRate / (1 - Math.pow(1 + monthlyRate, -input.termMonths)));
      }
      double totalPayment = payment * input.termMonths;
      result.principal = round2(principal);
      result.monthlyPayment = round2(payment);
      result.totalPayment = round2(totalPayment);
      result.totalInterest = round2(totalPayment - principal);
    }

    return result;
  }

  private String resolveTitle(SimulationRequest request, SimulationInput input) {
    if (request != null && request.title != null && !request.title.isBlank()) {
      return request.title.trim();
    }
    return switch (input.type) {
      case "savings" -> "Simulación ahorro";
      case "mortgage" -> "Simulación hipoteca";
      default -> "Simulación préstamo";
    };
  }

  private String normalizeType(String type) {
    if (type == null || type.isBlank()) {
      return "loan";
    }
    String normalized = type.trim().toLowerCase(Locale.ROOT);
    if (normalized.equals("hipoteca")) {
      return "mortgage";
    }
    if (normalized.equals("ahorro")) {
      return "savings";
    }
    if (normalized.equals("mortgage") || normalized.equals("loan") || normalized.equals("savings")) {
      return normalized;
    }
    return "loan";
  }

  private double requirePositive(Double value, String field) {
    if (value == null || value <= 0d) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, field + " is required");
    }
    return value;
  }

  private double optionalPositive(Double value, double fallback) {
    if (value == null) {
      return fallback;
    }
    if (value < 0d) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Values must be positive");
    }
    return value;
  }

  private double round2(double value) {
    return BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_UP).doubleValue();
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
    String fromEnv = System.getenv("FINANCIAL_SIMULATOR_MODEL");
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
    Object response = parsed.get("response");
    return response != null ? String.valueOf(response) : String.valueOf(output);
  }

  public static class SimulationRequest {
    public String title;
    public String type;
    public Double principal;
    public Double annualRate;
    public Integer termMonths;
    public Integer termYears;
    public Double monthlyContribution;
    public Double initialDeposit;
    public String currency;
    public Boolean includeExplanation;
  }

  public static class SimulationSummary {
    public String id;
    public String title;
    public String type;
    public String currency;
    public String status;
    public LocalDateTime createdAt;
    public LocalDateTime updatedAt;
    public Map<String, Object> result;
  }

  public static class SimulationDetail {
    public SimulationSummary summary;
    public Map<String, Object> input;
    public Map<String, Object> result;
    public String explanation;
    public String model;
    public String providerId;
  }

  private static class SimulationInput {
    private String type;
    private String currency;
    private Double principal;
    private Double annualRate;
    private Integer termMonths;
    private Double monthlyContribution;
    private Double initialDeposit;

    private Map<String, Object> toPayload() {
      Map<String, Object> payload = new LinkedHashMap<>();
      payload.put("type", type);
      payload.put("currency", currency);
      payload.put("termMonths", termMonths);
      payload.put("annualRate", annualRate);
      if (principal != null) {
        payload.put("principal", principal);
      }
      if (initialDeposit != null) {
        payload.put("initialDeposit", initialDeposit);
      }
      if (monthlyContribution != null) {
        payload.put("monthlyContribution", monthlyContribution);
      }
      return payload;
    }
  }

  private static class SimulationResult {
    private String type;
    private String currency;
    private Double principal;
    private Double annualRate;
    private Integer termMonths;
    private Double monthlyPayment;
    private Double totalPayment;
    private Double totalInterest;
    private Double initialDeposit;
    private Double monthlyContribution;
    private Double finalAmount;
    private Double totalContribution;

    private Map<String, Object> toPayload() {
      Map<String, Object> payload = new LinkedHashMap<>();
      payload.put("type", type);
      payload.put("currency", currency);
      payload.put("termMonths", termMonths);
      payload.put("annualRate", annualRate);
      if (principal != null) {
        payload.put("principal", principal);
      }
      if (monthlyPayment != null) {
        payload.put("monthlyPayment", monthlyPayment);
      }
      if (totalPayment != null) {
        payload.put("totalPayment", totalPayment);
      }
      if (totalInterest != null) {
        payload.put("totalInterest", totalInterest);
      }
      if (initialDeposit != null) {
        payload.put("initialDeposit", initialDeposit);
      }
      if (monthlyContribution != null) {
        payload.put("monthlyContribution", monthlyContribution);
      }
      if (finalAmount != null) {
        payload.put("finalAmount", finalAmount);
      }
      if (totalContribution != null) {
        payload.put("totalContribution", totalContribution);
      }
      return payload;
    }
  }
}
