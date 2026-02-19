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
@Table(name = "tenant_service_survey_questions")
public class TenantServiceSurveyQuestion {
  @Id
  @Column(length = 36)
  private String id;

  @Column(name = "surveyId", length = 36, nullable = false)
  private String surveyId;

  @Column(name = "tenantId", length = 36, nullable = false)
  private String tenantId;

  @Column(name = "serviceCode", length = 64, nullable = false)
  private String serviceCode;

  @Column(length = 32, nullable = false)
  private String type;

  @Column(length = 280, nullable = false)
  private String label;

  @Column(columnDefinition = "text")
  private String description;

  @Column(nullable = false)
  private boolean required;

  @Column(name = "orderIndex", nullable = false)
  private int orderIndex;

  @Column(columnDefinition = "json")
  private String options;

  @Column(name = "scaleMin")
  private Integer scaleMin;

  @Column(name = "scaleMax")
  private Integer scaleMax;

  @Column(name = "scaleMinLabel", length = 120)
  private String scaleMinLabel;

  @Column(name = "scaleMaxLabel", length = 120)
  private String scaleMaxLabel;

  @Column(name = "createdAt")
  private LocalDateTime createdAt;

  @Column(name = "updatedAt")
  private LocalDateTime updatedAt;
}
