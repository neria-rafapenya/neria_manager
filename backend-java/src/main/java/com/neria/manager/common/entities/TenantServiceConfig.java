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
@Table(name = "tenant_service_configs")
public class TenantServiceConfig {
  @Id
  @Column(length = 36)
  private String id;

  @Column(name = "tenantId", length = 36, nullable = false)
  private String tenantId;

  @Column(name = "serviceCode", length = 64, nullable = false)
  private String serviceCode;

  @Column(length = 16, nullable = false)
  private String status;

  @Column(columnDefinition = "text")
  private String systemPrompt;

  @Column(name = "apiBaseUrl", length = 255)
  private String apiBaseUrl;

  @Column(name = "providerId", length = 36)
  private String providerId;

  @Column(name = "pricingId", length = 36)
  private String pricingId;

  @Column(name = "policyId", length = 36)
  private String policyId;

  @Column(name = "humanHandoffEnabled")
  private Boolean humanHandoffEnabled;

  @Column(name = "fileStorageEnabled")
  private Boolean fileStorageEnabled;

  @Column(name = "documentProcessingEnabled")
  private Boolean documentProcessingEnabled;

  @Column(name = "ocrEnabled")
  private Boolean ocrEnabled;

  @Column(name = "semanticSearchEnabled")
  private Boolean semanticSearchEnabled;

  @Column(name = "internalDocsEnabled")
  private Boolean internalDocsEnabled;

  @Column(name = "internalPoliciesEnabled")
  private Boolean internalPoliciesEnabled;

  @Column(name = "internalTemplatesEnabled")
  private Boolean internalTemplatesEnabled;

  @Column(name = "documentDomain", length = 120)
  private String documentDomain;

  @Column(name = "documentOutputType", length = 32)
  private String documentOutputType;

  @Column(name = "jiraEnabled")
  private Boolean jiraEnabled;

  @Column(name = "jiraProjectKey", length = 32)
  private String jiraProjectKey;

  @Column(name = "jiraDefaultIssueType", length = 64)
  private String jiraDefaultIssueType;

  @Column(name = "jiraAllowUserPriorityOverride")
  private Boolean jiraAllowUserPriorityOverride;

  @Column(name = "jiraAutoLabelWithServiceName")
  private Boolean jiraAutoLabelWithServiceName;

  @Column(name = "createdAt")
  private LocalDateTime createdAt;

  @Column(name = "updatedAt")
  private LocalDateTime updatedAt;
}
