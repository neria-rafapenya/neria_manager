-- Compatible with MySQL versions that don't support ADD COLUMN IF NOT EXISTS.
-- Adds each column only if missing.
SET @db := DATABASE();

SET @sql := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE tenant_service_configs ADD COLUMN internalDocsEnabled TINYINT(1) NULL',
    'SELECT 1')
  FROM information_schema.columns
  WHERE table_schema = @db AND table_name = 'tenant_service_configs' AND column_name = 'internalDocsEnabled'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE tenant_service_configs ADD COLUMN internalPoliciesEnabled TINYINT(1) NULL',
    'SELECT 1')
  FROM information_schema.columns
  WHERE table_schema = @db AND table_name = 'tenant_service_configs' AND column_name = 'internalPoliciesEnabled'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE tenant_service_configs ADD COLUMN internalTemplatesEnabled TINYINT(1) NULL',
    'SELECT 1')
  FROM information_schema.columns
  WHERE table_schema = @db AND table_name = 'tenant_service_configs' AND column_name = 'internalTemplatesEnabled'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
