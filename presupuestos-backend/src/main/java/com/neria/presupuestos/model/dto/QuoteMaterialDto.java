package com.neria.presupuestos.model.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class QuoteMaterialDto {
    private String id;
    private String quoteItemId;
    private String materialId;
    private String materialName;
    private String unit;
    private BigDecimal quantity;
    private BigDecimal unitCost;
    private BigDecimal totalCost;
}
