ALTER TABLE tenant_service_configs
  ADD COLUMN internalDocsEnabled TINYINT(1) NULL,
  ADD COLUMN internalPoliciesEnabled TINYINT(1) NULL,
  ADD COLUMN internalTemplatesEnabled TINYINT(1) NULL;
