CREATE TABLE IF NOT EXISTS tenant_service_financial_simulations (
  id VARCHAR(36) PRIMARY KEY,
  tenantId VARCHAR(36) NOT NULL,
  serviceCode VARCHAR(64) NOT NULL,
  title VARCHAR(160) NULL,
  productType VARCHAR(32) NOT NULL,
  currency VARCHAR(8) NOT NULL,
  status VARCHAR(16) NOT NULL,
  model VARCHAR(64) NULL,
  providerId VARCHAR(36) NULL,
  inputJson TEXT,
  resultJson TEXT,
  explanation TEXT,
  createdAt DATETIME,
  updatedAt DATETIME,
  INDEX idx_tenant_service_financial (tenantId, serviceCode),
  INDEX idx_tenant_financial_created (tenantId, createdAt)
);
