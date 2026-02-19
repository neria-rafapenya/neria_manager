package com.neria.manager.common.repos;

import com.neria.manager.common.entities.TenantServiceSurveyResponse;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TenantServiceSurveyResponseRepository
    extends JpaRepository<TenantServiceSurveyResponse, String> {
  List<TenantServiceSurveyResponse> findBySurveyIdOrderBySubmittedAtDesc(String surveyId);

  Optional<TenantServiceSurveyResponse> findByIdAndSurveyId(String id, String surveyId);

  long countBySurveyId(String surveyId);

  long countBySurveyIdAndRespondentEmail(String surveyId, String respondentEmail);

  void deleteBySurveyId(String surveyId);
}
