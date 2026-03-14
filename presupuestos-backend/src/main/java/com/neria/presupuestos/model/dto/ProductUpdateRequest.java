package com.neria.presupuestos.model.dto;

import com.neria.presupuestos.model.entity.PricingType;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ProductUpdateRequest {
    private String name;
    private String description;
    private String sectorId;
    private PricingType pricingType;
    private String formulaId;
    private BigDecimal basePrice;
    private Boolean active;
}
