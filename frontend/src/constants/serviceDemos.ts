export const DEMO_BASE_URL = "https://demos-production-8f5c.up.railway.app";

const SERVICE_DEMO_PATHS: Record<string, string> = {
  "chat-sql": "demo/chat-sql",
  "chat-generic": "demo/chat-generic",
  "asistente-operativo": "demo/asistente-operativo",
  "simulador-financiero": "demo/simulador-financiero",
  "gestion-citas": "demo/gestion-citas",
  "pre-evaluacion": "demo/pre-evaluacion",
  "autoevalucion": "demo/autoevalucion",
  "sistema-encuestas": "demo/sistema-encuestas",
  "correos-tickets": "demo/correos-tickets",
  "chat-ocr": "demo/chat-ocr",
  "simulado-preevaluacion": "demo/simulado-preevaluacion",
};

export const getServiceDemoUrl = (serviceCode?: string | null) => {
  if (!serviceCode) return null;
  const normalized = serviceCode.trim();
  if (!normalized) return null;
  const path = SERVICE_DEMO_PATHS[normalized] ?? `demo/${normalized}`;
  return `${DEMO_BASE_URL}/${path}`;
};
