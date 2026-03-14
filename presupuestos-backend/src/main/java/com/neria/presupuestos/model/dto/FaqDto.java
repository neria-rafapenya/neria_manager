package com.neria.presupuestos.model.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class FaqDto {
    private String id;
    private String tenantId;
    private String question;
    private String answer;
    private Integer orderIndex;
    private LocalDateTime createdAt;
}
