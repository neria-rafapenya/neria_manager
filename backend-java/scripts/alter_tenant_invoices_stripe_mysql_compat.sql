-- Compatible with MySQL versions that don't support ADD COLUMN IF NOT EXISTS.
-- Adds each column only if missing.
SET @db := DATABASE();

SET @sql := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE tenant_invoices ADD COLUMN taxRate DECIMAL(5,4) NULL',
    'SELECT 1')
  FROM information_schema.columns
  WHERE table_schema = @db AND table_name = 'tenant_invoices' AND column_name = 'taxRate'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE tenant_invoices ADD COLUMN taxEur DECIMAL(10,2) NULL',
    'SELECT 1')
  FROM information_schema.columns
  WHERE table_schema = @db AND table_name = 'tenant_invoices' AND column_name = 'taxEur'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE tenant_invoices ADD COLUMN stripeInvoiceId VARCHAR(64) NULL',
    'SELECT 1')
  FROM information_schema.columns
  WHERE table_schema = @db AND table_name = 'tenant_invoices' AND column_name = 'stripeInvoiceId'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE tenant_invoices ADD COLUMN stripePaymentIntentId VARCHAR(64) NULL',
    'SELECT 1')
  FROM information_schema.columns
  WHERE table_schema = @db AND table_name = 'tenant_invoices' AND column_name = 'stripePaymentIntentId'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
