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
@Table(name = "tenant_service_email_accounts")
public class TenantServiceEmailAccount {
  @Id
  @Column(length = 36)
  private String id;

  @Column(name = "tenantId", length = 36, nullable = false)
  private String tenantId;

  @Column(name = "serviceCode", length = 64, nullable = false)
  private String serviceCode;

  @Column(name = "label", length = 120)
  private String label;

  @Column(name = "email", length = 255, nullable = false)
  private String email;

  @Column(name = "provider", length = 32, nullable = false)
  private String provider;

  @Column(name = "host", length = 255, nullable = false)
  private String host;

  @Column(name = "port")
  private Integer port;

  @Column(name = "username", length = 255, nullable = false)
  private String username;

  @Column(name = "encryptedPassword", columnDefinition = "text")
  private String encryptedPassword;

  @Column(name = "folder", length = 120)
  private String folder;

  @Column(name = "useSsl", nullable = false)
  private boolean useSsl;

  @Column(name = "useStartTls", nullable = false)
  private boolean useStartTls;

  @Column(name = "enabled", nullable = false)
  private boolean enabled;

  @Column(name = "lastUid")
  private Long lastUid;

  @Column(name = "lastSyncAt")
  private LocalDateTime lastSyncAt;

  @Column(name = "createdAt")
  private LocalDateTime createdAt;

  @Column(name = "updatedAt")
  private LocalDateTime updatedAt;
}
