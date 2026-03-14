package com.neria.presupuestos.model.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class QuoteCalculationResponse {
    private BigDecimal totalPrice;
    private PriceResultDto breakdown;
}
