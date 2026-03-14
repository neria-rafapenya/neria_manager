package com.neria.presupuestos.repository.formula;

import com.neria.presupuestos.model.entity.Formula;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FormulaRepository extends JpaRepository<Formula, String> {
    List<Formula> findByTenantId(String tenantId);
    List<Formula> findByTenantIdAndActiveTrue(String tenantId);
    List<Formula> findByTenantIdAndProductId(String tenantId, String productId);
    Optional<Formula> findByTenantIdAndNameIgnoreCase(String tenantId, String name);
}
