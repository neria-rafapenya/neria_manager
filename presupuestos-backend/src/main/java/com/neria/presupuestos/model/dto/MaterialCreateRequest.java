package com.neria.presupuestos.model.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class MaterialCreateRequest {
    private String sectorId;
    private String name;
    private String unit;
    private BigDecimal costPerUnit;
    private Boolean active;
}
