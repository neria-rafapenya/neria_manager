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
@Table(name = "tenant_service_survey_responses")
public class TenantServiceSurveyResponse {
  @Id
  @Column(length = 36)
  private String id;

  @Column(name = "surveyId", length = 36, nullable = false)
  private String surveyId;

  @Column(name = "tenantId", length = 36, nullable = false)
  private String tenantId;

  @Column(name = "serviceCode", length = 64, nullable = false)
  private String serviceCode;

  @Column(length = 16, nullable = false)
  private String status;

  @Column(length = 255)
  private String respondentEmail;

  @Column(length = 255)
  private String respondentName;

  @Column(length = 64)
  private String externalId;

  @Column(columnDefinition = "json")
  private String metadata;

  @Column(name = "submittedAt")
  private LocalDateTime submittedAt;

  @Column(name = "createdAt")
  private LocalDateTime createdAt;

  @Column(name = "updatedAt")
  private LocalDateTime updatedAt;
}
