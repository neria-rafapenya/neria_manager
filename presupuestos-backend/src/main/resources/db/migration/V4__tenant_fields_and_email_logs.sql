ALTER TABLE presupuestos_tenants
    ADD COLUMN company_email VARCHAR(255),
    ADD COLUMN company_phone VARCHAR(60),
    ADD COLUMN company_address VARCHAR(255),
    ADD COLUMN logo_url VARCHAR(2048);

CREATE TABLE presupuestos_quote_email_logs (
    id CHAR(36) PRIMARY KEY,
    tenant_id CHAR(36) NOT NULL,
    quote_id CHAR(36) NOT NULL,
    customer_email VARCHAR(255),
    status ENUM('SENT','FAILED') NOT NULL,
    error_message TEXT,
    created_at DATETIME,
    FOREIGN KEY (tenant_id) REFERENCES presupuestos_tenants(id),
    FOREIGN KEY (quote_id) REFERENCES presupuestos_quotes(id)
);
