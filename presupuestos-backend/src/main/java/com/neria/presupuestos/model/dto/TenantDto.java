package com.neria.presupuestos.model.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class TenantDto {
    private String id;
    private String name;
    private String sector;
    private String companyEmail;
    private String companyPhone;
    private String companyAddress;
    private String logoUrl;
    private boolean active;
    private LocalDateTime createdAt;
}
