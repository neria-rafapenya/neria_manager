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
@Table(name = "tenant_request_logs")
public class TenantRequestLog {
  @Id
  @Column(length = 36)
  private String id;

  @Column(name = "tenantId", length = 36, nullable = false)
  private String tenantId;

  @Column(name = "userId", length = 120)
  private String userId;

  @Column(name = "userEmail", length = 160)
  private String userEmail;

  @Column(name = "role", length = 32)
  private String role;

  @Column(length = 8)
  private String method;

  @Column(length = 255)
  private String path;

  @Column(length = 64)
  private String type;

  @Column(length = 64)
  private String serviceCode;

  @Column(name = "queryString", length = 1024)
  private String queryString;

  @Column(name = "ipAddress", length = 64)
  private String ipAddress;

  @Column(name = "userAgent", length = 255)
  private String userAgent;

  @Column(name = "statusCode")
  private Integer statusCode;

  @Column(name = "payloadJson", columnDefinition = "json")
  private String payloadJson;

  @Column(name = "createdAt")
  private LocalDateTime createdAt;
}
