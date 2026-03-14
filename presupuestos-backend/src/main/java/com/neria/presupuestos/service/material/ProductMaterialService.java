package com.neria.presupuestos.service.material;

import com.neria.presupuestos.model.dto.ProductMaterialCreateRequest;
import com.neria.presupuestos.model.dto.ProductMaterialDto;
import com.neria.presupuestos.model.dto.ProductMaterialUpdateRequest;
import com.neria.presupuestos.model.entity.Material;
import com.neria.presupuestos.model.entity.MaterialRuleType;
import com.neria.presupuestos.model.entity.Product;
import com.neria.presupuestos.model.entity.ProductMaterial;
import com.neria.presupuestos.repository.material.MaterialRepository;
import com.neria.presupuestos.repository.material.ProductMaterialRepository;
import com.neria.presupuestos.repository.product.ProductRepository;
import com.neria.presupuestos.util.TenantResolver;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class ProductMaterialService {

    private final ProductMaterialRepository productMaterialRepository;
    private final MaterialRepository materialRepository;
    private final ProductRepository productRepository;

    public ProductMaterialService(ProductMaterialRepository productMaterialRepository,
                                  MaterialRepository materialRepository,
                                  ProductRepository productRepository) {
        this.productMaterialRepository = productMaterialRepository;
        this.materialRepository = materialRepository;
        this.productRepository = productRepository;
    }

    public List<ProductMaterialDto> list(String productId) {
        String tenantId = TenantResolver.requireTenantId();
        return productMaterialRepository.findByTenantIdAndProductId(tenantId, productId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public ProductMaterialDto create(String productId, ProductMaterialCreateRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Request is required");
        }
        String tenantId = TenantResolver.requireTenantId();
        Product product = getProductOrThrow(tenantId, productId);
        Material material = getMaterialOrThrow(tenantId, request.getMaterialId());
        ensureSameSector(product, material);

        ProductMaterial rule = new ProductMaterial();
        rule.setTenantId(tenantId);
        rule.setProductId(product.getId());
        rule.setMaterialId(material.getId());
        rule.setRuleType(parseRuleType(request.getRuleType()));
        rule.setQuantityFactor(request.getQuantityFactor() == null ? BigDecimal.ONE : request.getQuantityFactor());
        rule.setWastePercent(request.getWastePercent() == null ? BigDecimal.ZERO : request.getWastePercent());
        rule.setQualityTier(request.getQualityTier());
        if (request.getActive() != null) {
            rule.setActive(request.getActive());
        }
        return toDto(productMaterialRepository.save(rule));
    }

    @Transactional
    public ProductMaterialDto update(String id, ProductMaterialUpdateRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Request is required");
        }
        ProductMaterial rule = getRuleOrThrow(id);
        String tenantId = TenantResolver.requireTenantId();
        Product product = getProductOrThrow(tenantId, rule.getProductId());

        if (request.getMaterialId() != null) {
            Material material = getMaterialOrThrow(tenantId, request.getMaterialId());
            ensureSameSector(product, material);
            rule.setMaterialId(material.getId());
        }
        if (request.getRuleType() != null) {
            rule.setRuleType(parseRuleType(request.getRuleType()));
        }
        if (request.getQuantityFactor() != null) {
            rule.setQuantityFactor(request.getQuantityFactor());
        }
        if (request.getWastePercent() != null) {
            rule.setWastePercent(request.getWastePercent());
        }
        if (request.getQualityTier() != null) {
            rule.setQualityTier(request.getQualityTier());
        }
        if (request.getActive() != null) {
            rule.setActive(request.getActive());
        }
        return toDto(productMaterialRepository.save(rule));
    }

    @Transactional
    public void delete(String id) {
        ProductMaterial rule = getRuleOrThrow(id);
        productMaterialRepository.delete(rule);
    }

    private ProductMaterial getRuleOrThrow(String id) {
        String tenantId = TenantResolver.requireTenantId();
        return productMaterialRepository.findById(id)
                .filter(rule -> tenantId.equals(rule.getTenantId()))
                .orElseThrow(() -> new IllegalArgumentException("Material rule not found"));
    }

    private Product getProductOrThrow(String tenantId, String productId) {
        return productRepository.findById(productId)
                .filter(product -> tenantId.equals(product.getTenantId()))
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));
    }

    private Material getMaterialOrThrow(String tenantId, String materialId) {
        if (materialId == null || materialId.isBlank()) {
            throw new IllegalArgumentException("Material is required");
        }
        return materialRepository.findById(materialId)
                .filter(material -> tenantId.equals(material.getTenantId()))
                .orElseThrow(() -> new IllegalArgumentException("Material not found"));
    }

    private void ensureSameSector(Product product, Material material) {
        if (product == null || product.getSectorId() == null || product.getSectorId().isBlank()) {
            throw new IllegalArgumentException("Product sector is required");
        }
        if (material.getSectorId() == null || material.getSectorId().isBlank()) {
            throw new IllegalArgumentException("Material sector is required");
        }
        if (!product.getSectorId().equals(material.getSectorId())) {
            throw new IllegalArgumentException("Material sector mismatch");
        }
    }

    private MaterialRuleType parseRuleType(String value) {
        if (value == null || value.isBlank()) {
            return MaterialRuleType.PER_UNIT;
        }
        try {
            return MaterialRuleType.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Invalid rule type");
        }
    }

    private ProductMaterialDto toDto(ProductMaterial rule) {
        ProductMaterialDto dto = new ProductMaterialDto();
        dto.setId(rule.getId());
        dto.setTenantId(rule.getTenantId());
        dto.setProductId(rule.getProductId());
        dto.setMaterialId(rule.getMaterialId());
        dto.setRuleType(rule.getRuleType().name());
        dto.setQuantityFactor(rule.getQuantityFactor());
        dto.setWastePercent(rule.getWastePercent());
        dto.setQualityTier(rule.getQualityTier());
        dto.setActive(rule.isActive());
        dto.setCreatedAt(rule.getCreatedAt());

        materialRepository.findById(rule.getMaterialId())
                .ifPresent(material -> {
                    dto.setMaterialName(material.getName());
                    dto.setUnit(material.getUnit());
                });
        return dto;
    }
}
