CREATE TABLE IF NOT EXISTS sandbox_operational_documents (
  id VARCHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(120) NOT NULL,
  source VARCHAR(120) NOT NULL,
  content TEXT NOT NULL,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_sandbox_operational_documents_category (category)
);

CREATE TABLE IF NOT EXISTS sandbox_operational_policies (
  id VARCHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS sandbox_operational_templates (
  id VARCHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

INSERT IGNORE INTO sandbox_operational_documents (id, title, category, source, content)
VALUES
  ('5a90c1be-54a8-4f1f-8f7a-1a9bb9f1a101', 'Guia de producto - Cuenta Nomina', 'Productos', 'Manual interno', 'Resumen de beneficios, condiciones de apertura y requisitos de la Cuenta Nomina.'),
  ('5a90c1be-54a8-4f1f-8f7a-1a9bb9f1a102', 'Procedimiento de incidencias', 'Operaciones', 'Procedimiento', 'Pasos para registrar, clasificar y escalar incidencias operativas.'),
  ('5a90c1be-54a8-4f1f-8f7a-1a9bb9f1a103', 'FAQ Hipotecas', 'Productos', 'FAQ', 'Respuestas rapidas a dudas frecuentes sobre hipotecas y amortizaciones.');

INSERT IGNORE INTO sandbox_operational_policies (id, title, content)
VALUES
  ('5a90c1be-54a8-4f1f-8f7a-1a9bb9f1a201', 'Politica de privacidad interna', 'Lineamientos para evitar el uso de datos sensibles en comunicaciones internas.'),
  ('5a90c1be-54a8-4f1f-8f7a-1a9bb9f1a202', 'Politica de comunicacion', 'Guia de tono y estilo para respuestas operativas.');

INSERT IGNORE INTO sandbox_operational_templates (id, title, content)
VALUES
  ('5a90c1be-54a8-4f1f-8f7a-1a9bb9f1a301', 'Respuesta standard a dudas de producto', 'Hola {nombre},\n\nGracias por tu consulta. A continuacion, te compartimos la informacion solicitada...'),
  ('5a90c1be-54a8-4f1f-8f7a-1a9bb9f1a302', 'Aviso de documentacion pendiente', 'Hola {nombre},\n\nPara continuar, necesitamos la siguiente documentacion...');
