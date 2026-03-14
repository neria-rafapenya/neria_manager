ALTER TABLE presupuestos_sectors
    ADD COLUMN catalog_type VARCHAR(20) NOT NULL DEFAULT 'INTERNAL',
    ADD COLUMN external_api_base_url VARCHAR(512),
    ADD COLUMN external_api_token VARCHAR(512),
    ADD COLUMN external_products_endpoint VARCHAR(255),
    ADD COLUMN external_product_endpoint VARCHAR(255),
    ADD COLUMN external_product_options_endpoint VARCHAR(255),
    ADD COLUMN external_option_values_endpoint VARCHAR(255);
