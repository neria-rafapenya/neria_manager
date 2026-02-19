package com.neria.manager.surveys;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.neria.manager.common.entities.ServiceCatalog;
import com.neria.manager.common.entities.TenantServiceConfig;
import com.neria.manager.common.entities.TenantServiceEndpoint;
import com.neria.manager.common.entities.TenantServiceSurvey;
import com.neria.manager.common.entities.TenantServiceSurveyAnswer;
import com.neria.manager.common.entities.TenantServiceSurveyInsight;
import com.neria.manager.common.entities.TenantServiceSurveyQuestion;
import com.neria.manager.common.entities.TenantServiceSurveyResponse;
import com.neria.manager.common.repos.ServiceCatalogRepository;
import com.neria.manager.common.repos.TenantServiceConfigRepository;
import com.neria.manager.common.repos.TenantServiceEndpointRepository;
import com.neria.manager.common.repos.TenantServiceSurveyAnswerRepository;
import com.neria.manager.common.repos.TenantServiceSurveyInsightRepository;
import com.neria.manager.common.repos.TenantServiceSurveyQuestionRepository;
import com.neria.manager.common.repos.TenantServiceSurveyRepository;
import com.neria.manager.common.repos.TenantServiceSurveyResponseRepository;
import com.neria.manager.runtime.ExecuteRequest;
import com.neria.manager.runtime.RuntimeService;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class SurveysService {
  private static final Logger log = LoggerFactory.getLogger(SurveysService.class);
  private static final String DEFAULT_STATUS = "draft";
  private static final int MAX_ANALYSIS_RESPONSES = 200;
  private static final String ENDPOINT_SURVEYS_LIST = "surveys_list";
  private static final String ENDPOINT_SURVEY_RESPONSES = "survey_responses";
  private static final String ENDPOINT_SURVEY_SUBMIT = "survey_submit";

  private static final String DEFAULT_ANALYSIS_PROMPT =
      "Eres un analista experto en encuestas. Debes generar insights claros y accionables "
          + "a partir de respuestas abiertas y estructuradas. Devuelve SOLO un JSON valido. "
          + "No inventes datos. Si falta informacion, usa null o listas vacias.\n\n"
          + "Entrega este formato exacto:\n"
          + "{\n"
          + "  \"summary\": \"resumen ejecutivo en 5-8 frases\",\n"
          + "  \"sentiment\": {\"positive\": 0, \"neutral\": 0, \"negative\": 0, \"notes\": \"\"},\n"
          + "  \"themes\": [\"tema 1\", \"tema 2\"],\n"
          + "  \"insights\": [\"insight 1\", \"insight 2\"],\n"
          + "  \"risks\": [\"riesgo 1\"],\n"
          + "  \"opportunities\": [\"oportunidad 1\"],\n"
          + "  \"highlights\": [\"cita corta sin PII\"]\n"
          + "}\n\n"
          + "Usa el idioma de la encuesta.";

  private final TenantServiceSurveyRepository surveyRepository;
  private final TenantServiceSurveyQuestionRepository questionRepository;
  private final TenantServiceSurveyResponseRepository responseRepository;
  private final TenantServiceSurveyAnswerRepository answerRepository;
  private final TenantServiceSurveyInsightRepository insightRepository;
  private final ServiceCatalogRepository serviceCatalogRepository;
  private final TenantServiceConfigRepository configRepository;
  private final TenantServiceEndpointRepository endpointRepository;
  private final RuntimeService runtimeService;
  private final ObjectMapper objectMapper;
  private final HttpClient httpClient = HttpClient.newBuilder().build();

  public SurveysService(
      TenantServiceSurveyRepository surveyRepository,
      TenantServiceSurveyQuestionRepository questionRepository,
      TenantServiceSurveyResponseRepository responseRepository,
      TenantServiceSurveyAnswerRepository answerRepository,
      TenantServiceSurveyInsightRepository insightRepository,
      ServiceCatalogRepository serviceCatalogRepository,
      TenantServiceConfigRepository configRepository,
      TenantServiceEndpointRepository endpointRepository,
      RuntimeService runtimeService,
      ObjectMapper objectMapper) {
    this.surveyRepository = surveyRepository;
    this.questionRepository = questionRepository;
    this.responseRepository = responseRepository;
    this.answerRepository = answerRepository;
    this.insightRepository = insightRepository;
    this.serviceCatalogRepository = serviceCatalogRepository;
    this.configRepository = configRepository;
    this.endpointRepository = endpointRepository;
    this.runtimeService = runtimeService;
    this.objectMapper = objectMapper;
  }

  public List<SurveySummary> listSurveys(String tenantId, String serviceCode) {
    String normalized = normalizeServiceCode(serviceCode);
    requireService(normalized);
    List<TenantServiceSurvey> surveys =
        surveyRepository.findByTenantIdAndServiceCodeOrderByCreatedAtDesc(tenantId, normalized);
    return surveys.stream().map(this::toSummary).toList();
  }

  public Object listExternalSurveys(String tenantId, String serviceCode) {
    String normalized = normalizeServiceCode(serviceCode);
    requireService(normalized);
    TenantServiceEndpoint endpoint = resolveEndpoint(tenantId, normalized, ENDPOINT_SURVEYS_LIST);
    if (endpoint == null) {
      return Map.of("items", List.of());
    }
    return fetchEndpoint(endpoint, Map.of("tenantId", tenantId, "serviceCode", normalized));
  }

  public SurveyDetail getSurvey(String tenantId, String serviceCode, String surveyId) {
    TenantServiceSurvey survey = requireSurvey(tenantId, serviceCode, surveyId);
    return toDetail(survey, questionRepository.findBySurveyIdOrderByOrderIndexAsc(survey.getId()));
  }

  public SurveySummary createSurvey(
      String tenantId, String serviceCode, SurveyRequest request) {
    String normalized = normalizeServiceCode(serviceCode);
    requireService(normalized);
    if (request == null || request.title == null || request.title.trim().isEmpty()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Title required");
    }
    TenantServiceSurvey survey = new TenantServiceSurvey();
    survey.setId(UUID.randomUUID().toString());
    survey.setTenantId(tenantId);
    survey.setServiceCode(normalized);
    survey.setPublicCode(generatePublicCode());
    applySurveyChanges(survey, request, true);
    survey.setCreatedAt(LocalDateTime.now());
    survey.setUpdatedAt(LocalDateTime.now());
    return toSummary(surveyRepository.save(survey));
  }

  public SurveySummary updateSurvey(
      String tenantId, String serviceCode, String surveyId, SurveyRequest request) {
    TenantServiceSurvey survey = requireSurvey(tenantId, serviceCode, surveyId);
    applySurveyChanges(survey, request, false);
    survey.setUpdatedAt(LocalDateTime.now());
    return toSummary(surveyRepository.save(survey));
  }

  @Transactional
  public void deleteSurvey(String tenantId, String serviceCode, String surveyId) {
    TenantServiceSurvey survey = requireSurvey(tenantId, serviceCode, surveyId);
    answerRepository.deleteBySurveyId(survey.getId());
    responseRepository.deleteBySurveyId(survey.getId());
    questionRepository.deleteBySurveyId(survey.getId());
    insightRepository.deleteAll(insightRepository.findBySurveyIdOrderByCreatedAtDesc(survey.getId()));
    surveyRepository.deleteById(survey.getId());
  }

  public SurveyQuestionResponse createQuestion(
      String tenantId, String serviceCode, String surveyId, QuestionRequest request) {
    TenantServiceSurvey survey = requireSurvey(tenantId, serviceCode, surveyId);
    TenantServiceSurveyQuestion question = new TenantServiceSurveyQuestion();
    question.setId(UUID.randomUUID().toString());
    question.setSurveyId(survey.getId());
    question.setTenantId(tenantId);
    question.setServiceCode(survey.getServiceCode());
    applyQuestionChanges(question, request, true, survey.getId());
    question.setCreatedAt(LocalDateTime.now());
    question.setUpdatedAt(LocalDateTime.now());
    return toQuestionResponse(questionRepository.save(question));
  }

  public SurveyQuestionResponse updateQuestion(
      String tenantId,
      String serviceCode,
      String surveyId,
      String questionId,
      QuestionRequest request) {
    requireSurvey(tenantId, serviceCode, surveyId);
    TenantServiceSurveyQuestion question =
        questionRepository
            .findByIdAndSurveyId(questionId, surveyId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Question not found"));
    applyQuestionChanges(question, request, false, surveyId);
    question.setUpdatedAt(LocalDateTime.now());
    return toQuestionResponse(questionRepository.save(question));
  }

  public void deleteQuestion(
      String tenantId, String serviceCode, String surveyId, String questionId) {
    requireSurvey(tenantId, serviceCode, surveyId);
    TenantServiceSurveyQuestion question =
        questionRepository
            .findByIdAndSurveyId(questionId, surveyId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Question not found"));
    questionRepository.deleteById(question.getId());
  }

  public List<SurveyResponseSummary> listResponses(
      String tenantId, String serviceCode, String surveyId) {
    requireSurvey(tenantId, serviceCode, surveyId);
    List<TenantServiceSurveyResponse> responses =
        responseRepository.findBySurveyIdOrderBySubmittedAtDesc(surveyId);
    if (responses.isEmpty()) {
      return List.of();
    }
    List<TenantServiceSurveyAnswer> answers = answerRepository.findBySurveyId(surveyId);
    Map<String, Long> answerCounts =
        answers.stream().collect(Collectors.groupingBy(TenantServiceSurveyAnswer::getResponseId, Collectors.counting()));
    return responses.stream()
        .map(response -> toResponseSummary(response, answerCounts.getOrDefault(response.getId(), 0L)))
        .toList();
  }

  public Object listExternalResponses(String tenantId, String serviceCode, String surveyId) {
    String normalized = normalizeServiceCode(serviceCode);
    requireSurvey(tenantId, normalized, surveyId);
    TenantServiceEndpoint endpoint = resolveEndpoint(tenantId, normalized, ENDPOINT_SURVEY_RESPONSES);
    if (endpoint == null) {
      return Map.of("items", List.of());
    }
    return fetchEndpoint(
        endpoint,
        Map.of(
            "tenantId", tenantId,
            "serviceCode", normalized,
            "surveyId", surveyId));
  }

  public SurveyResponseDetail getResponse(
      String tenantId, String serviceCode, String surveyId, String responseId) {
    requireSurvey(tenantId, serviceCode, surveyId);
    TenantServiceSurveyResponse response =
        responseRepository
            .findByIdAndSurveyId(responseId, surveyId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Response not found"));
    List<TenantServiceSurveyAnswer> answers = answerRepository.findByResponseId(response.getId());
    return toResponseDetail(response, answers);
  }

  @Transactional
  public SurveyResponseDetail recordResponse(
      TenantServiceSurvey survey, SurveySubmissionRequest request, Map<String, Object> metadata) {
    if (!survey.isAllowMultiple() && request != null && request.respondentEmail != null) {
      long existing =
          responseRepository.countBySurveyIdAndRespondentEmail(
              survey.getId(), request.respondentEmail.trim().toLowerCase(Locale.ROOT));
      if (existing > 0) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Response already submitted");
      }
    }
    List<TenantServiceSurveyQuestion> questions =
        questionRepository.findBySurveyIdOrderByOrderIndexAsc(survey.getId());
    Map<String, TenantServiceSurveyQuestion> questionMap =
        questions.stream().collect(Collectors.toMap(TenantServiceSurveyQuestion::getId, q -> q));
    validateAnswers(questions, request);

    TenantServiceSurveyResponse response = new TenantServiceSurveyResponse();
    response.setId(UUID.randomUUID().toString());
    response.setSurveyId(survey.getId());
    response.setTenantId(survey.getTenantId());
    response.setServiceCode(survey.getServiceCode());
    response.setStatus("submitted");
    response.setRespondentEmail(
        request != null && request.respondentEmail != null
            ? request.respondentEmail.trim().toLowerCase(Locale.ROOT)
            : null);
    response.setRespondentName(
        request != null && request.respondentName != null ? request.respondentName.trim() : null);
    response.setSubmittedAt(LocalDateTime.now());
    response.setCreatedAt(LocalDateTime.now());
    response.setUpdatedAt(LocalDateTime.now());
    if (metadata != null && !metadata.isEmpty()) {
      response.setMetadata(toJson(metadata));
    }
    responseRepository.save(response);

    List<TenantServiceSurveyAnswer> answers = new ArrayList<>();
    if (request != null && request.answers != null) {
      for (SurveyAnswerInput input : request.answers) {
        if (input == null || input.questionId == null) {
          continue;
        }
        TenantServiceSurveyQuestion question = questionMap.get(input.questionId);
        if (question == null) {
          continue;
        }
        AnswerValue value = normalizeAnswer(input.value);
        TenantServiceSurveyAnswer answer = new TenantServiceSurveyAnswer();
        answer.setId(UUID.randomUUID().toString());
        answer.setSurveyId(survey.getId());
        answer.setResponseId(response.getId());
        answer.setQuestionId(question.getId());
        answer.setTenantId(survey.getTenantId());
        answer.setServiceCode(survey.getServiceCode());
        answer.setValueText(value.text);
        answer.setValueNumber(value.number);
        answer.setValueJson(value.json);
        answer.setCreatedAt(LocalDateTime.now());
        answers.add(answerRepository.save(answer));
      }
    }

    pushResponseToEndpoint(survey, response, answers);
    return toResponseDetail(response, answers);
  }

  public List<SurveyInsightResponse> listInsights(
      String tenantId, String serviceCode, String surveyId) {
    requireSurvey(tenantId, serviceCode, surveyId);
    return insightRepository.findBySurveyIdOrderByCreatedAtDesc(surveyId).stream()
        .map(this::toInsightResponse)
        .toList();
  }

  public SurveyInsightResponse runInsights(
      String tenantId, String serviceCode, String surveyId) {
    TenantServiceSurvey survey = requireSurvey(tenantId, serviceCode, surveyId);
    TenantServiceConfig config =
        configRepository.findByTenantIdAndServiceCode(tenantId, survey.getServiceCode()).orElse(null);
    if (config == null || config.getProviderId() == null || config.getProviderId().isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Provider required for analysis");
    }
    String model = resolveAnalysisModel();
    List<TenantServiceSurveyQuestion> questions =
        questionRepository.findBySurveyIdOrderByOrderIndexAsc(surveyId);
    List<TenantServiceSurveyResponse> responses =
        responseRepository.findBySurveyIdOrderBySubmittedAtDesc(surveyId);
    if (responses.isEmpty()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No responses to analyze");
    }
    List<TenantServiceSurveyAnswer> answers = answerRepository.findBySurveyId(surveyId);

    Map<String, List<TenantServiceSurveyAnswer>> answersByResponse =
        answers.stream().collect(Collectors.groupingBy(TenantServiceSurveyAnswer::getResponseId));

    List<Map<String, Object>> responsePayload = new ArrayList<>();
    int limit = Math.min(responses.size(), MAX_ANALYSIS_RESPONSES);
    for (int i = 0; i < limit; i++) {
      TenantServiceSurveyResponse response = responses.get(i);
      List<TenantServiceSurveyAnswer> responseAnswers =
          answersByResponse.getOrDefault(response.getId(), List.of());
      List<Map<String, Object>> answerPayload = new ArrayList<>();
      for (TenantServiceSurveyAnswer answer : responseAnswers) {
        TenantServiceSurveyQuestion question =
            questions.stream()
                .filter(q -> q.getId().equals(answer.getQuestionId()))
                .findFirst()
                .orElse(null);
        Map<String, Object> entry = new HashMap<>();
        entry.put("questionId", answer.getQuestionId());
        entry.put("questionLabel", question != null ? question.getLabel() : null);
        entry.put("type", question != null ? question.getType() : null);
        entry.put("value", extractAnswerValue(answer));
        answerPayload.add(entry);
      }
      Map<String, Object> responseEntry = new HashMap<>();
      responseEntry.put("responseId", response.getId());
      responseEntry.put("submittedAt", response.getSubmittedAt());
      responseEntry.put("answers", answerPayload);
      responsePayload.add(responseEntry);
    }

    Map<String, Object> surveyPayload = new HashMap<>();
    surveyPayload.put("surveyId", survey.getId());
    surveyPayload.put("title", survey.getTitle());
    surveyPayload.put("description", survey.getDescription());
    surveyPayload.put("language", survey.getLanguage());
    surveyPayload.put(
        "questions",
        questions.stream()
            .map(
                question ->
                    Map.of(
                        "id",
                        question.getId(),
                        "label",
                        question.getLabel(),
                        "type",
                        question.getType(),
                        "required",
                        question.isRequired()))
            .toList());

    Map<String, Object> payload = Map.of("survey", surveyPayload, "responses", responsePayload);

    String prompt = buildAnalysisPrompt(config, survey);
    ExecuteRequest exec = new ExecuteRequest();
    exec.providerId = config.getProviderId();
    exec.model = model;
    exec.serviceCode = survey.getServiceCode();
    exec.payload =
        Map.of(
            "messages",
            List.of(
                Map.of("role", "system", "content", prompt),
                Map.of("role", "user", "content", toJson(payload))));

    TenantServiceSurveyInsight insight = new TenantServiceSurveyInsight();
    insight.setId(UUID.randomUUID().toString());
    insight.setSurveyId(survey.getId());
    insight.setTenantId(survey.getTenantId());
    insight.setServiceCode(survey.getServiceCode());
    insight.setModel(model);
    insight.setStatus("completed");
    insight.setCreatedAt(LocalDateTime.now());

    try {
      Object response = runtimeService.execute(tenantId, exec);
      String content = extractContent(response);
      String json = content != null ? stripJsonFence(content) : "";
      insight.setPayload(json);
    } catch (Exception ex) {
      insight.setStatus("failed");
      insight.setErrorMessage(ex.getMessage());
      insight.setPayload(null);
    }
    TenantServiceSurveyInsight saved = insightRepository.save(insight);
    return toInsightResponse(saved);
  }

  public TenantServiceSurvey requirePublicSurvey(String publicCode) {
    TenantServiceSurvey survey =
        surveyRepository
            .findByPublicCode(publicCode)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Survey not found"));
    if (!"active".equalsIgnoreCase(survey.getStatus())) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Survey not available");
    }
    LocalDateTime now = LocalDateTime.now();
    if (survey.getStartAt() != null && now.isBefore(survey.getStartAt())) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Survey not available");
    }
    if (survey.getEndAt() != null && now.isAfter(survey.getEndAt())) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Survey not available");
    }
    return survey;
  }

  public PublicSurveyDetail getPublicSurvey(String publicCode) {
    TenantServiceSurvey survey = requirePublicSurvey(publicCode);
    List<TenantServiceSurveyQuestion> questions =
        questionRepository.findBySurveyIdOrderByOrderIndexAsc(survey.getId());
    return toPublicDetail(survey, questions);
  }

  @Transactional
  public SurveyResponseDetail submitPublicSurvey(
      String publicCode, SurveySubmissionRequest request, Map<String, Object> metadata) {
    TenantServiceSurvey survey = requirePublicSurvey(publicCode);
    return recordResponse(survey, request, metadata);
  }

  public String exportResponsesCsv(String tenantId, String serviceCode, String surveyId) {
    TenantServiceSurvey survey = requireSurvey(tenantId, serviceCode, surveyId);
    List<TenantServiceSurveyQuestion> questions =
        questionRepository.findBySurveyIdOrderByOrderIndexAsc(survey.getId());
    List<TenantServiceSurveyResponse> responses =
        responseRepository.findBySurveyIdOrderBySubmittedAtDesc(survey.getId());
    List<TenantServiceSurveyAnswer> answers = answerRepository.findBySurveyId(survey.getId());
    Map<String, List<TenantServiceSurveyAnswer>> byResponse =
        answers.stream().collect(Collectors.groupingBy(TenantServiceSurveyAnswer::getResponseId));

    List<String> headers = new ArrayList<>();
    headers.add("responseId");
    headers.add("submittedAt");
    headers.add("respondentEmail");
    headers.add("respondentName");
    for (TenantServiceSurveyQuestion question : questions) {
      headers.add(question.getLabel());
    }
    StringBuilder sb = new StringBuilder();
    sb.append(headers.stream().map(this::csvEscape).collect(Collectors.joining(","))).append("\n");
    for (TenantServiceSurveyResponse response : responses) {
      List<String> row = new ArrayList<>();
      row.add(response.getId());
      row.add(response.getSubmittedAt() != null ? response.getSubmittedAt().toString() : "");
      row.add(nullToEmpty(response.getRespondentEmail()));
      row.add(nullToEmpty(response.getRespondentName()));
      Map<String, TenantServiceSurveyAnswer> answersMap =
          byResponse.getOrDefault(response.getId(), List.of()).stream()
              .collect(Collectors.toMap(TenantServiceSurveyAnswer::getQuestionId, a -> a, (a, b) -> a));
      for (TenantServiceSurveyQuestion question : questions) {
        TenantServiceSurveyAnswer answer = answersMap.get(question.getId());
        row.add(answer != null ? nullToEmpty(String.valueOf(extractAnswerValue(answer))) : "");
      }
      sb.append(row.stream().map(this::csvEscape).collect(Collectors.joining(","))).append("\n");
    }
    return sb.toString();
  }

  private SurveySummary toSummary(TenantServiceSurvey survey) {
    SurveySummary summary = new SurveySummary();
    summary.id = survey.getId();
    summary.title = survey.getTitle();
    summary.description = survey.getDescription();
    summary.status = survey.getStatus();
    summary.language = survey.getLanguage();
    summary.publicCode = survey.getPublicCode();
    summary.allowMultiple = survey.isAllowMultiple();
    summary.collectEmail = survey.isCollectEmail();
    summary.anonymous = survey.isAnonymous();
    summary.welcomeText = survey.getWelcomeText();
    summary.thankYouText = survey.getThankYouText();
    summary.questionCount = questionRepository.countBySurveyId(survey.getId());
    summary.responseCount = responseRepository.countBySurveyId(survey.getId());
    summary.startAt = survey.getStartAt();
    summary.endAt = survey.getEndAt();
    summary.createdAt = survey.getCreatedAt();
    summary.updatedAt = survey.getUpdatedAt();
    return summary;
  }

  private SurveyDetail toDetail(TenantServiceSurvey survey, List<TenantServiceSurveyQuestion> questions) {
    SurveyDetail detail = new SurveyDetail();
    detail.summary = toSummary(survey);
    detail.questions = questions.stream().map(this::toQuestionResponse).toList();
    return detail;
  }

  private PublicSurveyDetail toPublicDetail(
      TenantServiceSurvey survey, List<TenantServiceSurveyQuestion> questions) {
    PublicSurveyDetail detail = new PublicSurveyDetail();
    detail.publicCode = survey.getPublicCode();
    detail.title = survey.getTitle();
    detail.description = survey.getDescription();
    detail.welcomeText = survey.getWelcomeText();
    detail.thankYouText = survey.getThankYouText();
    detail.language = survey.getLanguage();
    detail.collectEmail = survey.isCollectEmail();
    detail.anonymous = survey.isAnonymous();
    detail.questions = questions.stream().map(this::toPublicQuestion).toList();
    return detail;
  }

  private SurveyQuestionResponse toQuestionResponse(TenantServiceSurveyQuestion question) {
    SurveyQuestionResponse response = new SurveyQuestionResponse();
    response.id = question.getId();
    response.label = question.getLabel();
    response.description = question.getDescription();
    response.type = question.getType();
    response.required = question.isRequired();
    response.orderIndex = question.getOrderIndex();
    response.options = parseOptions(question.getOptions());
    response.scaleMin = question.getScaleMin();
    response.scaleMax = question.getScaleMax();
    response.scaleMinLabel = question.getScaleMinLabel();
    response.scaleMaxLabel = question.getScaleMaxLabel();
    return response;
  }

  private PublicSurveyQuestion toPublicQuestion(TenantServiceSurveyQuestion question) {
    PublicSurveyQuestion response = new PublicSurveyQuestion();
    response.id = question.getId();
    response.label = question.getLabel();
    response.description = question.getDescription();
    response.type = question.getType();
    response.required = question.isRequired();
    response.orderIndex = question.getOrderIndex();
    response.options = parseOptions(question.getOptions());
    response.scaleMin = question.getScaleMin();
    response.scaleMax = question.getScaleMax();
    response.scaleMinLabel = question.getScaleMinLabel();
    response.scaleMaxLabel = question.getScaleMaxLabel();
    return response;
  }

  private SurveyResponseSummary toResponseSummary(
      TenantServiceSurveyResponse response, long answerCount) {
    SurveyResponseSummary summary = new SurveyResponseSummary();
    summary.id = response.getId();
    summary.status = response.getStatus();
    summary.respondentEmail = response.getRespondentEmail();
    summary.respondentName = response.getRespondentName();
    summary.submittedAt = response.getSubmittedAt();
    summary.answerCount = answerCount;
    return summary;
  }

  private SurveyResponseDetail toResponseDetail(
      TenantServiceSurveyResponse response, List<TenantServiceSurveyAnswer> answers) {
    SurveyResponseDetail detail = new SurveyResponseDetail();
    detail.id = response.getId();
    detail.status = response.getStatus();
    detail.respondentEmail = response.getRespondentEmail();
    detail.respondentName = response.getRespondentName();
    detail.submittedAt = response.getSubmittedAt();
    detail.answers =
        answers.stream()
            .map(
                answer -> {
                  SurveyAnswerView view = new SurveyAnswerView();
                  view.questionId = answer.getQuestionId();
                  view.value = extractAnswerValue(answer);
                  return view;
                })
            .toList();
    return detail;
  }

  private SurveyInsightResponse toInsightResponse(TenantServiceSurveyInsight insight) {
    SurveyInsightResponse response = new SurveyInsightResponse();
    response.id = insight.getId();
    response.model = insight.getModel();
    response.status = insight.getStatus();
    response.payload = insight.getPayload();
    response.errorMessage = insight.getErrorMessage();
    response.createdAt = insight.getCreatedAt();
    return response;
  }

  private void applySurveyChanges(
      TenantServiceSurvey survey, SurveyRequest request, boolean creating) {
    if (request == null) {
      return;
    }
    if (request.title != null) {
      survey.setTitle(request.title.trim());
    } else if (creating && survey.getTitle() == null) {
      survey.setTitle("Encuesta");
    }
    if (request.description != null) {
      survey.setDescription(trimToNull(request.description));
    }
    if (request.status != null) {
      survey.setStatus(request.status.trim().toLowerCase(Locale.ROOT));
    } else if (creating) {
      survey.setStatus(DEFAULT_STATUS);
    }
    if (request.language != null) {
      survey.setLanguage(trimToNull(request.language));
    }
    if (request.allowMultiple != null) {
      survey.setAllowMultiple(request.allowMultiple);
    } else if (creating) {
      survey.setAllowMultiple(true);
    }
    if (request.collectEmail != null) {
      survey.setCollectEmail(request.collectEmail);
    } else if (creating) {
      survey.setCollectEmail(false);
    }
    if (request.anonymous != null) {
      survey.setAnonymous(request.anonymous);
    } else if (creating) {
      survey.setAnonymous(true);
    }
    if (request.startAt != null) {
      survey.setStartAt(request.startAt);
    }
    if (request.endAt != null) {
      survey.setEndAt(request.endAt);
    }
    if (request.welcomeText != null) {
      survey.setWelcomeText(trimToNull(request.welcomeText));
    }
    if (request.thankYouText != null) {
      survey.setThankYouText(trimToNull(request.thankYouText));
    }
  }

  private void applyQuestionChanges(
      TenantServiceSurveyQuestion question,
      QuestionRequest request,
      boolean creating,
      String surveyId) {
    if (request == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Question payload required");
    }
    if (request.label != null) {
      question.setLabel(request.label.trim());
    } else if (creating && question.getLabel() == null) {
      question.setLabel("Pregunta");
    }
    if (request.description != null) {
      question.setDescription(trimToNull(request.description));
    }
    if (request.type != null) {
      question.setType(request.type.trim().toLowerCase(Locale.ROOT));
    } else if (creating && question.getType() == null) {
      question.setType("text");
    }
    if (request.required != null) {
      question.setRequired(request.required);
    } else if (creating) {
      question.setRequired(false);
    }
    if (request.orderIndex != null) {
      question.setOrderIndex(request.orderIndex);
    } else if (creating) {
      long count = questionRepository.countBySurveyId(surveyId);
      question.setOrderIndex((int) count + 1);
    }
    if (request.options != null) {
      question.setOptions(toJson(request.options));
    }
    if (request.scaleMin != null) {
      question.setScaleMin(request.scaleMin);
    }
    if (request.scaleMax != null) {
      question.setScaleMax(request.scaleMax);
    }
    if (request.scaleMinLabel != null) {
      question.setScaleMinLabel(trimToNull(request.scaleMinLabel));
    }
    if (request.scaleMaxLabel != null) {
      question.setScaleMaxLabel(trimToNull(request.scaleMaxLabel));
    }
  }

  private void validateAnswers(
      List<TenantServiceSurveyQuestion> questions, SurveySubmissionRequest request) {
    if (questions == null || questions.isEmpty()) {
      return;
    }
    Map<String, SurveyAnswerInput> answers = new HashMap<>();
    if (request != null && request.answers != null) {
      for (SurveyAnswerInput input : request.answers) {
        if (input != null && input.questionId != null) {
          answers.put(input.questionId, input);
        }
      }
    }
    for (TenantServiceSurveyQuestion question : questions) {
      if (!question.isRequired()) {
        continue;
      }
      SurveyAnswerInput input = answers.get(question.getId());
      if (input == null || input.value == null || String.valueOf(input.value).trim().isEmpty()) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing required answer");
      }
    }
  }

  private String buildAnalysisPrompt(TenantServiceConfig config, TenantServiceSurvey survey) {
    StringBuilder sb = new StringBuilder();
    if (config != null && config.getSystemPrompt() != null && !config.getSystemPrompt().isBlank()) {
      sb.append(config.getSystemPrompt().trim()).append("\n\n");
    }
    sb.append(DEFAULT_ANALYSIS_PROMPT);
    if (survey.getLanguage() != null && !survey.getLanguage().isBlank()) {
      sb.append("\nIdioma encuesta: ").append(survey.getLanguage().trim());
    }
    return sb.toString();
  }

  private String resolveAnalysisModel() {
    String fromEnv = System.getenv("SURVEY_ANALYSIS_MODEL");
    if (fromEnv == null || fromEnv.isBlank()) {
      fromEnv = System.getenv("EMAIL_AUTOMATION_MODEL");
    }
    return fromEnv != null && !fromEnv.isBlank() ? fromEnv : "gpt-4.1-mini";
  }

  private TenantServiceSurvey requireSurvey(String tenantId, String serviceCode, String surveyId) {
    String normalized = normalizeServiceCode(serviceCode);
    requireService(normalized);
    return surveyRepository
        .findByIdAndTenantIdAndServiceCode(surveyId, tenantId, normalized)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Survey not found"));
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

  private String generatePublicCode() {
    String code = UUID.randomUUID().toString().replace("-", "");
    return code.length() > 20 ? code.substring(0, 20) : code;
  }

  private AnswerValue normalizeAnswer(Object value) {
    AnswerValue result = new AnswerValue();
    if (value == null) {
      return result;
    }
    if (value instanceof Number number) {
      result.number = number.doubleValue();
      result.text = String.valueOf(number);
      return result;
    }
    if (value instanceof Boolean bool) {
      result.text = bool ? "true" : "false";
      return result;
    }
    if (value instanceof Map || value instanceof List) {
      result.json = toJson(value);
      result.text = null;
      return result;
    }
    String text = String.valueOf(value).trim();
    result.text = text.isBlank() ? null : text;
    return result;
  }

  private Object extractAnswerValue(TenantServiceSurveyAnswer answer) {
    if (answer.getValueJson() != null && !answer.getValueJson().isBlank()) {
      try {
        return objectMapper.readValue(answer.getValueJson(), Object.class);
      } catch (Exception ex) {
        return answer.getValueJson();
      }
    }
    if (answer.getValueNumber() != null) {
      return answer.getValueNumber();
    }
    return answer.getValueText();
  }

  private List<String> parseOptions(String optionsJson) {
    if (optionsJson == null || optionsJson.isBlank()) {
      return List.of();
    }
    try {
      return objectMapper.readValue(optionsJson, new TypeReference<List<String>>() {});
    } catch (Exception ex) {
      return List.of();
    }
  }

  private String toJson(Object value) {
    try {
      return objectMapper.writeValueAsString(value);
    } catch (Exception ex) {
      return "{}";
    }
  }

  private String trimToNull(String value) {
    if (value == null) {
      return null;
    }
    String trimmed = value.trim();
    return trimmed.isBlank() ? null : trimmed;
  }

  private String csvEscape(String value) {
    if (value == null) {
      return "";
    }
    String escaped = value.replace("\"", "\"\"");
    return "\"" + escaped + "\"";
  }

  private String nullToEmpty(String value) {
    return value == null ? "" : value;
  }

  private String extractContent(Object response) {
    if (!(response instanceof Map<?, ?> map)) {
      return null;
    }
    Object output = map.get("output");
    if (!(output instanceof Map<?, ?> outputMap)) {
      return null;
    }
    Object choicesObj = outputMap.get("choices");
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
    Object responseField = outputMap.get("response");
    return responseField != null ? String.valueOf(responseField) : null;
  }

  private String stripJsonFence(String content) {
    if (content == null) {
      return "";
    }
    String trimmed = content.trim();
    if (trimmed.startsWith("```")) {
      int start = trimmed.indexOf("\n");
      int end = trimmed.lastIndexOf("```");
      if (start > 0 && end > start) {
        return trimmed.substring(start + 1, end).trim();
      }
    }
    return trimmed;
  }

  private TenantServiceEndpoint resolveEndpoint(
      String tenantId, String serviceCode, String slug) {
    List<TenantServiceEndpoint> endpoints =
        endpointRepository.findByTenantIdAndServiceCodeOrderByCreatedAtDesc(tenantId, serviceCode);
    return endpoints.stream()
        .filter(endpoint -> endpoint != null && endpoint.isEnabled())
        .filter(endpoint -> slug.equalsIgnoreCase(endpoint.getSlug()))
        .findFirst()
        .orElse(null);
  }

  private Object fetchEndpoint(TenantServiceEndpoint endpoint, Map<String, String> tokens) {
    try {
      String url = buildEndpointUrl(endpoint, tokens);
      HttpRequest.Builder builder =
          HttpRequest.newBuilder().uri(URI.create(url)).GET().header("Accept", "application/json");
      Map<String, String> headers = parseHeaders(endpoint.getHeaders());
      for (var entry : headers.entrySet()) {
        builder.header(entry.getKey(), entry.getValue());
      }
      HttpResponse<String> response =
          httpClient.send(builder.build(), HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
      if (response.statusCode() < 200 || response.statusCode() >= 300) {
        return Map.of("error", "endpoint_failed", "status", response.statusCode());
      }
      String body = response.body();
      Object data =
          body == null || body.isBlank() ? Map.of() : objectMapper.readValue(body, Object.class);
      if (endpoint.getResponsePath() != null && !endpoint.getResponsePath().isBlank()) {
        Object extracted = extractByPath(data, endpoint.getResponsePath());
        return Map.of("items", extracted != null ? extracted : List.of());
      }
      return data;
    } catch (Exception ex) {
      return Map.of("error", ex.getMessage() != null ? ex.getMessage() : "endpoint_error");
    }
  }

  private void pushResponseToEndpoint(
      TenantServiceSurvey survey,
      TenantServiceSurveyResponse response,
      List<TenantServiceSurveyAnswer> answers) {
    TenantServiceEndpoint endpoint =
        resolveEndpoint(survey.getTenantId(), survey.getServiceCode(), ENDPOINT_SURVEY_SUBMIT);
    if (endpoint == null) {
      return;
    }
    if (endpoint.getMethod() != null && !"POST".equalsIgnoreCase(endpoint.getMethod())) {
      return;
    }
    try {
      String url =
          buildEndpointUrl(
              endpoint,
              Map.of(
                  "tenantId",
                  survey.getTenantId(),
                  "serviceCode",
                  survey.getServiceCode(),
                  "surveyId",
                  survey.getId(),
                  "publicCode",
                  survey.getPublicCode()));
      Map<String, Object> payload = new HashMap<>();
      payload.put(
          "survey",
          Map.of(
              "id", survey.getId(),
              "publicCode", survey.getPublicCode(),
              "title", survey.getTitle()));
      payload.put(
          "response",
          Map.of(
              "id",
              response.getId(),
              "submittedAt",
              response.getSubmittedAt(),
              "respondentEmail",
              response.getRespondentEmail(),
              "respondentName",
              response.getRespondentName()));
      payload.put(
          "answers",
          answers.stream()
              .map(
                  answer ->
                      Map.of(
                          "questionId",
                          answer.getQuestionId(),
                          "value",
                          extractAnswerValue(answer)))
              .toList());

      HttpRequest.Builder builder =
          HttpRequest.newBuilder()
              .uri(URI.create(url))
              .POST(HttpRequest.BodyPublishers.ofString(toJson(payload), StandardCharsets.UTF_8))
              .header("Content-Type", "application/json");
      Map<String, String> headers = parseHeaders(endpoint.getHeaders());
      for (var entry : headers.entrySet()) {
        builder.header(entry.getKey(), entry.getValue());
      }
      HttpResponse<String> responseEntity =
          httpClient.send(builder.build(), HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
      if (responseEntity.statusCode() < 200 || responseEntity.statusCode() >= 300) {
        log.warn("Survey push failed status={} url={}", responseEntity.statusCode(), url);
      }
    } catch (Exception ex) {
      log.warn("Survey push error {}", ex.getMessage());
    }
  }

  private String buildEndpointUrl(TenantServiceEndpoint endpoint, Map<String, String> tokens) {
    String path = endpoint.getPath() != null ? endpoint.getPath().trim() : "";
    String resolvedPath = applyTokens(path, tokens);
    if (resolvedPath.startsWith("http://") || resolvedPath.startsWith("https://")) {
      return resolvedPath;
    }
    String baseUrl =
        endpoint.getBaseUrl() != null && !endpoint.getBaseUrl().isBlank()
            ? endpoint.getBaseUrl().trim()
            : resolveServiceBaseUrl(endpoint.getTenantId(), endpoint.getServiceCode());
    if (baseUrl == null || baseUrl.isBlank()) {
      throw new IllegalStateException("Endpoint baseUrl missing");
    }
    String base = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
    String normalizedPath = resolvedPath.startsWith("/") ? resolvedPath : "/" + resolvedPath;
    return base + normalizedPath;
  }

  private String resolveServiceBaseUrl(String tenantId, String serviceCode) {
    TenantServiceConfig config =
        configRepository.findByTenantIdAndServiceCode(tenantId, serviceCode).orElse(null);
    if (config == null) {
      return null;
    }
    return config.getApiBaseUrl();
  }

  private String applyTokens(String value, Map<String, String> tokens) {
    String resolved = value;
    if (tokens != null) {
      for (var entry : tokens.entrySet()) {
        resolved = resolved.replace("{" + entry.getKey() + "}", entry.getValue());
      }
    }
    return resolved;
  }

  private Map<String, String> parseHeaders(String headersJson) {
    if (headersJson == null || headersJson.isBlank()) {
      return Map.of();
    }
    try {
      return objectMapper.readValue(headersJson, new TypeReference<Map<String, String>>() {});
    } catch (Exception ex) {
      return Map.of();
    }
  }

  private Object extractByPath(Object data, String responsePath) {
    if (responsePath == null || responsePath.isBlank()) {
      return data;
    }
    String[] parts = responsePath.split("\\.");
    Object current = data;
    for (String part : parts) {
      if (current == null) {
        return null;
      }
      String trimmed = part.trim();
      if (trimmed.isBlank()) {
        continue;
      }
      if (current instanceof Map<?, ?> map) {
        current = map.get(trimmed);
      } else if (current instanceof List<?> list) {
        try {
          int index = Integer.parseInt(trimmed);
          current = index >= 0 && index < list.size() ? list.get(index) : null;
        } catch (NumberFormatException ex) {
          return null;
        }
      } else {
        return null;
      }
    }
    return current;
  }

  private static class AnswerValue {
    String text;
    Double number;
    String json;
  }

  public static class SurveyRequest {
    public String title;
    public String description;
    public String status;
    public String language;
    public Boolean allowMultiple;
    public Boolean collectEmail;
    public Boolean anonymous;
    public LocalDateTime startAt;
    public LocalDateTime endAt;
    public String welcomeText;
    public String thankYouText;
  }

  public static class SurveySummary {
    public String id;
    public String title;
    public String description;
    public String status;
    public String language;
    public String publicCode;
    public boolean allowMultiple;
    public boolean collectEmail;
    public boolean anonymous;
    public String welcomeText;
    public String thankYouText;
    public long questionCount;
    public long responseCount;
    public LocalDateTime startAt;
    public LocalDateTime endAt;
    public LocalDateTime createdAt;
    public LocalDateTime updatedAt;
  }

  public static class SurveyDetail {
    public SurveySummary summary;
    public List<SurveyQuestionResponse> questions;
  }

  public static class QuestionRequest {
    public String label;
    public String description;
    public String type;
    public Boolean required;
    public Integer orderIndex;
    public List<String> options;
    public Integer scaleMin;
    public Integer scaleMax;
    public String scaleMinLabel;
    public String scaleMaxLabel;
  }

  public static class SurveyQuestionResponse {
    public String id;
    public String label;
    public String description;
    public String type;
    public boolean required;
    public int orderIndex;
    public List<String> options;
    public Integer scaleMin;
    public Integer scaleMax;
    public String scaleMinLabel;
    public String scaleMaxLabel;
  }

  public static class SurveySubmissionRequest {
    public String respondentEmail;
    public String respondentName;
    public List<SurveyAnswerInput> answers;
  }

  public static class SurveyAnswerInput {
    public String questionId;
    public Object value;
  }

  public static class SurveyResponseSummary {
    public String id;
    public String status;
    public String respondentEmail;
    public String respondentName;
    public LocalDateTime submittedAt;
    public long answerCount;
  }

  public static class SurveyResponseDetail {
    public String id;
    public String status;
    public String respondentEmail;
    public String respondentName;
    public LocalDateTime submittedAt;
    public List<SurveyAnswerView> answers;
  }

  public static class SurveyAnswerView {
    public String questionId;
    public Object value;
  }

  public static class SurveyInsightResponse {
    public String id;
    public String model;
    public String status;
    public String payload;
    public String errorMessage;
    public LocalDateTime createdAt;
  }

  public static class PublicSurveyDetail {
    public String publicCode;
    public String title;
    public String description;
    public String welcomeText;
    public String thankYouText;
    public String language;
    public boolean collectEmail;
    public boolean anonymous;
    public List<PublicSurveyQuestion> questions;
  }

  public static class PublicSurveyQuestion {
    public String id;
    public String label;
    public String description;
    public String type;
    public boolean required;
    public int orderIndex;
    public List<String> options;
    public Integer scaleMin;
    public Integer scaleMax;
    public String scaleMinLabel;
    public String scaleMaxLabel;
  }
}
