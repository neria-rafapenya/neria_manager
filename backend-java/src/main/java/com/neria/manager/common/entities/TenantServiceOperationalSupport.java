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
@Table(name = "tenant_service_operational_support")
public class TenantServiceOperationalSupport {
  @Id
  @Column(length = 36)
  private String id;

  @Column(name = "tenantId", length = 36, nullable = false)
  private String tenantId;

  @Column(name = "serviceCode", length = 64, nullable = false)
  private String serviceCode;

  @Column(length = 160)
  private String title;

  @Column(name = "entryType", length = 24, nullable = false)
  private String entryType;

  @Column(length = 16, nullable = false)
  private String status;

  @Column(length = 64)
  private String model;

  @Column(length = 36)
  private String providerId;

  @Column(name = "inputJson", columnDefinition = "text")
  private String inputJson;

  @Column(name = "resultJson", columnDefinition = "text")
  private String resultJson;

  @Column(name = "reportText", columnDefinition = "text")
  private String reportText;

  @Column(name = "createdAt")
  private LocalDateTime createdAt;

  @Column(name = "updatedAt")
  private LocalDateTime updatedAt;
}
