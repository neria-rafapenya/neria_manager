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
@Table(name = "tenant_service_surveys")
public class TenantServiceSurvey {
  @Id
  @Column(length = 36)
  private String id;

  @Column(name = "tenantId", length = 36, nullable = false)
  private String tenantId;

  @Column(name = "serviceCode", length = 64, nullable = false)
  private String serviceCode;

  @Column(name = "publicCode", length = 64, nullable = false, unique = true)
  private String publicCode;

  @Column(length = 200, nullable = false)
  private String title;

  @Column(columnDefinition = "text")
  private String description;

  @Column(length = 16, nullable = false)
  private String status;

  @Column(length = 8)
  private String language;

  @Column(nullable = false)
  private boolean allowMultiple;

  @Column(nullable = false)
  private boolean collectEmail;

  @Column(name = "isAnonymous", nullable = false)
  private boolean anonymous;

  @Column(name = "startAt")
  private LocalDateTime startAt;

  @Column(name = "endAt")
  private LocalDateTime endAt;

  @Column(columnDefinition = "text")
  private String welcomeText;

  @Column(columnDefinition = "text")
  private String thankYouText;

  @Column(name = "createdAt")
  private LocalDateTime createdAt;

  @Column(name = "updatedAt")
  private LocalDateTime updatedAt;
}
