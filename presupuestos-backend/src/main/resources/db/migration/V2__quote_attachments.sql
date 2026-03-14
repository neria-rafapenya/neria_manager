CREATE TABLE presupuestos_quote_attachments (
    id CHAR(36) PRIMARY KEY,
    tenant_id CHAR(36) NOT NULL,
    quote_id CHAR(36) NOT NULL,
    url VARCHAR(2048) NOT NULL,
    file_name VARCHAR(255),
    content_type VARCHAR(120),
    created_at DATETIME,
    FOREIGN KEY (quote_id) REFERENCES presupuestos_quotes(id)
);
