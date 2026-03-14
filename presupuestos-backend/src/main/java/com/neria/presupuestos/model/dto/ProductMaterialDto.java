package com.neria.presupuestos.model.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class ProductMaterialDto {
    private String id;
    private String tenantId;
    private String productId;
    private String materialId;
    private String materialName;
    private String unit;
    private String ruleType;
    private BigDecimal quantityFactor;
    private BigDecimal wastePercent;
    private String qualityTier;
    private Boolean active;
    private LocalDateTime createdAt;
}
