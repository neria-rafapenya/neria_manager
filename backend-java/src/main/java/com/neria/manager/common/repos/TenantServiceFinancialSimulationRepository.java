package com.neria.manager.common.repos;

import com.neria.manager.common.entities.TenantServiceFinancialSimulation;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TenantServiceFinancialSimulationRepository
    extends JpaRepository<TenantServiceFinancialSimulation, String> {
  List<TenantServiceFinancialSimulation> findByTenantIdAndServiceCodeOrderByCreatedAtDesc(
      String tenantId, String serviceCode);

  Optional<TenantServiceFinancialSimulation> findByIdAndTenantIdAndServiceCode(
      String id, String tenantId, String serviceCode);
}
