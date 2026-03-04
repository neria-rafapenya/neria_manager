package com.neria.manager.clinicflow.repos;

import com.neria.manager.clinicflow.entities.ClinicPatientInteraction;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClinicPatientInteractionRepository
    extends JpaRepository<ClinicPatientInteraction, String> {
  List<ClinicPatientInteraction> findAllByTenantIdAndPatientUserIdOrderByCreatedAtDesc(
      String tenantId, String patientUserId);
}
