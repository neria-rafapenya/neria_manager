package com.neria.presupuestos.model.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CustomerDto {
    private String id;
    private String tenantId;
    private String name;
    private String email;
    private String phone;
    private String userId;
    private LocalDateTime createdAt;
}
