# ClinicFlow AI - Variables de entorno sugeridas
## Frontend (clinicflow-ai)
- `VITE_API_BASE_URL` (ej: "http://localhost:3000")
- `VITE_API_KEY` (API key del servicio)
- `VITE_TENANT_ID` (tenant UUID)
- `VITE_SERVICE_CODE` (ej: "clinicflow")
- `VITE_CLINICFLOW_API_BASE_URL` (ej: "http://localhost:4000")
- `VITE_CLINICFLOW_ENDPOINTS` (JSON con paths `/clinicflow/...`)


Estas variables son opcionales y sirven como base para futuras fases (integraciones, mensajería, plantillas, seguridad, etc.).

## Núcleo
- `CLINICFLOW_BRAND_NAME` (ej: "ClinicFlow AI")
- `CLINICFLOW_DEFAULT_TIMEZONE` (ej: "Europe/Madrid")
- `CLINICFLOW_DEFAULT_LOCALE` (ej: "es")
- `CLINICFLOW_SUPPORT_EMAIL` (ej: "soporte@tudominio.com")

## Agenda
- `CLINICFLOW_APPOINTMENT_MIN_NOTICE_MIN` (ej: "120")
- `CLINICFLOW_APPOINTMENT_DEFAULT_DURATION_MIN` (ej: "30")
- `CLINICFLOW_WAITLIST_ENABLED` (ej: "true")

## Triaje
- `CLINICFLOW_TRIAGE_DISCLAIMER_ES`
- `CLINICFLOW_TRIAGE_ESCALATE_URGENT` (ej: "true")

## Informes
- `CLINICFLOW_REPORTS_DEFAULT_LANGUAGE` (ej: "es")
- `CLINICFLOW_REPORTS_EXPORT_FORMAT` (ej: "pdf")

## Canales
- `CLINICFLOW_CHANNEL_WEB_ENABLED` (ej: "true")
- `CLINICFLOW_CHANNEL_WHATSAPP_ENABLED` (ej: "false")
- `CLINICFLOW_CHANNEL_EMAIL_ENABLED` (ej: "true")
- `CLINICFLOW_CHANNEL_VOICE_ENABLED` (ej: "false")

## LLM / IA (futuro)
- `CLINICFLOW_LLM_PROVIDER` (ej: "openai")
- `CLINICFLOW_LLM_MODEL` (ej: "gpt-4.1-mini")
- `CLINICFLOW_LLM_TEMPERATURE` (ej: "0.3")
- `CLINICFLOW_LLM_MAX_TOKENS` (ej: "1200")

## Almacenamiento (futuro)
- `CLINICFLOW_MEDIA_BUCKET`
- `CLINICFLOW_MEDIA_REGION`
- `CLINICFLOW_MEDIA_PUBLIC_READ` (ej: "false")

## Observabilidad
- `CLINICFLOW_LOG_LEVEL` (ej: "INFO")
- `CLINICFLOW_AUDIT_ENABLED` (ej: "true")
