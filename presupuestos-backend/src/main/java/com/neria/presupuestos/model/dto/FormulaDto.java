package com.neria.presupuestos.model.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class FormulaDto {
    private String id;
    private String tenantId;
    private String sectorId;
    private String sectorName;
    private String productId;
    private String productName;
    private String name;
    private String description;
    private BigDecimal basePrice;
    private BigDecimal unitPrice;
    private boolean active;
    private LocalDateTime createdAt;
}
