ALTER TABLE tenant_service_configs
  ADD COLUMN humanHandoffEnabled TINYINT(1) NULL,
  ADD COLUMN fileStorageEnabled TINYINT(1) NULL;
