ALTER TABLE presupuestos_users
    ADD COLUMN must_change_password BOOLEAN DEFAULT FALSE;

ALTER TABLE presupuestos_customers
    ADD COLUMN user_id CHAR(36) NULL;

ALTER TABLE presupuestos_customers
    ADD CONSTRAINT fk_customers_user
    FOREIGN KEY (user_id) REFERENCES presupuestos_users(id);
