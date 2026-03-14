package com.neria.presupuestos.model.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class MaterialUpdateRequest {
    private String sectorId;
    private String name;
    private String unit;
    private BigDecimal costPerUnit;
    private Boolean active;
}
