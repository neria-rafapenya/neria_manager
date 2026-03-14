package com.neria.presupuestos.model.dto;

import lombok.Data;

@Data
public class AuthResponse {
    private String token;
    private UserDto user;
    private TenantDto tenant;
}
