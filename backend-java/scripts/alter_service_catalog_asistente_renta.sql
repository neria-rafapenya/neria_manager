UPDATE service_catalog
SET
  name = 'Asistente IA Declaracion de la Renta',
  description = 'Asistente guiado para preparar el borrador de la declaracion de la renta en Espana. Recoge datos basicos, ingresos y deducciones, calcula estimaciones orientativas y genera una checklist de documentacion, sin sustituir el asesoramiento fiscal profesional.',
  endpointsEnabled = true,
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
WHERE code = 'asistente-renta';

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
  'asistente-renta',
  'Asistente IA Declaracion de la Renta',
  'Asistente guiado para preparar el borrador de la declaracion de la renta en Espana. Recoge datos basicos, ingresos y deducciones, calcula estimaciones orientativas y genera una checklist de documentacion, sin sustituir el asesoramiento fiscal profesional.',
  NULL,
  true,
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
  SELECT 1 FROM service_catalog WHERE code = 'asistente-renta'
);
