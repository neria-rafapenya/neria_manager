package com.neria.manager.common.repos;

import com.neria.manager.common.entities.TenantServicePreEvaluation;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TenantServicePreEvaluationRepository
    extends JpaRepository<TenantServicePreEvaluation, String> {
  List<TenantServicePreEvaluation> findByTenantIdAndServiceCodeOrderByCreatedAtDesc(
      String tenantId, String serviceCode);

  Optional<TenantServicePreEvaluation> findByIdAndTenantIdAndServiceCode(
      String id, String tenantId, String serviceCode);
}
