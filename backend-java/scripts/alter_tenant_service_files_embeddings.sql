ALTER TABLE tenant_service_files
  ADD COLUMN embeddingStatus VARCHAR(32) NOT NULL DEFAULT 'pending',
  ADD COLUMN embeddingModel VARCHAR(64) NULL,
  ADD COLUMN embeddingCount INT NULL;
