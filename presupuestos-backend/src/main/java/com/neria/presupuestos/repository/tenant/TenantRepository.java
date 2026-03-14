package com.neria.presupuestos.repository.tenant;

import com.neria.presupuestos.model.entity.Tenant;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TenantRepository extends JpaRepository<Tenant, String> {
}
