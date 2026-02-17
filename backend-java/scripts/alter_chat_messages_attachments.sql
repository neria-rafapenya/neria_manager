ALTER TABLE chat_messages
  ADD COLUMN attachments TEXT NULL,
  ADD COLUMN operatorId VARCHAR(64) NULL,
  ADD COLUMN operatorName VARCHAR(255) NULL;
