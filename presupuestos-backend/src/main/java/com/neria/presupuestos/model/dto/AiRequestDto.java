package com.neria.presupuestos.model.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AiRequestDto {
    private String id;
    private String tenantId;
    private String inputText;
    private String parsedJson;
    private Float confidence;
    private String errorMessage;
    private LocalDateTime createdAt;
}
