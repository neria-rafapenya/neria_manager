package com.neria.presupuestos.controller.materials;

import com.neria.presupuestos.model.dto.ProductMaterialCreateRequest;
import com.neria.presupuestos.model.dto.ProductMaterialDto;
import com.neria.presupuestos.model.dto.ProductMaterialUpdateRequest;
import com.neria.presupuestos.service.material.ProductMaterialService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class ProductMaterialsController {

    private final ProductMaterialService productMaterialService;

    public ProductMaterialsController(ProductMaterialService productMaterialService) {
        this.productMaterialService = productMaterialService;
    }

    @GetMapping("/products/{productId}/materials")
    public ResponseEntity<List<ProductMaterialDto>> list(@PathVariable String productId) {
        return ResponseEntity.ok(productMaterialService.list(productId));
    }

    @PostMapping("/products/{productId}/materials")
    public ResponseEntity<ProductMaterialDto> create(@PathVariable String productId,
                                                     @RequestBody ProductMaterialCreateRequest request) {
        return ResponseEntity.ok(productMaterialService.create(productId, request));
    }

    @PutMapping("/product-materials/{id}")
    public ResponseEntity<ProductMaterialDto> update(@PathVariable String id,
                                                     @RequestBody ProductMaterialUpdateRequest request) {
        return ResponseEntity.ok(productMaterialService.update(id, request));
    }

    @DeleteMapping("/product-materials/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        productMaterialService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
