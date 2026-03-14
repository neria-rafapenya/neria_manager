package com.neria.presupuestos.model.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class SectorDto {
    private String id;
    private String tenantId;
    private String name;
    private boolean active;
    private String catalogType;
    private String externalApiBaseUrl;
    private String externalProductsEndpoint;
    private String externalProductEndpoint;
    private String externalProductOptionsEndpoint;
    private String externalOptionValuesEndpoint;
    private LocalDateTime createdAt;
}
