package com.neria.presupuestos.model.dto;

import lombok.Data;

import java.util.List;

@Data
public class QuoteCreateRequest {
    private String customerId;
    private String sector;
    private List<QuoteItemCreateRequest> items;
}
