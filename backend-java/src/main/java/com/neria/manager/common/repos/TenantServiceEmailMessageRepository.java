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
}
