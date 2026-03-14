package com.neria.presupuestos.repository.product;

import com.neria.presupuestos.model.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductRepository extends JpaRepository<Product, String> {
    List<Product> findByTenantId(String tenantId);

    List<Product> findByTenantIdAndSectorId(String tenantId, String sectorId);

    boolean existsByTenantIdAndSectorId(String tenantId, String sectorId);

    boolean existsByTenantIdAndFormulaId(String tenantId, String formulaId);
}
