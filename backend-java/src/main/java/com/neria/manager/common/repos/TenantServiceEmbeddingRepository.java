package com.neria.manager.common.repos;

import com.neria.manager.common.entities.TenantServiceEmbedding;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TenantServiceEmbeddingRepository
    extends JpaRepository<TenantServiceEmbedding, String> {
  List<TenantServiceEmbedding> findByTenantIdAndConversationIdOrderByChunkIndexAsc(
      String tenantId, String conversationId);

  List<TenantServiceEmbedding> findByTenantIdAndFileIdOrderByChunkIndexAsc(
      String tenantId, String fileId);

  void deleteByTenantIdAndFileId(String tenantId, String fileId);
}
