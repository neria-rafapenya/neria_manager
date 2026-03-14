package com.neria.presupuestos.repository.material;

import com.neria.presupuestos.model.entity.ProductMaterial;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductMaterialRepository extends JpaRepository<ProductMaterial, String> {
    List<ProductMaterial> findByTenantIdAndProductId(String tenantId, String productId);
    List<ProductMaterial> findByProductId(String productId);
}
