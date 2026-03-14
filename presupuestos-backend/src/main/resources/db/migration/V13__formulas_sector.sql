ALTER TABLE presupuestos_formulas
    ADD COLUMN sector_id CHAR(36) NULL,
    ADD CONSTRAINT fk_formulas_sector FOREIGN KEY (sector_id) REFERENCES presupuestos_sectors(id);
