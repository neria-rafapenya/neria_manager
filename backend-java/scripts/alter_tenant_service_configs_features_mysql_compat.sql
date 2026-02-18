-- Compatible with MySQL versions that don't support ADD COLUMN IF NOT EXISTS.
-- Adds each column only if missing.
SET @db := DATABASE();

SET @sql := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE tenant_service_configs ADD COLUMN apiBaseUrl VARCHAR(255) NULL',
    'SELECT 1')
  FROM information_schema.columns
  WHERE table_schema = @db AND table_name = 'tenant_service_configs' AND column_name = 'apiBaseUrl'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE tenant_service_configs ADD COLUMN humanHandoffEnabled TINYINT(1) NULL',
    'SELECT 1')
  FROM information_schema.columns
  WHERE table_schema = @db AND table_name = 'tenant_service_configs' AND column_name = 'humanHandoffEnabled'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE tenant_service_configs ADD COLUMN fileStorageEnabled TINYINT(1) NULL',
    'SELECT 1')
  FROM information_schema.columns
  WHERE table_schema = @db AND table_name = 'tenant_service_configs' AND column_name = 'fileStorageEnabled'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE tenant_service_configs ADD COLUMN documentProcessingEnabled TINYINT(1) NULL',
    'SELECT 1')
  FROM information_schema.columns
  WHERE table_schema = @db AND table_name = 'tenant_service_configs' AND column_name = 'documentProcessingEnabled'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE tenant_service_configs ADD COLUMN ocrEnabled TINYINT(1) NULL',
    'SELECT 1')
  FROM information_schema.columns
  WHERE table_schema = @db AND table_name = 'tenant_service_configs' AND column_name = 'ocrEnabled'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE tenant_service_configs ADD COLUMN semanticSearchEnabled TINYINT(1) NULL',
    'SELECT 1')
  FROM information_schema.columns
  WHERE table_schema = @db AND table_name = 'tenant_service_configs' AND column_name = 'semanticSearchEnabled'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE tenant_service_configs ADD COLUMN documentDomain VARCHAR(120) NULL',
    'SELECT 1')
  FROM information_schema.columns
  WHERE table_schema = @db AND table_name = 'tenant_service_configs' AND column_name = 'documentDomain'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE tenant_service_configs ADD COLUMN documentOutputType VARCHAR(32) NULL',
    'SELECT 1')
  FROM information_schema.columns
  WHERE table_schema = @db AND table_name = 'tenant_service_configs' AND column_name = 'documentOutputType'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE tenant_service_configs ADD COLUMN jiraEnabled TINYINT(1) NULL',
    'SELECT 1')
  FROM information_schema.columns
  WHERE table_schema = @db AND table_name = 'tenant_service_configs' AND column_name = 'jiraEnabled'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE tenant_service_configs ADD COLUMN jiraProjectKey VARCHAR(32) NULL',
    'SELECT 1')
  FROM information_schema.columns
  WHERE table_schema = @db AND table_name = 'tenant_service_configs' AND column_name = 'jiraProjectKey'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE tenant_service_configs ADD COLUMN jiraDefaultIssueType VARCHAR(64) NULL',
    'SELECT 1')
  FROM information_schema.columns
  WHERE table_schema = @db AND table_name = 'tenant_service_configs' AND column_name = 'jiraDefaultIssueType'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE tenant_service_configs ADD COLUMN jiraAllowUserPriorityOverride TINYINT(1) NULL',
    'SELECT 1')
  FROM information_schema.columns
  WHERE table_schema = @db AND table_name = 'tenant_service_configs' AND column_name = 'jiraAllowUserPriorityOverride'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE tenant_service_configs ADD COLUMN jiraAutoLabelWithServiceName TINYINT(1) NULL',
    'SELECT 1')
  FROM information_schema.columns
  WHERE table_schema = @db AND table_name = 'tenant_service_configs' AND column_name = 'jiraAutoLabelWithServiceName'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
