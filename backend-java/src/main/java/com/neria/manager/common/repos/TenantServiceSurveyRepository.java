package com.neria.manager.common.repos;

import com.neria.manager.common.entities.TenantServiceSurvey;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TenantServiceSurveyRepository extends JpaRepository<TenantServiceSurvey, String> {
  List<TenantServiceSurvey> findByTenantIdAndServiceCodeOrderByCreatedAtDesc(
      String tenantId, String serviceCode);

  Optional<TenantServiceSurvey> findByIdAndTenantIdAndServiceCode(
      String id, String tenantId, String serviceCode);

  Optional<TenantServiceSurvey> findByPublicCode(String publicCode);
}
