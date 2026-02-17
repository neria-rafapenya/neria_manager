package com.neria.manager.common.repos;

import com.neria.manager.common.entities.TenantServiceStorage;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TenantServiceStorageRepository extends JpaRepository<TenantServiceStorage, String> {
  Optional<TenantServiceStorage> findByTenantIdAndServiceCode(String tenantId, String serviceCode);

  void deleteByTenantIdAndServiceCode(String tenantId, String serviceCode);
}
