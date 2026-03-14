package com.neria.presupuestos.repository.product;

import com.neria.presupuestos.model.entity.ProductOption;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductOptionRepository extends JpaRepository<ProductOption, String> {
    List<ProductOption> findByProductId(String productId);

    void deleteByProductId(String productId);
}
