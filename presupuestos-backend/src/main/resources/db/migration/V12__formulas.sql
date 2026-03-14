CREATE TABLE presupuestos_formulas (
    id CHAR(36) PRIMARY KEY,
    tenant_id CHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    base_price DECIMAL(10,2),
    unit_price DECIMAL(10,2),
    active BOOLEAN DEFAULT TRUE,
    created_at DATETIME,
    UNIQUE KEY uk_formulas_tenant_name (tenant_id, name),
    FOREIGN KEY (tenant_id) REFERENCES presupuestos_tenants(id)
);

ALTER TABLE presupuestos_products
    ADD COLUMN formula_id CHAR(36) NULL,
    ADD CONSTRAINT fk_products_formula FOREIGN KEY (formula_id) REFERENCES presupuestos_formulas(id);
