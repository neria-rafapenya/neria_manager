CREATE TABLE presupuestos_tenants (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    sector VARCHAR(100),
    created_at DATETIME NOT NULL,
    active BOOLEAN DEFAULT TRUE
);

CREATE TABLE presupuestos_users (
    id CHAR(36) PRIMARY KEY,
    tenant_id CHAR(36) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    role ENUM('ADMIN','STAFF'),
    created_at DATETIME NOT NULL,
    FOREIGN KEY (tenant_id) REFERENCES presupuestos_tenants(id)
);

CREATE TABLE presupuestos_customers (
    id CHAR(36) PRIMARY KEY,
    tenant_id CHAR(36) NOT NULL,
    name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    created_at DATETIME NOT NULL,
    FOREIGN KEY (tenant_id) REFERENCES presupuestos_tenants(id)
);

CREATE TABLE presupuestos_products (
    id CHAR(36) PRIMARY KEY,
    tenant_id CHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    pricing_type ENUM('FIXED','UNIT','FORMULA'),
    base_price DECIMAL(10,2),
    active BOOLEAN DEFAULT TRUE,
    created_at DATETIME,
    FOREIGN KEY (tenant_id) REFERENCES presupuestos_tenants(id)
);

CREATE TABLE presupuestos_product_options (
    id CHAR(36) PRIMARY KEY,
    product_id CHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    option_type ENUM('SELECT','NUMBER','BOOLEAN'),
    required BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (product_id) REFERENCES presupuestos_products(id)
);

CREATE TABLE presupuestos_option_values (
    id CHAR(36) PRIMARY KEY,
    option_id CHAR(36) NOT NULL,
    value VARCHAR(255),
    price_modifier DECIMAL(10,2) DEFAULT 0,
    FOREIGN KEY (option_id) REFERENCES presupuestos_product_options(id)
);

CREATE TABLE presupuestos_quotes (
    id CHAR(36) PRIMARY KEY,
    tenant_id CHAR(36) NOT NULL,
    customer_id CHAR(36),
    status ENUM('DRAFT','SENT','ACCEPTED','REJECTED'),
    total_price DECIMAL(10,2),
    created_at DATETIME,
    FOREIGN KEY (tenant_id) REFERENCES presupuestos_tenants(id),
    FOREIGN KEY (customer_id) REFERENCES presupuestos_customers(id)
);

CREATE TABLE presupuestos_quote_items (
    id CHAR(36) PRIMARY KEY,
    quote_id CHAR(36) NOT NULL,
    product_id CHAR(36),
    quantity INT,
    unit_price DECIMAL(10,2),
    total_price DECIMAL(10,2),
    FOREIGN KEY (quote_id) REFERENCES presupuestos_quotes(id),
    FOREIGN KEY (product_id) REFERENCES presupuestos_products(id)
);

CREATE TABLE presupuestos_quote_item_options (
    id CHAR(36) PRIMARY KEY,
    quote_item_id CHAR(36),
    option_id CHAR(36),
    value VARCHAR(255),
    price_modifier DECIMAL(10,2),
    FOREIGN KEY (quote_item_id) REFERENCES presupuestos_quote_items(id),
    FOREIGN KEY (option_id) REFERENCES presupuestos_product_options(id)
);

CREATE TABLE presupuestos_emails (
    id CHAR(36) PRIMARY KEY,
    tenant_id CHAR(36),
    customer_email VARCHAR(255),
    subject VARCHAR(255),
    body TEXT,
    status ENUM('NEW','PARSING','PARSED','QUOTE_CREATED','FAILED') DEFAULT 'NEW',
    processed BOOLEAN DEFAULT FALSE,
    created_at DATETIME
);

CREATE TABLE presupuestos_ai_requests (
    id CHAR(36) PRIMARY KEY,
    tenant_id CHAR(36),
    input_text TEXT,
    parsed_json JSON,
    confidence FLOAT,
    created_at DATETIME
);

CREATE TABLE presupuestos_subscriptions (
    id CHAR(36) PRIMARY KEY,
    tenant_id CHAR(36),
    plan ENUM('STARTER','PRO','BUSINESS'),
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    status ENUM('ACTIVE','PAUSED','CANCELLED'),
    created_at DATETIME
);

CREATE TABLE presupuestos_usage_metrics (
    id CHAR(36) PRIMARY KEY,
    tenant_id CHAR(36),
    metric_type VARCHAR(100),
    value INT,
    created_at DATETIME
);
