CREATE TABLE IF NOT EXISTS sandbox_staff (
  id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  specialty VARCHAR(120) NOT NULL,
  location VARCHAR(120) NOT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS sandbox_appointment_slots (
  id VARCHAR(36) NOT NULL,
  staffId VARCHAR(36) NOT NULL,
  service VARCHAR(120) NOT NULL,
  startAt TIMESTAMP NOT NULL,
  endAt TIMESTAMP NOT NULL,
  location VARCHAR(120) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'available',
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_sandbox_slots_staff (staffId),
  KEY idx_sandbox_slots_start (startAt)
);

CREATE TABLE IF NOT EXISTS sandbox_appointments (
  id VARCHAR(36) NOT NULL,
  slotId VARCHAR(36) NOT NULL,
  staffId VARCHAR(36) NOT NULL,
  service VARCHAR(120) NOT NULL,
  customerName VARCHAR(255) NOT NULL,
  customerEmail VARCHAR(255) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'confirmed',
  notes TEXT NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_sandbox_appointments_slot (slotId)
);

INSERT IGNORE INTO sandbox_staff (id, name, specialty, location)
VALUES
  ('b7f3c8ad-6b8a-4d51-a9e6-8a7e2e8c3101', 'Clara Ruiz', 'Hipotecas', 'Madrid Centro'),
  ('b7f3c8ad-6b8a-4d51-a9e6-8a7e2e8c3102', 'Luis Vega', 'Prestamos', 'Barcelona Diagonal'),
  ('b7f3c8ad-6b8a-4d51-a9e6-8a7e2e8c3103', 'Nuria Sanz', 'Inversion', 'Valencia');

INSERT IGNORE INTO sandbox_appointment_slots (id, staffId, service, startAt, endAt, location)
VALUES
  ('c1a1f64f-cc12-4d7f-82a2-7d3dcb7c4e01', 'b7f3c8ad-6b8a-4d51-a9e6-8a7e2e8c3101', 'gestion-citas', '2026-03-05 09:00:00', '2026-03-05 09:30:00', 'Madrid Centro'),
  ('c1a1f64f-cc12-4d7f-82a2-7d3dcb7c4e02', 'b7f3c8ad-6b8a-4d51-a9e6-8a7e2e8c3101', 'gestion-citas', '2026-03-05 10:00:00', '2026-03-05 10:30:00', 'Madrid Centro'),
  ('c1a1f64f-cc12-4d7f-82a2-7d3dcb7c4e03', 'b7f3c8ad-6b8a-4d51-a9e6-8a7e2e8c3102', 'gestion-citas', '2026-03-05 11:00:00', '2026-03-05 11:30:00', 'Barcelona Diagonal');
