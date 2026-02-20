package com.neria.manager.common.repos;

import com.neria.manager.common.entities.ChatConversation;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChatConversationRepository extends JpaRepository<ChatConversation, String> {
  List<ChatConversation> findByTenantIdAndUserIdOrderByUpdatedAtDesc(
      String tenantId, String userId);

  Page<ChatConversation> findByTenantIdAndUserIdOrderByUpdatedAtDesc(
      String tenantId, String userId, Pageable pageable);

  Page<ChatConversation> findByTenantIdAndUserIdAndServiceCodeOrderByUpdatedAtDesc(
      String tenantId, String userId, String serviceCode, Pageable pageable);

  List<ChatConversation> findByTenantIdOrderByUpdatedAtDesc(String tenantId);

  Optional<ChatConversation> findByIdAndTenantId(String id, String tenantId);

  List<ChatConversation> findByTenantIdAndHandoffStatusInOrderByUpdatedAtDesc(
      String tenantId, List<String> statuses);
}
