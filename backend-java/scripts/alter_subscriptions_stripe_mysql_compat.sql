-- Compatible with MySQL versions that don't support ADD COLUMN IF NOT EXISTS.
-- Adds each column only if missing.
SET @db := DATABASE();

SET @sql := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE subscriptions ADD COLUMN stripeCustomerId VARCHAR(64) NULL',
    'SELECT 1')
  FROM information_schema.columns
  WHERE table_schema = @db AND table_name = 'subscriptions' AND column_name = 'stripeCustomerId'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE subscriptions ADD COLUMN stripeSubscriptionId VARCHAR(64) NULL',
    'SELECT 1')
  FROM information_schema.columns
  WHERE table_schema = @db AND table_name = 'subscriptions' AND column_name = 'stripeSubscriptionId'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
