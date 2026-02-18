CREATE TABLE IF NOT EXISTS tenant_service_jira (
  id VARCHAR(36) NOT NULL,
  tenantId VARCHAR(36) NOT NULL,
  serviceCode VARCHAR(64) NOT NULL,
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  encryptedConfig TEXT NOT NULL,
  createdAt TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tenant_service_jira (tenantId, serviceCode),
  INDEX idx_tenant_service_jira_tenant (tenantId)
);
