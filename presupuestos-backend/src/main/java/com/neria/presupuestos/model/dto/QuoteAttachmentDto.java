package com.neria.presupuestos.model.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class QuoteAttachmentDto {
    private String id;
    private String tenantId;
    private String quoteId;
    private String url;
    private String fileName;
    private String contentType;
    private LocalDateTime createdAt;
}
