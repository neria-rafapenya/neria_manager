ALTER TABLE tenant_service_configs
  ADD COLUMN documentProcessingEnabled TINYINT(1) NULL,
  ADD COLUMN ocrEnabled TINYINT(1) NULL,
  ADD COLUMN semanticSearchEnabled TINYINT(1) NULL,
  ADD COLUMN documentDomain VARCHAR(120) NULL,
  ADD COLUMN documentOutputType VARCHAR(32) NULL;
