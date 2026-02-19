package com.neria.manager.common.repos;

import com.neria.manager.common.entities.TenantServiceSurveyAnswer;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TenantServiceSurveyAnswerRepository
    extends JpaRepository<TenantServiceSurveyAnswer, String> {
  List<TenantServiceSurveyAnswer> findByResponseId(String responseId);

  List<TenantServiceSurveyAnswer> findBySurveyId(String surveyId);

  long countByResponseId(String responseId);

  void deleteBySurveyId(String surveyId);

  void deleteByResponseId(String responseId);
}
