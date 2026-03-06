CREATE TABLE IF NOT EXISTS clinic_settings (
  id VARCHAR(36) PRIMARY KEY,
  tenantId VARCHAR(36) NOT NULL,
  name VARCHAR(180) NULL,
  legalName VARCHAR(180) NULL,
  email VARCHAR(120) NULL,
  phone VARCHAR(80) NULL,
  address VARCHAR(255) NULL,
  timezone VARCHAR(80) NULL,
  website VARCHAR(180) NULL,
  emergencyDisclaimer TEXT NULL,
  privacyNotice TEXT NULL,
  openingHours JSON NULL,
  channels JSON NULL,
  createdAt DATETIME NULL,
  updatedAt DATETIME NULL,
  UNIQUE KEY uq_clinic_settings_tenant (tenantId)
);

CREATE TABLE IF NOT EXISTS clinic_services (
  id VARCHAR(36) PRIMARY KEY,
  tenantId VARCHAR(36) NOT NULL,
  code VARCHAR(80) NULL,
  name VARCHAR(180) NOT NULL,
  specialty VARCHAR(120) NULL,
  durationMin INT NULL,
  priceMin DECIMAL(10,2) NULL,
  priceMax DECIMAL(10,2) NULL,
  prepNotes TEXT NULL,
  isActive TINYINT(1) NOT NULL DEFAULT 1,
  createdAt DATETIME NULL,
  updatedAt DATETIME NULL,
  KEY idx_clinic_services_tenant (tenantId)
);

CREATE TABLE IF NOT EXISTS clinic_protocols (
  id VARCHAR(36) PRIMARY KEY,
  tenantId VARCHAR(36) NOT NULL,
  title VARCHAR(180) NOT NULL,
  version VARCHAR(32) NULL,
  status VARCHAR(32) NULL,
  summary VARCHAR(255) NULL,
  content TEXT NULL,
  approvedBy VARCHAR(120) NULL,
  approvedAt DATETIME NULL,
  createdAt DATETIME NULL,
  updatedAt DATETIME NULL,
  KEY idx_clinic_protocols_tenant (tenantId)
);

CREATE TABLE IF NOT EXISTS clinic_faq_entries (
  id VARCHAR(36) PRIMARY KEY,
  tenantId VARCHAR(36) NOT NULL,
  question VARCHAR(255) NOT NULL,
  answer TEXT NULL,
  category VARCHAR(120) NULL,
  priority INT NULL,
  isActive TINYINT(1) NOT NULL DEFAULT 1,
  createdAt DATETIME NULL,
  updatedAt DATETIME NULL,
  KEY idx_clinic_faq_tenant (tenantId)
);

CREATE TABLE IF NOT EXISTS clinic_triage_flows (
  id VARCHAR(36) PRIMARY KEY,
  tenantId VARCHAR(36) NOT NULL,
  name VARCHAR(180) NOT NULL,
  description TEXT NULL,
  status VARCHAR(32) NULL,
  outcome VARCHAR(120) NULL,
  steps JSON NULL,
  createdAt DATETIME NULL,
  updatedAt DATETIME NULL,
  KEY idx_clinic_triage_tenant (tenantId)
);

CREATE TABLE IF NOT EXISTS clinic_report_templates (
  id VARCHAR(36) PRIMARY KEY,
  tenantId VARCHAR(36) NOT NULL,
  name VARCHAR(180) NOT NULL,
  specialty VARCHAR(120) NULL,
  status VARCHAR(32) NULL,
  template JSON NULL,
  createdAt DATETIME NULL,
  updatedAt DATETIME NULL,
  KEY idx_clinic_reports_tenant (tenantId)
);

CREATE TABLE IF NOT EXISTS clinic_users (
  id VARCHAR(36) PRIMARY KEY,
  tenantId VARCHAR(36) NOT NULL,
  email VARCHAR(160) NOT NULL,
  name VARCHAR(120) NULL,
  avatarUrl VARCHAR(512) NULL,
  role VARCHAR(32) NOT NULL,
  status VARCHAR(16) NOT NULL,
  passwordHash VARCHAR(255) NULL,
  mustChangePassword TINYINT(1) NOT NULL DEFAULT 0,
  createdAt DATETIME NULL,
  updatedAt DATETIME NULL,
  UNIQUE KEY uq_clinic_users_tenant_email (tenantId, email),
  KEY idx_clinic_users_tenant (tenantId)
);

