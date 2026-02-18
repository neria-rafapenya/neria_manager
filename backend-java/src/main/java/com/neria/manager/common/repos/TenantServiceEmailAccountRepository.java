package com.neria.manager.common.repos;

import com.neria.manager.common.entities.TenantServiceEmailAccount;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TenantServiceEmailAccountRepository
    extends JpaRepository<TenantServiceEmailAccount, String> {
  List<TenantServiceEmailAccount> findByTenantIdAndServiceCodeOrderByCreatedAtDesc(
      String tenantId, String serviceCode);

  List<TenantServiceEmailAccount> findByEnabledTrue();

  Optional<TenantServiceEmailAccount> findByIdAndTenantId(String id, String tenantId);
}
