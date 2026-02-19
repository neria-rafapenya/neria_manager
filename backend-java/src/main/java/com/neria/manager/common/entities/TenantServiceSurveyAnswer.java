package com.neria.manager.common.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "tenant_service_survey_answers")
public class TenantServiceSurveyAnswer {
  @Id
  @Column(length = 36)
  private String id;

  @Column(name = "surveyId", length = 36, nullable = false)
  private String surveyId;

  @Column(name = "responseId", length = 36, nullable = false)
  private String responseId;

  @Column(name = "questionId", length = 36, nullable = false)
  private String questionId;

  @Column(name = "tenantId", length = 36, nullable = false)
  private String tenantId;

  @Column(name = "serviceCode", length = 64, nullable = false)
  private String serviceCode;

  @Column(columnDefinition = "text")
  private String valueText;

  @Column(name = "valueNumber")
  private Double valueNumber;

  @Column(columnDefinition = "json")
  private String valueJson;

  @Column(name = "createdAt")
  private LocalDateTime createdAt;
}
