package com.neria.manager.common.repos;

import com.neria.manager.common.entities.TenantServiceJira;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TenantServiceJiraRepository extends JpaRepository<TenantServiceJira, String> {
  Optional<TenantServiceJira> findByTenantIdAndServiceCode(String tenantId, String serviceCode);

  void deleteByTenantIdAndServiceCode(String tenantId, String serviceCode);
}
