package com.neria.presupuestos.repository.material;

import com.neria.presupuestos.model.entity.Material;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MaterialRepository extends JpaRepository<Material, String> {
    List<Material> findByTenantId(String tenantId);
    List<Material> findByTenantIdAndSectorId(String tenantId, String sectorId);
}
