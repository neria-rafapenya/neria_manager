CREATE TABLE IF NOT EXISTS tenant_service_operational_support (
  id VARCHAR(36) PRIMARY KEY,
  tenantId VARCHAR(36) NOT NULL,
  serviceCode VARCHAR(64) NOT NULL,
  title VARCHAR(160) NULL,
  entryType VARCHAR(24) NOT NULL,
  status VARCHAR(16) NOT NULL,
  model VARCHAR(64) NULL,
  providerId VARCHAR(36) NULL,
  inputJson TEXT,
  resultJson TEXT,
  reportText TEXT,
  createdAt DATETIME,
  updatedAt DATETIME,
  INDEX idx_tenant_service_operational_support (tenantId, serviceCode),
  INDEX idx_tenant_operational_support_created (tenantId, createdAt)
);
