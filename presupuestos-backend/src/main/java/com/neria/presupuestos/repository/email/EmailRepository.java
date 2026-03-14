package com.neria.presupuestos.repository.email;

import com.neria.presupuestos.model.entity.Email;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EmailRepository extends JpaRepository<Email, String> {
    List<Email> findByTenantId(String tenantId);
}
