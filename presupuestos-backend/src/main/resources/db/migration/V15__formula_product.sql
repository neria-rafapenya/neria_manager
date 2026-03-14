ALTER TABLE presupuestos_formulas
ADD COLUMN product_id CHAR(36) NULL AFTER sector_id;

CREATE INDEX idx_formulas_product ON presupuestos_formulas (product_id);
