ALTER TABLE chat_conversations
  ADD COLUMN handoffStatus VARCHAR(16) NOT NULL DEFAULT 'none',
  ADD COLUMN handoffReason TEXT NULL,
  ADD COLUMN handoffRequestedAt TIMESTAMP NULL,
  ADD COLUMN handoffAcceptedAt TIMESTAMP NULL,
  ADD COLUMN handoffResolvedAt TIMESTAMP NULL,
  ADD COLUMN assignedAgentId VARCHAR(64) NULL,
  ADD COLUMN assignedAgentName VARCHAR(255) NULL;
