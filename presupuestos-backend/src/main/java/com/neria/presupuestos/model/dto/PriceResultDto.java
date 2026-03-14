package com.neria.presupuestos.model.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class PriceResultDto {
    private BigDecimal basePrice;
    private BigDecimal modifiers;
    private BigDecimal total;
}
