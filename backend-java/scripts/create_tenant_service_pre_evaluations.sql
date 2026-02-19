CREATE TABLE IF NOT EXISTS tenant_service_pre_evaluations (
  id VARCHAR(36) PRIMARY KEY,
  tenantId VARCHAR(36) NOT NULL,
  serviceCode VARCHAR(64) NOT NULL,
  title VARCHAR(160) NULL,
  productType VARCHAR(64) NULL,
  status VARCHAR(16) NOT NULL,
  model VARCHAR(64) NULL,
  providerId VARCHAR(36) NULL,
  inputJson TEXT,
  resultJson TEXT,
  reportText TEXT,
  createdAt DATETIME,
  updatedAt DATETIME,
  INDEX idx_tenant_service_pre_evaluations (tenantId, serviceCode),
  INDEX idx_tenant_pre_evaluations_created (tenantId, createdAt)
);
