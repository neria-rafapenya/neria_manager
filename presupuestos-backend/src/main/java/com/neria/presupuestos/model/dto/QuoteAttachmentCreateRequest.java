package com.neria.presupuestos.model.dto;

import lombok.Data;

@Data
public class QuoteAttachmentCreateRequest {
    private String url;
    private String fileName;
    private String contentType;
}
