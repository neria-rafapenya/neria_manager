package com.neria.manager.clinicflow.repos;

import com.neria.manager.clinicflow.entities.ClinicSettings;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClinicSettingsRepository extends JpaRepository<ClinicSettings, String> {
  Optional<ClinicSettings> findByTenantId(String tenantId);
}
