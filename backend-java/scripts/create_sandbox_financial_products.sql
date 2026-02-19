CREATE TABLE IF NOT EXISTS sandbox_financial_products (
  id VARCHAR(36) NOT NULL,
  code VARCHAR(64) NOT NULL,
  name VARCHAR(255) NOT NULL,
  productType VARCHAR(64) NOT NULL,
  minAmount DECIMAL(12,2) NOT NULL,
  maxAmount DECIMAL(12,2) NOT NULL,
  minTermMonths INT NOT NULL,
  maxTermMonths INT NOT NULL,
  baseRate DECIMAL(5,2) NOT NULL,
  currency VARCHAR(8) NOT NULL DEFAULT 'EUR',
  description TEXT NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_sandbox_financial_products_code (code)
);

INSERT IGNORE INTO sandbox_financial_products
  (id, code, name, productType, minAmount, maxAmount, minTermMonths, maxTermMonths, baseRate, currency, description)
VALUES
  ('76a04f4d-2b95-4f11-8c46-6f3c7cdbf501', 'hipoteca-hogar', 'Hipoteca Hogar Flexible', 'hipoteca', 60000, 400000, 120, 360, 2.75, 'EUR', 'Hipoteca con tipo fijo competitivo y opciones de amortizacion anticipada.'),
  ('76a04f4d-2b95-4f11-8c46-6f3c7cdbf502', 'prestamo-auto', 'Prestamo Auto Verde', 'prestamo', 5000, 60000, 12, 96, 4.10, 'EUR', 'Prestamo para vehiculos con bonificacion para modelos electricos.'),
  ('76a04f4d-2b95-4f11-8c46-6f3c7cdbf503', 'prestamo-personal', 'Prestamo Personal Express', 'prestamo', 2000, 20000, 6, 60, 5.50, 'EUR', 'Prestamo rapido para consumo con aprobacion en 24h.');
