ALTER TABLE tenant_service_configs
  ADD COLUMN jiraEnabled TINYINT(1) NULL,
  ADD COLUMN jiraProjectKey VARCHAR(32) NULL,
  ADD COLUMN jiraDefaultIssueType VARCHAR(64) NULL,
  ADD COLUMN jiraAllowUserPriorityOverride TINYINT(1) NULL,
  ADD COLUMN jiraAutoLabelWithServiceName TINYINT(1) NULL;
