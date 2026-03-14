package com.neria.presupuestos.model.dto;

import com.neria.presupuestos.model.entity.PricingType;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class ProductDto {
    private String id;
    private String tenantId;
    private String name;
    private String description;
    private String sectorId;
    private String sectorName;
    private PricingType pricingType;
    private String formulaId;
    private String formulaName;
    private BigDecimal basePrice;
    private boolean active;
    private LocalDateTime createdAt;
}
