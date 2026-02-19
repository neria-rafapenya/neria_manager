CREATE TABLE IF NOT EXISTS tenant_service_survey_answers (
  id varchar(36) NOT NULL,
  surveyId varchar(36) NOT NULL,
  responseId varchar(36) NOT NULL,
  questionId varchar(36) NOT NULL,
  tenantId varchar(36) NOT NULL,
  serviceCode varchar(64) NOT NULL,
  valueText text NULL,
  valueNumber double NULL,
  valueJson json NULL,
  createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_survey_answer_response (responseId),
  KEY idx_survey_answer_question (questionId)
) ENGINE=InnoDB;
