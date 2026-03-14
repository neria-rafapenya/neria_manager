CREATE TABLE presupuestos_faqs (
    id CHAR(36) PRIMARY KEY,
    tenant_id CHAR(36) NOT NULL,
    question VARCHAR(500) NOT NULL,
    answer TEXT,
    order_index INT,
    created_at DATETIME,
    FOREIGN KEY (tenant_id) REFERENCES presupuestos_tenants(id)
);
