CREATE TABLE presupuestos_sectors (
    id CHAR(36) PRIMARY KEY,
    tenant_id CHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at DATETIME,
    UNIQUE KEY uk_sectors_tenant_name (tenant_id, name),
    FOREIGN KEY (tenant_id) REFERENCES presupuestos_tenants(id)
);
