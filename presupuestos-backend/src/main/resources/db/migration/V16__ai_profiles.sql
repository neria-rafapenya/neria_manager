CREATE TABLE presupuestos_ai_profiles (
    id CHAR(36) PRIMARY KEY,
    tenant_id CHAR(36) NOT NULL,
    sector_id CHAR(36),
    product_id CHAR(36),
    required_options TEXT,
    prompt_instructions TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    INDEX idx_ai_profiles_tenant (tenant_id),
    INDEX idx_ai_profiles_sector (sector_id),
    INDEX idx_ai_profiles_product (product_id),
    FOREIGN KEY (tenant_id) REFERENCES presupuestos_tenants(id),
    FOREIGN KEY (sector_id) REFERENCES presupuestos_sectors(id),
    FOREIGN KEY (product_id) REFERENCES presupuestos_products(id)
);
