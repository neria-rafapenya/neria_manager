package com.neria.presupuestos.model.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class FormulaCreateRequest {
    private String sectorId;
    private String productId;
    private String name;
    private String description;
    private BigDecimal basePrice;
    private BigDecimal unitPrice;
    private Boolean active;
}
