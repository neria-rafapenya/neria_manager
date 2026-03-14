ALTER TABLE presupuestos_products
    ADD COLUMN sector_id CHAR(36) NULL;

UPDATE presupuestos_products p
JOIN presupuestos_sectors s
  ON s.tenant_id = p.tenant_id
 AND LOWER(s.name) = LOWER(p.sector)
SET p.sector_id = s.id
WHERE p.sector IS NOT NULL
  AND p.sector <> '';

ALTER TABLE presupuestos_products
    DROP COLUMN sector;

ALTER TABLE presupuestos_products
    ADD CONSTRAINT fk_products_sector
    FOREIGN KEY (sector_id) REFERENCES presupuestos_sectors(id);
