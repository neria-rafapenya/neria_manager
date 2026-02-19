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
@Table(name = "tenant_service_survey_insights")
public class TenantServiceSurveyInsight {
  @Id
  @Column(length = 36)
  private String id;

  @Column(name = "surveyId", length = 36, nullable = false)
  private String surveyId;

  @Column(name = "tenantId", length = 36, nullable = false)
  private String tenantId;

  @Column(name = "serviceCode", length = 64, nullable = false)
  private String serviceCode;

  @Column(length = 64)
  private String model;

  @Column(length = 16, nullable = false)
  private String status;

  @Column(columnDefinition = "text")
  private String payload;

  @Column(columnDefinition = "text")
  private String errorMessage;

  @Column(name = "createdAt")
  private LocalDateTime createdAt;
}
