package com.neria.manager.common.repos;

import com.neria.manager.common.entities.TenantServiceSelfAssessment;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TenantServiceSelfAssessmentRepository
    extends JpaRepository<TenantServiceSelfAssessment, String> {
  List<TenantServiceSelfAssessment> findByTenantIdAndServiceCodeOrderByCreatedAtDesc(
      String tenantId, String serviceCode);

  Optional<TenantServiceSelfAssessment> findByIdAndTenantIdAndServiceCode(
      String id, String tenantId, String serviceCode);
}
