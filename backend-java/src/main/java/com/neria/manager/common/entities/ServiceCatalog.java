package com.neria.manager.common.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "service_catalog")
public class ServiceCatalog {
  @Id
  @Column(length = 36)
  private String id;

  @Column(length = 64, unique = true, nullable = false)
  private String code;

  @Column(length = 120, nullable = false)
  private String name;

  @Column(columnDefinition = "text", nullable = false)
  private String description;

  @Column(name = "apiBaseUrl", length = 255)
  private String apiBaseUrl;

  @Column(name = "endpointsEnabled", nullable = false)
  private boolean endpointsEnabled;

  @Column(name = "humanHandoffEnabled", nullable = false)
  private boolean humanHandoffEnabled;

  @Column(name = "fileStorageEnabled", nullable = false)
  private boolean fileStorageEnabled;

  @Column(name = "documentProcessingEnabled", nullable = false)
  private boolean documentProcessingEnabled;

  @Column(name = "ocrEnabled", nullable = false)
  private boolean ocrEnabled;

  @Column(name = "semanticSearchEnabled", nullable = false)
  private boolean semanticSearchEnabled;

  @Column(name = "emailAutomationEnabled", nullable = false)
  private boolean emailAutomationEnabled;

  @Column(name = "jiraEnabled", nullable = false)
  private boolean jiraEnabled;

  @Column(name = "jiraProjectKey", length = 32)
  private String jiraProjectKey;

  @Column(name = "jiraDefaultIssueType", length = 64)
  private String jiraDefaultIssueType;

  @Column(name = "jiraAllowUserPriorityOverride", nullable = false)
  private boolean jiraAllowUserPriorityOverride;

  @Column(name = "jiraAutoLabelWithServiceName", nullable = false)
  private boolean jiraAutoLabelWithServiceName;

  @Column(name = "priceMonthlyEur", precision = 10, scale = 2, nullable = false)
  private BigDecimal priceMonthlyEur;

  @Column(name = "priceAnnualEur", precision = 10, scale = 2, nullable = false)
  private BigDecimal priceAnnualEur;

  @Column(nullable = false)
  private boolean enabled;

  @Column(name = "createdAt")
  private LocalDateTime createdAt;

  @Column(name = "updatedAt")
  private LocalDateTime updatedAt;
}
