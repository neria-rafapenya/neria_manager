package com.neria.presupuestos.repository.sector;

import com.neria.presupuestos.model.entity.Sector;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SectorRepository extends JpaRepository<Sector, String> {
    List<Sector> findByTenantId(String tenantId);

    List<Sector> findByTenantIdAndActiveTrue(String tenantId);

    Optional<Sector> findByTenantIdAndNameIgnoreCase(String tenantId, String name);
}
