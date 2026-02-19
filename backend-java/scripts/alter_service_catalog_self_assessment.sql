UPDATE service_catalog
SET fileStorageEnabled = true,
    documentProcessingEnabled = true,
    ocrEnabled = true,
    semanticSearchEnabled = true
WHERE code = 'autoevalucion';

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
  'autoevalucion',
  'Sistema de Autoevaluacion Inteligente',
  'Plataforma basada en IA que permite evaluar criterios, normativas o estandares mediante cuestionarios dinamicos, deteccion de brechas y recomendaciones accionables.',
  NULL,
  true,
  false,
  true,
  true,
  true,
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
  SELECT 1 FROM service_catalog WHERE code = 'autoevalucion'
);
