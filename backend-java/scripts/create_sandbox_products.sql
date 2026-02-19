CREATE TABLE IF NOT EXISTS sandbox_products (
  id VARCHAR(36) NOT NULL,
  sku VARCHAR(64) NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(120) NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency VARCHAR(8) NOT NULL DEFAULT 'EUR',
  stock INT NOT NULL DEFAULT 0,
  tags JSON NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_sandbox_products_sku (sku),
  KEY idx_sandbox_products_category (category)
);

INSERT IGNORE INTO sandbox_products (id, sku, name, category, description, price, currency, stock, tags)
VALUES
  ('2f2b0a2e-8f6c-4a7d-8fb4-1c6cf45c9d01', 'CAR-001', 'Coche Urbano Atlas', 'Coches', 'Compacto ideal para ciudad, bajo consumo y facil aparcamiento.', 13990.00, 'EUR', 8, '["urbano","gasolina","manual"]'),
  ('2f2b0a2e-8f6c-4a7d-8fb4-1c6cf45c9d02', 'CAR-002', 'SUV Boreal X', 'Coches', 'SUV familiar con amplio maletero y asistencias de seguridad.', 27900.00, 'EUR', 5, '["suv","diesel","automatico"]'),
  ('2f2b0a2e-8f6c-4a7d-8fb4-1c6cf45c9d03', 'CAR-003', 'Electrico Lumen', 'Coches', 'Vehiculo electrico con autonomia de 420 km.', 31900.00, 'EUR', 3, '["electrico","autonomia","silencioso"]'),
  ('2f2b0a2e-8f6c-4a7d-8fb4-1c6cf45c9d04', 'CAR-004', 'Furgoneta Cargo M', 'Comerciales', 'Furgoneta para reparto urbano con gran capacidad de carga.', 24900.00, 'EUR', 4, '["carga","diesel","profesional"]');
