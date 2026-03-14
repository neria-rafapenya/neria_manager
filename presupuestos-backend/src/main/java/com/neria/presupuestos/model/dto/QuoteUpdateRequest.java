package com.neria.presupuestos.model.dto;

import com.neria.presupuestos.model.entity.QuoteStatus;
import lombok.Data;

import java.util.List;

@Data
public class QuoteUpdateRequest {
    private QuoteStatus status;
    private String sector;
    private List<QuoteItemCreateRequest> items;
}
