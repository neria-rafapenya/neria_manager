package com.neria.presupuestos.model.dto;

import lombok.Data;

import java.util.List;

@Data
public class QuoteItemCreateRequest {
    private String productId;
    private Integer quantity;
    private List<QuoteItemOptionCreateRequest> options;
    private String formulaId;
    private String formulaName;
}
