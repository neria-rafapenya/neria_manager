package com.neria.presupuestos.model.dto;

import com.neria.presupuestos.model.entity.QuoteStatus;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class QuoteDto {
    private String id;
    private String tenantId;
    private String customerId;
    private String sector;
    private QuoteStatus status;
    private BigDecimal totalPrice;
    private LocalDateTime createdAt;
    private List<QuoteItemDto> items;
}
