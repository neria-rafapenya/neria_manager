package com.neria.presupuestos.pricing.engine;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class PriceResult {
    private BigDecimal basePrice;
    private BigDecimal modifiers;
    private BigDecimal total;
}
