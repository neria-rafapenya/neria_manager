package com.neria.manager.common.repos;

import com.neria.manager.common.entities.TenantServiceEmailMessage;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TenantServiceEmailMessageRepository
    extends JpaRepository<TenantServiceEmailMessage, String> {
  Optional<TenantServiceEmailMessage> findByTenantIdAndAccountIdAndMessageKey(
      String tenantId, String accountId, String messageKey);

  List<TenantServiceEmailMessage> findByTenantIdAndServiceCodeOrderByReceivedAtDesc(
      String tenantId, String serviceCode, Pageable pageable);

  List<TenantServiceEmailMessage> findByTenantIdAndAccountIdOrderByReceivedAtDesc(
      String tenantId, String accountId, Pageable pageable);

  List<TenantServiceEmailMessage> findByTenantIdAndAccountIdAndReceivedAtGreaterThanEqualOrderByReceivedAtDesc(
      String tenantId, String accountId, java.time.LocalDateTime receivedAt, Pageable pageable);
}