CREATE TABLE IF NOT EXISTS clinic_patient_interactions (
  id VARCHAR(36) PRIMARY KEY,
  tenantId VARCHAR(36) NOT NULL,
  patientUserId VARCHAR(36) NOT NULL,
  title VARCHAR(180) NULL,
  type VARCHAR(60) NULL,
  status VARCHAR(60) NULL,
  summary VARCHAR(255) NULL,
  metadata JSON NULL,
  createdAt DATETIME NULL,
  updatedAt DATETIME NULL,
  KEY idx_clinic_patient_tenant (tenantId),
  KEY idx_clinic_patient_user (patientUserId)
);

CREATE TABLE IF NOT EXISTS clinic_patient_preferences (
  id VARCHAR(36) PRIMARY KEY,
  tenantId VARCHAR(36) NOT NULL,
  patientUserId VARCHAR(36) NOT NULL,
  preferredTimeOfDay VARCHAR(32) NULL,
  preferredPractitionerName VARCHAR(120) NULL,
  preferredTreatment VARCHAR(160) NULL,
  preferredDays JSON NULL,
  unavailableDays JSON NULL,
  notes TEXT NULL,
  createdAt DATETIME NULL,
  updatedAt DATETIME NULL,
  UNIQUE KEY uq_clinic_patient_prefs (tenantId, patientUserId),
  KEY idx_clinic_patient_prefs_tenant (tenantId),
  KEY idx_clinic_patient_prefs_user (patientUserId)
);

CREATE TABLE IF NOT EXISTS clinic_patient_appointments (
  id VARCHAR(36) PRIMARY KEY,
  tenantId VARCHAR(36) NOT NULL,
  patientUserId VARCHAR(36) NOT NULL,
  title VARCHAR(180) NULL,
  practitionerName VARCHAR(120) NULL,
  location VARCHAR(120) NULL,
  scheduledAt DATETIME NULL,
  durationMin INT NULL,
  status VARCHAR(32) NULL,
  notes TEXT NULL,
  createdAt DATETIME NULL,
  updatedAt DATETIME NULL,
  KEY idx_clinic_patient_appt_tenant (tenantId),
  KEY idx_clinic_patient_appt_user (patientUserId)
);


CREATE TABLE IF NOT EXISTS clinic_patient_documents (
  id VARCHAR(36) PRIMARY KEY,
  tenantId VARCHAR(36) NOT NULL,
  patientUserId VARCHAR(36) NOT NULL,
  title VARCHAR(180) NULL,
  category VARCHAR(120) NULL,
  url VARCHAR(512) NULL,
  status VARCHAR(32) NULL,
  createdAt DATETIME NULL,
  updatedAt DATETIME NULL,
  KEY idx_clinic_patient_doc_tenant (tenantId),
  KEY idx_clinic_patient_doc_user (patientUserId)
);


CREATE TABLE IF NOT EXISTS clinic_patient_treatments (
  id VARCHAR(36) PRIMARY KEY,
  tenantId VARCHAR(36) NOT NULL,
  patientUserId VARCHAR(36) NOT NULL,
  name VARCHAR(180) NULL,
  status VARCHAR(32) NULL,
  nextStep VARCHAR(180) NULL,
  notes TEXT NULL,
  reportTitle VARCHAR(180) NULL,
  reportText TEXT NULL,
  reportFileUrl VARCHAR(512) NULL,
  reportFileName VARCHAR(255) NULL,
  reportFileMime VARCHAR(120) NULL,
  startedAt DATETIME NULL,
  completedAt DATETIME NULL,
  createdAt DATETIME NULL,
  updatedAt DATETIME NULL,
  KEY idx_clinic_patient_treatment_tenant (tenantId),
  KEY idx_clinic_patient_treatment_user (patientUserId)
);

