package com.neria.presupuestos.controller.products;

import com.neria.presupuestos.model.dto.OptionValueCreateRequest;
import com.neria.presupuestos.model.dto.OptionValueDto;
import com.neria.presupuestos.model.dto.OptionValueUpdateRequest;
import com.neria.presupuestos.model.dto.ProductCreateRequest;
import com.neria.presupuestos.model.dto.ProductDto;
import com.neria.presupuestos.model.dto.ProductOptionCreateRequest;
import com.neria.presupuestos.model.dto.ProductOptionDto;
import com.neria.presupuestos.model.dto.ProductOptionUpdateRequest;
import com.neria.presupuestos.model.dto.ProductUpdateRequest;
import com.neria.presupuestos.service.product.ProductService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/products")
public class ProductsController {

    private final ProductService productService;

    public ProductsController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    public ResponseEntity<List<ProductDto>> listProducts() {
        return ResponseEntity.ok(productService.list());
    }

    @PostMapping
    public ResponseEntity<ProductDto> createProduct(@RequestBody ProductCreateRequest request) {
        return ResponseEntity.ok(productService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductDto> updateProduct(@PathVariable String id, @RequestBody ProductUpdateRequest request) {
        return ResponseEntity.ok(productService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable String id) {
        productService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/options")
    public ResponseEntity<List<ProductOptionDto>> listOptions(@PathVariable String id) {
        return ResponseEntity.ok(productService.listOptions(id));
    }

    @PostMapping("/{id}/options")
    public ResponseEntity<ProductOptionDto> createOption(@PathVariable String id, @RequestBody ProductOptionCreateRequest request) {
        return ResponseEntity.ok(productService.createOption(id, request));
    }

    @PutMapping("/options/{optionId}")
    public ResponseEntity<ProductOptionDto> updateOption(
            @PathVariable String optionId,
            @RequestBody ProductOptionUpdateRequest request
    ) {
        return ResponseEntity.ok(productService.updateOption(optionId, request));
    }

    @DeleteMapping("/options/{optionId}")
    public ResponseEntity<Void> deleteOption(@PathVariable String optionId) {
        productService.deleteOption(optionId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/options/{optionId}/values")
    public ResponseEntity<List<OptionValueDto>> listOptionValues(@PathVariable String optionId) {
        return ResponseEntity.ok(productService.listOptionValues(optionId));
    }

    @PostMapping("/options/{optionId}/values")
    public ResponseEntity<OptionValueDto> createOptionValue(
            @PathVariable String optionId,
            @RequestBody OptionValueCreateRequest request
    ) {
        return ResponseEntity.ok(productService.createOptionValue(optionId, request));
    }

    @PutMapping("/options/values/{valueId}")
    public ResponseEntity<OptionValueDto> updateOptionValue(
            @PathVariable String valueId,
            @RequestBody OptionValueUpdateRequest request
    ) {
        return ResponseEntity.ok(productService.updateOptionValue(valueId, request));
    }

    @DeleteMapping("/options/values/{valueId}")
    public ResponseEntity<Void> deleteOptionValue(@PathVariable String valueId) {
        productService.deleteOptionValue(valueId);
        return ResponseEntity.noContent().build();
    }
}
