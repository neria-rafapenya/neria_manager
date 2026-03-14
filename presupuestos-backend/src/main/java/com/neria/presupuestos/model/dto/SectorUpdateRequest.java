package com.neria.presupuestos.model.dto;

import lombok.Data;

@Data
public class SectorUpdateRequest {
    private String name;
    private Boolean active;
    private String catalogType;
    private String externalApiBaseUrl;
    private String externalApiToken;
    private String externalProductsEndpoint;
    private String externalProductEndpoint;
    private String externalProductOptionsEndpoint;
    private String externalOptionValuesEndpoint;
}
