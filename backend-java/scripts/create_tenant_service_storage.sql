CREATE TABLE IF NOT EXISTS tenant_service_storage (
  id VARCHAR(36) NOT NULL,
  tenantId VARCHAR(36) NOT NULL,
  serviceCode VARCHAR(64) NOT NULL,
  provider VARCHAR(32) NOT NULL,
  encryptedConfig TEXT NOT NULL,
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  createdAt TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tenant_service_storage (tenantId, serviceCode),
  INDEX idx_tenant_service_storage_tenant (tenantId)
);
