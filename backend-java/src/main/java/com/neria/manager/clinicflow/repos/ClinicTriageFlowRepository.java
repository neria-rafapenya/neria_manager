package com.neria.manager.clinicflow.repos;

import com.neria.manager.clinicflow.entities.ClinicTriageFlow;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClinicTriageFlowRepository extends JpaRepository<ClinicTriageFlow, String> {
  List<ClinicTriageFlow> findAllByTenantId(String tenantId);
  Optional<ClinicTriageFlow> findByIdAndTenantId(String id, String tenantId);
}
