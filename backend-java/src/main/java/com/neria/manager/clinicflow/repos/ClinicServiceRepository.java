package com.neria.manager.clinicflow.repos;

import com.neria.manager.clinicflow.entities.ClinicService;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClinicServiceRepository extends JpaRepository<ClinicService, String> {
  List<ClinicService> findAllByTenantId(String tenantId);
  Optional<ClinicService> findByIdAndTenantId(String id, String tenantId);
}
