package com.neria.presupuestos.model.dto;

import lombok.Data;

@Data
public class TenantUpdateRequest {
    private String name;
    private String sector;
    private String companyEmail;
    private String companyPhone;
    private String companyAddress;
    private String logoUrl;
    private Boolean active;
}
