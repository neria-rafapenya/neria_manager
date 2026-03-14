package com.neria.presupuestos.model.dto;

import lombok.Data;

import java.util.Map;

@Data
public class QuoteCalculationRequest {
    private String productId;
    private Integer quantity;
    private Map<String, String> options;
}
