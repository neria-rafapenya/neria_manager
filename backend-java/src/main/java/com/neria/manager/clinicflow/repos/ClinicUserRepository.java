package com.neria.manager.clinicflow.repos;

import com.neria.manager.clinicflow.entities.ClinicUser;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClinicUserRepository extends JpaRepository<ClinicUser, String> {
  List<ClinicUser> findAllByTenantId(String tenantId);

  Optional<ClinicUser> findByTenantIdAndEmail(String tenantId, String email);

  Optional<ClinicUser> findByIdAndTenantId(String id, String tenantId);
}
