package com.neria.presupuestos.model.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.Filter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "presupuestos_product_materials")
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
public class ProductMaterial {
    @Id
    @Column(length = 36, columnDefinition = "CHAR(36)")
    private String id;

    @Column(name = "tenant_id", length = 36, columnDefinition = "CHAR(36)", nullable = false)
    private String tenantId;

    @Column(name = "product_id", length = 36, columnDefinition = "CHAR(36)", nullable = false)
    private String productId;

    @Column(name = "material_id", length = 36, columnDefinition = "CHAR(36)", nullable = false)
    private String materialId;

    @Enumerated(EnumType.STRING)
    @Column(name = "rule_type", nullable = false)
    private MaterialRuleType ruleType = MaterialRuleType.PER_UNIT;

    @Column(name = "quantity_factor")
    private BigDecimal quantityFactor = BigDecimal.ONE;

    @Column(name = "waste_percent")
    private BigDecimal wastePercent = BigDecimal.ZERO;

    @Column(name = "quality_tier")
    private String qualityTier;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (id == null || id.isBlank()) {
            id = UUID.randomUUID().toString();
        }
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
