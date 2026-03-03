package com.neria.manager.clinicflow.repos;

import com.neria.manager.clinicflow.entities.ClinicReportTemplate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClinicReportTemplateRepository extends JpaRepository<ClinicReportTemplate, String> {
  List<ClinicReportTemplate> findAllByTenantId(String tenantId);
  Optional<ClinicReportTemplate> findByIdAndTenantId(String id, String tenantId);
}
