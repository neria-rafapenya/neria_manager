CREATE TABLE IF NOT EXISTS clinic_settings (
  id VARCHAR(36) PRIMARY KEY,
  tenantId VARCHAR(36) NOT NULL,
  name VARCHAR(180) NULL,
  legalName VARCHAR(180) NULL,
  email VARCHAR(120) NULL,
  phone VARCHAR(80) NULL,
  address VARCHAR(255) NULL,
  timezone VARCHAR(80) NULL,
  website VARCHAR(180) NULL,
  emergencyDisclaimer TEXT NULL,
  privacyNotice TEXT NULL,
  openingHours JSON NULL,
  channels JSON NULL,
  createdAt DATETIME NULL,
  updatedAt DATETIME NULL,
  UNIQUE KEY uq_clinic_settings_tenant (tenantId)
);

CREATE TABLE IF NOT EXISTS clinic_services (
  id VARCHAR(36) PRIMARY KEY,
  tenantId VARCHAR(36) NOT NULL,
  code VARCHAR(80) NULL,
  name VARCHAR(180) NOT NULL,
  specialty VARCHAR(120) NULL,
  durationMin INT NULL,
  priceMin DECIMAL(10,2) NULL,
  priceMax DECIMAL(10,2) NULL,
  prepNotes TEXT NULL,
  isActive TINYINT(1) NOT NULL DEFAULT 1,
  createdAt DATETIME NULL,
  updatedAt DATETIME NULL,
  KEY idx_clinic_services_tenant (tenantId)
);

CREATE TABLE IF NOT EXISTS clinic_protocols (
  id VARCHAR(36) PRIMARY KEY,
  tenantId VARCHAR(36) NOT NULL,
  title VARCHAR(180) NOT NULL,
  version VARCHAR(32) NULL,
  status VARCHAR(32) NULL,
  summary VARCHAR(255) NULL,
  content TEXT NULL,
  approvedBy VARCHAR(120) NULL,
  approvedAt DATETIME NULL,
  createdAt DATETIME NULL,
  updatedAt DATETIME NULL,
  KEY idx_clinic_protocols_tenant (tenantId)
);

CREATE TABLE IF NOT EXISTS clinic_faq_entries (
  id VARCHAR(36) PRIMARY KEY,
  tenantId VARCHAR(36) NOT NULL,
  question VARCHAR(255) NOT NULL,
  answer TEXT NULL,
  category VARCHAR(120) NULL,
  priority INT NULL,
  isActive TINYINT(1) NOT NULL DEFAULT 1,
  createdAt DATETIME NULL,
  updatedAt DATETIME NULL,
  KEY idx_clinic_faq_tenant (tenantId)
);

CREATE TABLE IF NOT EXISTS clinic_triage_flows (
  id VARCHAR(36) PRIMARY KEY,
  tenantId VARCHAR(36) NOT NULL,
  name VARCHAR(180) NOT NULL,
  description TEXT NULL,
  status VARCHAR(32) NULL,
  outcome VARCHAR(120) NULL,
  steps JSON NULL,
  createdAt DATETIME NULL,
  updatedAt DATETIME NULL,
  KEY idx_clinic_triage_tenant (tenantId)
);

CREATE TABLE IF NOT EXISTS clinic_report_templates (
  id VARCHAR(36) PRIMARY KEY,
  tenantId VARCHAR(36) NOT NULL,
  name VARCHAR(180) NOT NULL,
  specialty VARCHAR(120) NULL,
  status VARCHAR(32) NULL,
  template JSON NULL,
  createdAt DATETIME NULL,
  updatedAt DATETIME NULL,
  KEY idx_clinic_reports_tenant (tenantId)
);
