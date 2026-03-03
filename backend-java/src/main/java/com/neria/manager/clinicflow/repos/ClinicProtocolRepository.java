package com.neria.manager.clinicflow.repos;

import com.neria.manager.clinicflow.entities.ClinicProtocol;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClinicProtocolRepository extends JpaRepository<ClinicProtocol, String> {
  List<ClinicProtocol> findAllByTenantId(String tenantId);
  Optional<ClinicProtocol> findByIdAndTenantId(String id, String tenantId);
}
