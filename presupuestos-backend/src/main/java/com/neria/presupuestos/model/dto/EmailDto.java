package com.neria.presupuestos.model.dto;

import com.neria.presupuestos.model.entity.EmailStatus;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class EmailDto {
    private String id;
    private String tenantId;
    private String customerEmail;
    private String subject;
    private String body;
    private EmailStatus status;
    private boolean processed;
    private LocalDateTime createdAt;
}
