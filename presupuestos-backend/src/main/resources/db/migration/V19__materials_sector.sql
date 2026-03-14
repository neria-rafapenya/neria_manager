ALTER TABLE presupuestos_materials
    ADD COLUMN sector_id CHAR(36) NULL AFTER tenant_id,
    ADD INDEX idx_materials_sector (sector_id),
    ADD CONSTRAINT fk_materials_sector FOREIGN KEY (sector_id) REFERENCES presupuestos_sectors(id);
