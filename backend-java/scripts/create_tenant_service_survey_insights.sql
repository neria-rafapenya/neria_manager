CREATE TABLE IF NOT EXISTS tenant_service_survey_insights (
  id varchar(36) NOT NULL,
  surveyId varchar(36) NOT NULL,
  tenantId varchar(36) NOT NULL,
  serviceCode varchar(64) NOT NULL,
  model varchar(64) NULL,
  status varchar(16) NOT NULL DEFAULT 'completed',
  payload text NULL,
  errorMessage text NULL,
  createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_survey_insights (surveyId, createdAt)
) ENGINE=InnoDB;
