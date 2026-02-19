CREATE TABLE IF NOT EXISTS tenant_service_survey_responses (
  id varchar(36) NOT NULL,
  surveyId varchar(36) NOT NULL,
  tenantId varchar(36) NOT NULL,
  serviceCode varchar(64) NOT NULL,
  status varchar(16) NOT NULL DEFAULT 'submitted',
  respondentEmail varchar(255) NULL,
  respondentName varchar(255) NULL,
  externalId varchar(64) NULL,
  metadata json NULL,
  submittedAt timestamp NULL,
  createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_survey_response (surveyId, submittedAt),
  KEY idx_survey_response_email (surveyId, respondentEmail)
) ENGINE=InnoDB;
