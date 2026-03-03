package com.neria.manager.clinicflow.repos;

import com.neria.manager.clinicflow.entities.ClinicFaqEntry;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClinicFaqEntryRepository extends JpaRepository<ClinicFaqEntry, String> {
  List<ClinicFaqEntry> findAllByTenantId(String tenantId);
  Optional<ClinicFaqEntry> findByIdAndTenantId(String id, String tenantId);
}
