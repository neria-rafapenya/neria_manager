CREATE TABLE IF NOT EXISTS sandbox_tax_deductions (
  id VARCHAR(36) NOT NULL,
  category VARCHAR(64) NOT NULL,
  name VARCHAR(160) NOT NULL,
  description TEXT NULL,
  maxAmount DECIMAL(12,2) NULL,
  region VARCHAR(64) NULL,
  updatedAt TIMESTAMP NULL,
  PRIMARY KEY (id),
  INDEX idx_sandbox_tax_deductions (category, region)
);

CREATE TABLE IF NOT EXISTS sandbox_tax_brackets (
  id VARCHAR(36) NOT NULL,
  region VARCHAR(64) NOT NULL,
  taxYear INT NOT NULL,
  minBase DECIMAL(12,2) NOT NULL,
  maxBase DECIMAL(12,2) NULL,
  rate DECIMAL(5,2) NOT NULL,
  updatedAt TIMESTAMP NULL,
  PRIMARY KEY (id),
  INDEX idx_sandbox_tax_brackets (region, taxYear)
);

CREATE TABLE IF NOT EXISTS sandbox_tax_documents (
  id VARCHAR(36) NOT NULL,
  category VARCHAR(64) NOT NULL,
  title VARCHAR(160) NOT NULL,
  description TEXT NULL,
  updatedAt TIMESTAMP NULL,
  PRIMARY KEY (id),
  INDEX idx_sandbox_tax_documents (category)
);

INSERT IGNORE INTO sandbox_tax_deductions (id, category, name, description, maxAmount, region, updatedAt)
VALUES
  (UUID(), 'vivienda', 'Hipoteca vivienda habitual', 'Deduccion por adquisicion de vivienda habitual (segun limites vigentes).', 15000.00, 'general', NOW()),
  (UUID(), 'familia', 'Maternidad', 'Deduccion por maternidad con hijos menores de 3 anos.', 1200.00, 'general', NOW()),
  (UUID(), 'donaciones', 'Donativos', 'Deducciones por donaciones a ONGs y entidades sin animo de lucro.', 5000.00, 'general', NOW()),
  (UUID(), 'ahorro', 'Aportacion a plan de pensiones', 'Reduccion por aportaciones a planes de pensiones.', 1500.00, 'general', NOW());

INSERT IGNORE INTO sandbox_tax_brackets (id, region, taxYear, minBase, maxBase, rate, updatedAt)
VALUES
  (UUID(), 'general', 2024, 0.00, 12450.00, 19.00, NOW()),
  (UUID(), 'general', 2024, 12450.01, 20200.00, 24.00, NOW()),
  (UUID(), 'general', 2024, 20200.01, 35200.00, 30.00, NOW()),
  (UUID(), 'general', 2024, 35200.01, 60000.00, 37.00, NOW()),
  (UUID(), 'general', 2024, 60000.01, NULL, 45.00, NOW());

INSERT IGNORE INTO sandbox_tax_documents (id, category, title, description, updatedAt)
VALUES
  (UUID(), 'ingresos', 'Certificado de retenciones', 'Documento con retenciones e ingresos del trabajo.', NOW()),
  (UUID(), 'vivienda', 'Recibos de hipoteca', 'Recibos anuales de la hipoteca de vivienda habitual.', NOW()),
  (UUID(), 'familia', 'Libro de familia', 'Documentacion para deducciones familiares.', NOW()),
  (UUID(), 'donaciones', 'Certificado de donaciones', 'Justificantes de donaciones a entidades.', NOW());
