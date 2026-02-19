UPDATE service_catalog
SET
  name = 'Asistente de Soporte Operativo',
  description = 'Herramienta basada en IA para ayudar a empleados y equipos internos a resolver dudas operativas, explicar productos y generar borradores de respuesta. Funciona solo con documentacion interna anonimizada y conocimiento validado, sin acceder a datos personales ni a sistemas de scoring reales.',
  endpointsEnabled = true,
  humanHandoffEnabled = false,
  fileStorageEnabled = true,
  documentProcessingEnabled = true,
  ocrEnabled = false,
  semanticSearchEnabled = true,
  emailAutomationEnabled = false,
  jiraEnabled = false,
  jiraProjectKey = NULL,
  jiraDefaultIssueType = NULL,
  jiraAllowUserPriorityOverride = true,
  jiraAutoLabelWithServiceName = true,
  enabled = true
WHERE code = 'asistente-operativo';

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
  'asistente-operativo',
  'Asistente de Soporte Operativo',
  'Herramienta basada en IA para ayudar a empleados y equipos internos a resolver dudas operativas, explicar productos y generar borradores de respuesta. Funciona solo con documentacion interna anonimizada y conocimiento validado, sin acceder a datos personales ni a sistemas de scoring reales.',
  NULL,
  true,
  false,
  true,
  true,
  false,
  true,
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
  SELECT 1 FROM service_catalog WHERE code = 'asistente-operativo'
);
