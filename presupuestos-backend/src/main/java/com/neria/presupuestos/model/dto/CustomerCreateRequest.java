package com.neria.presupuestos.model.dto;

import lombok.Data;

@Data
public class CustomerCreateRequest {
    private String name;
    private String email;
    private String phone;
}
