package com.neria.presupuestos.model.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank
    private String tenantName;

    private String tenantSector;

    @Email
    @NotBlank
    private String email;

    @NotBlank
    private String password;
}
