-- Compatible with MySQL versions that don't support ADD COLUMN IF NOT EXISTS.
-- Adds each column only if missing.
SET @db := DATABASE();

SET @sql := (
  SELECT IF(COUNT(*) = 0,
    "ALTER TABLE chat_conversations ADD COLUMN handoffStatus VARCHAR(16) NOT NULL DEFAULT 'none'",
    'SELECT 1')
  FROM information_schema.columns
  WHERE table_schema = @db AND table_name = 'chat_conversations' AND column_name = 'handoffStatus'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE chat_conversations ADD COLUMN handoffReason TEXT NULL',
    'SELECT 1')
  FROM information_schema.columns
  WHERE table_schema = @db AND table_name = 'chat_conversations' AND column_name = 'handoffReason'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE chat_conversations ADD COLUMN handoffRequestedAt TIMESTAMP NULL',
    'SELECT 1')
  FROM information_schema.columns
  WHERE table_schema = @db AND table_name = 'chat_conversations' AND column_name = 'handoffRequestedAt'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE chat_conversations ADD COLUMN handoffAcceptedAt TIMESTAMP NULL',
    'SELECT 1')
  FROM information_schema.columns
  WHERE table_schema = @db AND table_name = 'chat_conversations' AND column_name = 'handoffAcceptedAt'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE chat_conversations ADD COLUMN handoffResolvedAt TIMESTAMP NULL',
    'SELECT 1')
  FROM information_schema.columns
  WHERE table_schema = @db AND table_name = 'chat_conversations' AND column_name = 'handoffResolvedAt'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE chat_conversations ADD COLUMN assignedAgentId VARCHAR(64) NULL',
    'SELECT 1')
  FROM information_schema.columns
  WHERE table_schema = @db AND table_name = 'chat_conversations' AND column_name = 'assignedAgentId'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE chat_conversations ADD COLUMN assignedAgentName VARCHAR(255) NULL',
    'SELECT 1')
  FROM information_schema.columns
  WHERE table_schema = @db AND table_name = 'chat_conversations' AND column_name = 'assignedAgentName'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
