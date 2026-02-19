package com.neria.manager.common.repos;

import com.neria.manager.common.entities.TenantServiceOperationalSupport;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TenantServiceOperationalSupportRepository
    extends JpaRepository<TenantServiceOperationalSupport, String> {
  List<TenantServiceOperationalSupport> findByTenantIdAndServiceCodeOrderByCreatedAtDesc(
      String tenantId, String serviceCode);

  Optional<TenantServiceOperationalSupport> findByIdAndTenantIdAndServiceCode(
      String id, String tenantId, String serviceCode);
}
