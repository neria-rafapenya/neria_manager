package com.neria.presupuestos.model.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class QuoteItemDto {
    private String id;
    private String quoteId;
    private String productId;
    private String formulaId;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal totalPrice;
    private List<QuoteItemOptionDto> options;
    private List<QuoteMaterialDto> materials;
}
