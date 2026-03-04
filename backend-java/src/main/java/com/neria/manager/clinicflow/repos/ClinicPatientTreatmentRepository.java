package com.neria.manager.clinicflow.repos;

import com.neria.manager.clinicflow.entities.ClinicPatientTreatment;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClinicPatientTreatmentRepository
    extends JpaRepository<ClinicPatientTreatment, String> {
  List<ClinicPatientTreatment> findAllByTenantIdAndPatientUserIdOrderByCreatedAtDesc(
      String tenantId, String patientUserId);

  List<ClinicPatientTreatment> findAllByTenantId(String tenantId);

  Optional<ClinicPatientTreatment> findByIdAndTenantId(String id, String tenantId);
}
