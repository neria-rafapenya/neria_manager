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
@Table(name = "tenant_service_files")
public class TenantServiceFile {
  @Id
  @Column(length = 36)
  private String id;

  @Column(name = "tenantId", length = 36, nullable = false)
  private String tenantId;

  @Column(name = "serviceCode", length = 64, nullable = false)
  private String serviceCode;

  @Column(name = "conversationId", length = 36)
  private String conversationId;

  @Column(name = "originalName", length = 255, nullable = false)
  private String originalName;

  @Column(name = "contentType", length = 255)
  private String contentType;

  @Column(name = "sizeBytes", nullable = false)
  private long sizeBytes;

  @Column(name = "storageProvider", length = 64, nullable = false)
  private String storageProvider;

  @Column(name = "storageKey", length = 255, nullable = false)
  private String storageKey;

  @Column(name = "storageUrl", length = 1024, nullable = false)
  private String storageUrl;

  @Column(length = 32, nullable = false)
  private String status;

  @Column(length = 32, nullable = false)
  private String ocrStatus;

  @Column(length = 32, nullable = false)
  private String semanticStatus;

  @Column(name = "embeddingStatus", length = 32, nullable = false)
  private String embeddingStatus;

  @Column(name = "embeddingModel", length = 64)
  private String embeddingModel;

  @Column(name = "embeddingCount")
  private Integer embeddingCount;

  @Column(name = "documentDomain", length = 120)
  private String documentDomain;

  @Column(name = "ocrDocumentId", length = 36)
  private String ocrDocumentId;

  @Column(name = "resultType", length = 32)
  private String resultType;

  @Column(name = "resultContent", columnDefinition = "text")
  private String resultContent;

  @Column(name = "resultFileUrl", length = 1024)
  private String resultFileUrl;

  @Column(name = "resultFileKey", length = 255)
  private String resultFileKey;

  @Column(name = "errorMessage", columnDefinition = "text")
  private String errorMessage;

  @Column(columnDefinition = "json")
  private String metadata;

  @Column(name = "createdAt")
  private LocalDateTime createdAt;

  @Column(name = "updatedAt")
  private LocalDateTime updatedAt;
}
