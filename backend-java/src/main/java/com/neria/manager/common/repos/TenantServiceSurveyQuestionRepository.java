package com.neria.manager.common.repos;

import com.neria.manager.common.entities.TenantServiceSurveyQuestion;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TenantServiceSurveyQuestionRepository
    extends JpaRepository<TenantServiceSurveyQuestion, String> {
  List<TenantServiceSurveyQuestion> findBySurveyIdOrderByOrderIndexAsc(String surveyId);

  Optional<TenantServiceSurveyQuestion> findByIdAndSurveyId(
      String id, String surveyId);

  long countBySurveyId(String surveyId);

  void deleteBySurveyId(String surveyId);
}
