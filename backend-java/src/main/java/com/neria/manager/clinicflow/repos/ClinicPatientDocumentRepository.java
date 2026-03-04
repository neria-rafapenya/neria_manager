package com.neria.manager.clinicflow.repos;

import com.neria.manager.clinicflow.entities.ClinicPatientDocument;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClinicPatientDocumentRepository
    extends JpaRepository<ClinicPatientDocument, String> {
  List<ClinicPatientDocument> findAllByTenantIdAndPatientUserIdOrderByCreatedAtDesc(
      String tenantId, String patientUserId);

  List<ClinicPatientDocument> findAllByTenantId(String tenantId);

  Optional<ClinicPatientDocument> findByIdAndTenantId(String id, String tenantId);
}
