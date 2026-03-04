package com.neria.manager.clinicflow.repos;

import com.neria.manager.clinicflow.entities.ClinicPatientAppointment;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClinicPatientAppointmentRepository
    extends JpaRepository<ClinicPatientAppointment, String> {
  List<ClinicPatientAppointment> findAllByTenantIdAndPatientUserIdOrderByScheduledAtDesc(
      String tenantId, String patientUserId);

  List<ClinicPatientAppointment> findAllByTenantId(String tenantId);

  Optional<ClinicPatientAppointment> findByIdAndTenantId(String id, String tenantId);
}
