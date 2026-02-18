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
@Table(name = "tenant_service_email_messages")
public class TenantServiceEmailMessage {
  @Id
  @Column(length = 36)
  private String id;

  @Column(name = "tenantId", length = 36, nullable = false)
  private String tenantId;

  @Column(name = "serviceCode", length = 64, nullable = false)
  private String serviceCode;

  @Column(name = "accountId", length = 36, nullable = false)
  private String accountId;

  @Column(name = "messageKey", length = 128, nullable = false)
  private String messageKey;

  @Column(name = "messageId", length = 255)
  private String messageId;

  @Column(name = "subject", length = 255)
  private String subject;

  @Column(name = "fromName", length = 255)
  private String fromName;

  @Column(name = "fromEmail", length = 255)
  private String fromEmail;

  @Column(name = "receivedAt")
  private LocalDateTime receivedAt;

  @Column(name = "bodyText", columnDefinition = "text")
  private String bodyText;

  @Column(name = "status", length = 32, nullable = false)
  private String status;

  @Column(name = "intent", length = 64)
  private String intent;

  @Column(name = "priority", length = 32)
  private String priority;

  @Column(name = "classification", columnDefinition = "json")
  private String classification;

  @Column(name = "actionType", length = 64)
  private String actionType;

  @Column(name = "actionStatus", length = 32)
  private String actionStatus;

  @Column(name = "jiraIssueKey", length = 64)
  private String jiraIssueKey;

  @Column(name = "jiraIssueUrl", length = 255)
  private String jiraIssueUrl;

  @Column(name = "errorMessage", columnDefinition = "text")
  private String errorMessage;

  @Column(name = "createdAt")
  private LocalDateTime createdAt;

  @Column(name = "updatedAt")
  private LocalDateTime updatedAt;
}
