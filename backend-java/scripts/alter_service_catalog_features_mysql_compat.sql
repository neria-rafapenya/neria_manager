-- Compatible with MySQL versions that don't support ADD COLUMN IF NOT EXISTS.
-- Adds each column only if missing.
SET @db := DATABASE();

SET @sql := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE service_catalog ADD COLUMN apiBaseUrl VARCHAR(255) NULL',
    'SELECT 1')
  FROM information_schema.columns
  WHERE table_schema = @db AND table_name = 'service_catalog' AND column_name = 'apiBaseUrl'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE service_catalog ADD COLUMN endpointsEnabled TINYINT(1) NOT NULL DEFAULT 1',
    'SELECT 1')
  FROM information_schema.columns
  WHERE table_schema = @db AND table_name = 'service_catalog' AND column_name = 'endpointsEnabled'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE service_catalog ADD COLUMN humanHandoffEnabled TINYINT(1) NOT NULL DEFAULT 1',
    'SELECT 1')
  FROM information_schema.columns
  WHERE table_schema = @db AND table_name = 'service_catalog' AND column_name = 'humanHandoffEnabled'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE service_catalog ADD COLUMN fileStorageEnabled TINYINT(1) NOT NULL DEFAULT 1',
    'SELECT 1')
  FROM information_schema.columns
  WHERE table_schema = @db AND table_name = 'service_catalog' AND column_name = 'fileStorageEnabled'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE service_catalog ADD COLUMN documentProcessingEnabled TINYINT(1) NOT NULL DEFAULT 0',
    'SELECT 1')
  FROM information_schema.columns
  WHERE table_schema = @db AND table_name = 'service_catalog' AND column_name = 'documentProcessingEnabled'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE service_catalog ADD COLUMN ocrEnabled TINYINT(1) NOT NULL DEFAULT 0',
    'SELECT 1')
  FROM information_schema.columns
  WHERE table_schema = @db AND table_name = 'service_catalog' AND column_name = 'ocrEnabled'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE service_catalog ADD COLUMN semanticSearchEnabled TINYINT(1) NOT NULL DEFAULT 0',
    'SELECT 1')
  FROM information_schema.columns
  WHERE table_schema = @db AND table_name = 'service_catalog' AND column_name = 'semanticSearchEnabled'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE service_catalog ADD COLUMN emailAutomationEnabled TINYINT(1) NOT NULL DEFAULT 0',
    'SELECT 1')
  FROM information_schema.columns
  WHERE table_schema = @db AND table_name = 'service_catalog' AND column_name = 'emailAutomationEnabled'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE service_catalog ADD COLUMN jiraEnabled TINYINT(1) NOT NULL DEFAULT 0',
    'SELECT 1')
  FROM information_schema.columns
  WHERE table_schema = @db AND table_name = 'service_catalog' AND column_name = 'jiraEnabled'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE service_catalog ADD COLUMN jiraProjectKey VARCHAR(32) NULL',
    'SELECT 1')
  FROM information_schema.columns
  WHERE table_schema = @db AND table_name = 'service_catalog' AND column_name = 'jiraProjectKey'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE service_catalog ADD COLUMN jiraDefaultIssueType VARCHAR(64) NULL',
    'SELECT 1')
  FROM information_schema.columns
  WHERE table_schema = @db AND table_name = 'service_catalog' AND column_name = 'jiraDefaultIssueType'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE service_catalog ADD COLUMN jiraAllowUserPriorityOverride TINYINT(1) NOT NULL DEFAULT 1',
    'SELECT 1')
  FROM information_schema.columns
  WHERE table_schema = @db AND table_name = 'service_catalog' AND column_name = 'jiraAllowUserPriorityOverride'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE service_catalog ADD COLUMN jiraAutoLabelWithServiceName TINYINT(1) NOT NULL DEFAULT 1',
    'SELECT 1')
  FROM information_schema.columns
  WHERE table_schema = @db AND table_name = 'service_catalog' AND column_name = 'jiraAutoLabelWithServiceName'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