CREATE TABLE IF NOT EXISTS clinic_patient_treatment_reports (
  id VARCHAR(36) PRIMARY KEY,
  tenantId VARCHAR(36) NOT NULL,
  treatmentId VARCHAR(36) NOT NULL,
  title VARCHAR(180) NULL,
  text TEXT NULL,
  fileUrl VARCHAR(512) NULL,
  fileName VARCHAR(255) NULL,
  fileMime VARCHAR(120) NULL,
  createdByUserId VARCHAR(36) NULL,
  createdByName VARCHAR(160) NULL,
  createdAt DATETIME NULL,
  KEY idx_clinic_treatment_reports_tenant (tenantId),
  KEY idx_clinic_treatment_reports_treatment (treatmentId)
);


CREATE TABLE IF NOT EXISTS clinic_availability (
  id VARCHAR(36) PRIMARY KEY,
  tenantId VARCHAR(36) NOT NULL,
  startAt DATETIME NOT NULL,
  endAt DATETIME NOT NULL,
  serviceCode VARCHAR(80) NULL,
  practitionerName VARCHAR(120) NULL,
  status VARCHAR(32) NULL,
  reservedByPatientUserId VARCHAR(36) NULL,
  reservedByPatientEmail VARCHAR(160) NULL,
  reservedByPatientName VARCHAR(160) NULL,
  reservedAppointmentId VARCHAR(36) NULL,
  createdAt DATETIME NULL,
  updatedAt DATETIME NULL,
  KEY idx_clinic_availability_tenant (tenantId),
  KEY idx_clinic_availability_time (startAt, endAt)
);

CREATE TABLE IF NOT EXISTS clinic_time_off (
  id VARCHAR(36) PRIMARY KEY,
  tenantId VARCHAR(36) NOT NULL,
  startDate DATE NOT NULL,
  endDate DATE NOT NULL,
  startAt DATETIME NULL,
  endAt DATETIME NULL,
  reason VARCHAR(255) NULL,
  createdAt DATETIME NULL,
  updatedAt DATETIME NULL,
  KEY idx_clinic_time_off_tenant (tenantId),
  KEY idx_clinic_time_off_range (startDate, endDate)
);

CREATE TABLE IF NOT EXISTS clinic_holidays (
  id VARCHAR(36) PRIMARY KEY,
  tenantId VARCHAR(36) NOT NULL,
  date DATE NOT NULL,
  name VARCHAR(180) NULL,
  createdAt DATETIME NULL,
  updatedAt DATETIME NULL,
  KEY idx_clinic_holidays_tenant (tenantId),
  KEY idx_clinic_holidays_date (date)
);

CREATE TABLE IF NOT EXISTS clinic_prompts (
  id VARCHAR(36) PRIMARY KEY,
  tenantId VARCHAR(36) NOT NULL,
  `key` VARCHAR(80) NOT NULL,
  content TEXT NOT NULL,
  createdAt DATETIME NULL,
  updatedAt DATETIME NULL,
  KEY idx_clinic_prompts_tenant (tenantId),
  KEY idx_clinic_prompts_key (`key`)
);

CREATE TABLE IF NOT EXISTS clinic_faq_logs (
  id VARCHAR(36) PRIMARY KEY,
  tenantId VARCHAR(36) NOT NULL,
  patientUserId VARCHAR(36) NOT NULL,
  createdAt DATETIME NULL,
  KEY idx_clinic_faq_logs_tenant (tenantId),
  KEY idx_clinic_faq_logs_patient (patientUserId)
);

CREATE TABLE IF NOT EXISTS clinic_faq_handoffs (
  id VARCHAR(36) PRIMARY KEY,
  tenantId VARCHAR(36) NOT NULL,
  patientUserId VARCHAR(36) NOT NULL,
  patientEmail VARCHAR(180) NULL,
  patientName VARCHAR(180) NULL,
  status VARCHAR(40) NULL,
  messages JSON NULL,
  responseText TEXT NULL,
  respondedByUserId VARCHAR(36) NULL,
  respondedByName VARCHAR(180) NULL,
  requestedAt DATETIME NULL,
  respondedAt DATETIME NULL,
  createdAt DATETIME NULL,
  updatedAt DATETIME NULL,
  KEY idx_clinic_faq_handoffs_tenant (tenantId),
  KEY idx_clinic_faq_handoffs_patient (patientUserId)
);
