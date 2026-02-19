UPDATE service_catalog
SET
  name = 'Motor de Reglas Simulado para Pre-Evaluacion',
  description = 'Simula una pre-evaluacion de elegibilidad (ej. hipotecas) con preguntas generales, probabilidad estimada y factores explicativos. No accede a scoring real ni a bases de datos.',
  endpointsEnabled = false,
  humanHandoffEnabled = false,
  fileStorageEnabled = false,
  documentProcessingEnabled = false,
  ocrEnabled = false,
  semanticSearchEnabled = false,
  emailAutomationEnabled = false,
  jiraEnabled = false,
  jiraProjectKey = NULL,
  jiraDefaultIssueType = NULL,
  jiraAllowUserPriorityOverride = true,
  jiraAutoLabelWithServiceName = true,
  enabled = true
WHERE code = 'pre-evaluacion';

INSERT INTO service_catalog (
  id,
  code,
  name,
  description,
  apiBaseUrl,
  endpointsEnabled,
  humanHandoffEnabled,
  fileStorageEnabled,
  documentProcessingEnabled,
  ocrEnabled,
  semanticSearchEnabled,
  emailAutomationEnabled,
  jiraEnabled,
  jiraProjectKey,
  jiraDefaultIssueType,
  jiraAllowUserPriorityOverride,
  jiraAutoLabelWithServiceName,
  priceMonthlyEur,
  priceAnnualEur,
  enabled,
  createdAt,
  updatedAt
)
SELECT
  UUID(),
  'pre-evaluacion',
  'Motor de Reglas Simulado para Pre-Evaluacion',
  'Simula una pre-evaluacion de elegibilidad (ej. hipotecas) con preguntas generales, probabilidad estimada y factores explicativos. No accede a scoring real ni a bases de datos.',
  NULL,
  false,
  false,
  false,
  false,
  false,
  false,
  false,
  false,
  NULL,
  NULL,
  true,
  true,
  0.00,
  0.00,
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM service_catalog WHERE code = 'pre-evaluacion'
);
