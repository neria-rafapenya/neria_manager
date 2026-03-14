package com.neria.presupuestos.model.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class MaterialDto {
    private String id;
    private String tenantId;
    private String sectorId;
    private String name;
    private String unit;
    private BigDecimal costPerUnit;
    private Boolean active;
    private LocalDateTime createdAt;
}
