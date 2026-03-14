package com.neria.presupuestos.model.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class ProductMaterialCreateRequest {
    private String materialId;
    private String ruleType;
    private BigDecimal quantityFactor;
    private BigDecimal wastePercent;
    private String qualityTier;
    private Boolean active;
}
