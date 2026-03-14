package com.neria.presupuestos.model.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class QuoteItemOptionDto {
    private String id;
    private String quoteItemId;
    private String optionId;
    private String value;
    private BigDecimal priceModifier;
}
