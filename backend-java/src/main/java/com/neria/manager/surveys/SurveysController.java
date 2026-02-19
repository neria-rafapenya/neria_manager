package com.neria.manager.surveys;

import com.neria.manager.common.security.AuthContext;
import com.neria.manager.common.security.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/tenants/{tenantId}/services/{serviceCode}/surveys")
public class SurveysController {
  private final SurveysService surveysService;

  public SurveysController(SurveysService surveysService) {
    this.surveysService = surveysService;
  }

  private void requireScope(HttpServletRequest request, String tenantId) {
    AuthContext auth = AuthUtils.requireAuth(request);
    AuthUtils.requireRole(auth, "admin", "tenant");
    AuthUtils.requireTenantScope(auth, tenantId);
  }

  @GetMapping
  public Object listSurveys(
      HttpServletRequest request,
      @PathVariable String tenantId,
      @PathVariable String serviceCode) {
    requireScope(request, tenantId);
    return surveysService.listSurveys(tenantId, serviceCode);
  }

  @GetMapping("/external")
  public Object listExternalSurveys(
      HttpServletRequest request,
      @PathVariable String tenantId,
      @PathVariable String serviceCode) {
    requireScope(request, tenantId);
    return surveysService.listExternalSurveys(tenantId, serviceCode);
  }

  @PostMapping
  public Object createSurvey(
      HttpServletRequest request,
      @PathVariable String tenantId,
      @PathVariable String serviceCode,
      @RequestBody SurveysService.SurveyRequest payload) {
    requireScope(request, tenantId);
    return surveysService.createSurvey(tenantId, serviceCode, payload);
  }

  @GetMapping("/{surveyId}")
  public Object getSurvey(
      HttpServletRequest request,
      @PathVariable String tenantId,
      @PathVariable String serviceCode,
      @PathVariable String surveyId) {
    requireScope(request, tenantId);
    return surveysService.getSurvey(tenantId, serviceCode, surveyId);
  }

  @PatchMapping("/{surveyId}")
  public Object updateSurvey(
      HttpServletRequest request,
      @PathVariable String tenantId,
      @PathVariable String serviceCode,
      @PathVariable String surveyId,
      @RequestBody SurveysService.SurveyRequest payload) {
    requireScope(request, tenantId);
    return surveysService.updateSurvey(tenantId, serviceCode, surveyId, payload);
  }

  @DeleteMapping("/{surveyId}")
  public Object deleteSurvey(
      HttpServletRequest request,
      @PathVariable String tenantId,
      @PathVariable String serviceCode,
      @PathVariable String surveyId) {
    requireScope(request, tenantId);
    surveysService.deleteSurvey(tenantId, serviceCode, surveyId);
    return java.util.Map.of("deleted", true);
  }

  @PostMapping("/{surveyId}/questions")
  public Object createQuestion(
      HttpServletRequest request,
      @PathVariable String tenantId,
      @PathVariable String serviceCode,
      @PathVariable String surveyId,
      @RequestBody SurveysService.QuestionRequest payload) {
    requireScope(request, tenantId);
    return surveysService.createQuestion(tenantId, serviceCode, surveyId, payload);
  }

  @PatchMapping("/{surveyId}/questions/{questionId}")
  public Object updateQuestion(
      HttpServletRequest request,
      @PathVariable String tenantId,
      @PathVariable String serviceCode,
      @PathVariable String surveyId,
      @PathVariable String questionId,
      @RequestBody SurveysService.QuestionRequest payload) {
    requireScope(request, tenantId);
    return surveysService.updateQuestion(tenantId, serviceCode, surveyId, questionId, payload);
  }

  @DeleteMapping("/{surveyId}/questions/{questionId}")
  public Object deleteQuestion(
      HttpServletRequest request,
      @PathVariable String tenantId,
      @PathVariable String serviceCode,
      @PathVariable String surveyId,
      @PathVariable String questionId) {
    requireScope(request, tenantId);
    surveysService.deleteQuestion(tenantId, serviceCode, surveyId, questionId);
    return java.util.Map.of("deleted", true);
  }

  @GetMapping("/{surveyId}/responses")
  public Object listResponses(
      HttpServletRequest request,
      @PathVariable String tenantId,
      @PathVariable String serviceCode,
      @PathVariable String surveyId) {
    requireScope(request, tenantId);
    return surveysService.listResponses(tenantId, serviceCode, surveyId);
  }

  @GetMapping("/{surveyId}/responses/external")
  public Object listExternalResponses(
      HttpServletRequest request,
      @PathVariable String tenantId,
      @PathVariable String serviceCode,
      @PathVariable String surveyId) {
    requireScope(request, tenantId);
    return surveysService.listExternalResponses(tenantId, serviceCode, surveyId);
  }

  @GetMapping("/{surveyId}/responses/{responseId}")
  public Object getResponse(
      HttpServletRequest request,
      @PathVariable String tenantId,
      @PathVariable String serviceCode,
      @PathVariable String surveyId,
      @PathVariable String responseId) {
    requireScope(request, tenantId);
    return surveysService.getResponse(tenantId, serviceCode, surveyId, responseId);
  }

  @GetMapping(value = "/{surveyId}/responses/export", produces = MediaType.TEXT_PLAIN_VALUE)
  public String exportResponses(
      HttpServletRequest request,
      HttpServletResponse response,
      @PathVariable String tenantId,
      @PathVariable String serviceCode,
      @PathVariable String surveyId) {
    requireScope(request, tenantId);
    response.setHeader(
        "Content-Disposition",
        "attachment; filename=\"survey_" + surveyId + ".csv\"");
    return surveysService.exportResponsesCsv(tenantId, serviceCode, surveyId);
  }

  @GetMapping("/{surveyId}/insights")
  public Object listInsights(
      HttpServletRequest request,
      @PathVariable String tenantId,
      @PathVariable String serviceCode,
      @PathVariable String surveyId) {
    requireScope(request, tenantId);
    return surveysService.listInsights(tenantId, serviceCode, surveyId);
  }

  @PostMapping("/{surveyId}/insights")
  public Object runInsights(
      HttpServletRequest request,
      @PathVariable String tenantId,
      @PathVariable String serviceCode,
      @PathVariable String surveyId) {
    requireScope(request, tenantId);
    return surveysService.runInsights(tenantId, serviceCode, surveyId);
  }
}
