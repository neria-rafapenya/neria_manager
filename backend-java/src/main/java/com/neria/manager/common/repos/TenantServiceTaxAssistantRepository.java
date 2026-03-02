package com.neria.manager.common.repos;

import com.neria.manager.common.entities.TenantServiceTaxAssistant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TenantServiceTaxAssistantRepository
    extends JpaRepository<TenantServiceTaxAssistant, String> {
  List<TenantServiceTaxAssistant> findByTenantIdAndServiceCodeOrderByCreatedAtDesc(
      String tenantId, String serviceCode);

  Optional<TenantServiceTaxAssistant> findByIdAndTenantIdAndServiceCode(
      String id, String tenantId, String serviceCode);
}
