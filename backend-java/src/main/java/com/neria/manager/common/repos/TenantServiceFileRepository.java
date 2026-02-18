package com.neria.manager.common.repos;

import com.neria.manager.common.entities.TenantServiceFile;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TenantServiceFileRepository extends JpaRepository<TenantServiceFile, String> {
  List<TenantServiceFile> findByTenantIdAndConversationIdOrderByCreatedAtDesc(
      String tenantId, String conversationId);

  List<TenantServiceFile> findByTenantIdAndServiceCodeOrderByCreatedAtDesc(
      String tenantId, String serviceCode);

  Optional<TenantServiceFile> findByIdAndTenantId(String id, String tenantId);
}
