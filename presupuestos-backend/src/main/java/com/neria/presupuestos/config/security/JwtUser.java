package com.neria.presupuestos.config.security;

import com.neria.presupuestos.model.entity.UserRole;

public class JwtUser {
    private final String userId;
    private final String tenantId;
    private final String email;
    private final UserRole role;

    public JwtUser(String userId, String tenantId, String email, UserRole role) {
        this.userId = userId;
        this.tenantId = tenantId;
        this.email = email;
        this.role = role;
    }

    public String getUserId() {
        return userId;
    }

    public String getTenantId() {
        return tenantId;
    }

    public String getEmail() {
        return email;
    }

    public UserRole getRole() {
        return role;
    }
}
