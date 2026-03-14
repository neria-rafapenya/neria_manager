package com.neria.presupuestos.util;

public final class TenantResolver {
    private TenantResolver() {
    }

    public static String requireTenantId() {
        String tenantId = TenantContext.getTenantId();
        if (tenantId == null || tenantId.isBlank()) {
            throw new IllegalStateException("TenantId is required for this operation");
        }
        return tenantId;
    }
}
