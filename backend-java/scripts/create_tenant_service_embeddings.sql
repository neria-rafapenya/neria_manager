CREATE TABLE IF NOT EXISTS tenant_service_embeddings (
  id VARCHAR(36) NOT NULL,
  tenantId VARCHAR(36) NOT NULL,
  serviceCode VARCHAR(64) NOT NULL,
  conversationId VARCHAR(36) NULL,
  fileId VARCHAR(36) NULL,
  chunkIndex INT NOT NULL,
  chunkText TEXT NOT NULL,
  embedding JSON NOT NULL,
  embeddingModel VARCHAR(64) NOT NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_tenant_embeddings_tenant (tenantId),
  KEY idx_tenant_embeddings_file (tenantId, fileId),
  KEY idx_tenant_embeddings_conv (tenantId, conversationId),
  KEY idx_tenant_embeddings_service (tenantId, serviceCode)
);
