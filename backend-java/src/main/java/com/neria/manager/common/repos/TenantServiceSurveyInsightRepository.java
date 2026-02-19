package com.neria.manager.common.repos;

import com.neria.manager.common.entities.TenantServiceSurveyInsight;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TenantServiceSurveyInsightRepository
    extends JpaRepository<TenantServiceSurveyInsight, String> {
  List<TenantServiceSurveyInsight> findBySurveyIdOrderByCreatedAtDesc(String surveyId);
}
