package com.neria.manager.surveys;

import jakarta.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/public/surveys")
public class PublicSurveysController {
  private final SurveysService surveysService;

  public PublicSurveysController(SurveysService surveysService) {
    this.surveysService = surveysService;
  }

  @GetMapping("/{publicCode}")
  public Object getSurvey(@PathVariable String publicCode) {
    return surveysService.getPublicSurvey(publicCode);
  }

  @PostMapping("/{publicCode}/responses")
  public Object submitSurvey(
      HttpServletRequest request,
      @PathVariable String publicCode,
      @RequestBody SurveysService.SurveySubmissionRequest payload) {
    Map<String, Object> meta = new HashMap<>();
    String userAgent = request.getHeader("User-Agent");
    if (userAgent != null) {
      meta.put("userAgent", userAgent);
    }
    String forwarded = request.getHeader("X-Forwarded-For");
    if (forwarded != null) {
      meta.put("forwardedFor", forwarded);
    }
    return surveysService.submitPublicSurvey(publicCode, payload, meta);
  }
}
