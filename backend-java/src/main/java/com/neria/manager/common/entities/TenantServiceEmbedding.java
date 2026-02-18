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
@Table(name = "tenant_service_embeddings")
public class TenantServiceEmbedding {
  @Id
  @Column(length = 36)
  private String id;

  @Column(name = "tenantId", length = 36, nullable = false)
  private String tenantId;

  @Column(name = "serviceCode", length = 64, nullable = false)
  private String serviceCode;

  @Column(name = "conversationId", length = 36)
  private String conversationId;

  @Column(name = "fileId", length = 36)
  private String fileId;

  @Column(name = "chunkIndex", nullable = false)
  private int chunkIndex;

  @Column(name = "chunkText", columnDefinition = "text", nullable = false)
  private String chunkText;

  @Column(name = "embedding", columnDefinition = "json", nullable = false)
  private String embedding;

  @Column(name = "embeddingModel", length = 64, nullable = false)
  private String embeddingModel;

  @Column(name = "createdAt")
  private LocalDateTime createdAt;
}
