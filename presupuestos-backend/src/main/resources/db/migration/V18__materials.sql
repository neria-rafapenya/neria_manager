CREATE TABLE presupuestos_materials (
    id CHAR(36) PRIMARY KEY,
    tenant_id CHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    cost_per_unit DECIMAL(10,2) NOT NULL DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at DATETIME,
    FOREIGN KEY (tenant_id) REFERENCES presupuestos_tenants(id)
);

CREATE TABLE presupuestos_product_materials (
    id CHAR(36) PRIMARY KEY,
    tenant_id CHAR(36) NOT NULL,
    product_id CHAR(36) NOT NULL,
    material_id CHAR(36) NOT NULL,
    rule_type VARCHAR(30) NOT NULL,
    quantity_factor DECIMAL(12,4) DEFAULT 1,
    waste_percent DECIMAL(6,2) DEFAULT 0,
    quality_tier VARCHAR(20),
    active BOOLEAN DEFAULT TRUE,
    created_at DATETIME,
    FOREIGN KEY (tenant_id) REFERENCES presupuestos_tenants(id),
    FOREIGN KEY (product_id) REFERENCES presupuestos_products(id),
    FOREIGN KEY (material_id) REFERENCES presupuestos_materials(id)
);

CREATE TABLE presupuestos_quote_materials (
    id CHAR(36) PRIMARY KEY,
    quote_item_id CHAR(36) NOT NULL,
    material_id CHAR(36) NOT NULL,
    quantity DECIMAL(12,4) NOT NULL,
    unit_cost DECIMAL(10,2),
    total_cost DECIMAL(12,2),
    created_at DATETIME,
    FOREIGN KEY (quote_item_id) REFERENCES presupuestos_quote_items(id),
    FOREIGN KEY (material_id) REFERENCES presupuestos_materials(id)
);
