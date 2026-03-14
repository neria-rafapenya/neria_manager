package com.neria.presupuestos.model.dto;

import com.neria.presupuestos.model.entity.UserRole;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class UserDto {
    private String id;
    private String tenantId;
    private String email;
    private UserRole role;
    private boolean mustChangePassword;
    private LocalDateTime createdAt;
}
