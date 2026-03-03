export const kpis = [
  { label: "Conversaciones resueltas", value: "312", change: "+18%", tone: "positive" },
  { label: "Citas confirmadas", value: "148", change: "+9%", tone: "positive" },
  { label: "No-shows evitados", value: "22", change: "-5%", tone: "warning" },
  { label: "Carga recepción", value: "-6 h/sem", change: "impacto", tone: "neutral" },
] as const;

export const tasks = [
  {
    title: "Revisar protocolo de urgencias",
    owner: "Dra. Pons",
    due: "Hoy 17:00",
  },
  {
    title: "Confirmar huecos cirugía implantología",
    owner: "Recepción",
    due: "Mañana 09:30",
  },
  {
    title: "Ajustar pricing limpieza + blanqueamiento",
    owner: "Dirección",
    due: "Miércoles",
  },
];

export const conversations = [
  {
    patient: "María G.",
    reason: "Dolor agudo en muela",
    channel: "Web",
    status: "Escalada",
    summary: "Dolor 8/10, sin fiebre. Derivar a urgencias hoy.",
  },
  {
    patient: "Lucas V.",
    reason: "Consulta precio ortodoncia",
    channel: "WhatsApp",
    status: "Resuelto",
    summary: "Ofrecido rango + cita valoración.",
  },
  {
    patient: "Laura A.",
    reason: "Cambio de cita",
    channel: "Web",
    status: "Pendiente",
    summary: "Propone jueves tarde.",
  },
];

export const appointments = [
  {
    patient: "Pablo R.",
    type: "Implantología",
    time: "10:30",
    status: "Confirmada",
  },
  {
    patient: "Nora B.",
    type: "Higiene",
    time: "11:00",
    status: "En espera",
  },
  {
    patient: "Marta L.",
    type: "Urgencias",
    time: "12:15",
    status: "Pendiente",
  },
];

export const triageFlows = [
  {
    name: "Dolor dental intenso",
    steps: 8,
    outcome: "Urgente",
  },
  {
    name: "Post-operatorio implante",
    steps: 6,
    outcome: "Revisión",
  },
  {
    name: "Blanqueamiento",
    steps: 4,
    outcome: "Cita normal",
  },
];

export const protocols = [
  {
    name: "Endodoncia",
    updated: "Hace 2 días",
    owner: "Dra. Serra",
  },
  {
    name: "Implantes",
    updated: "Hace 1 semana",
    owner: "Dr. Requena",
  },
  {
    name: "Urgencias",
    updated: "Hoy",
    owner: "Dra. Pons",
  },
];

export const reportTemplates = [
  {
    name: "Limpieza + sellado",
    specialty: "Odontología",
    status: "Activo",
  },
  {
    name: "Implante unitario",
    specialty: "Implantología",
    status: "En revisión",
  },
  {
    name: "Valoración ATM",
    specialty: "Fisio",
    status: "Activo",
  },
];

export const analytics = [
  {
    title: "Automatización",
    value: "74%",
    detail: "+6% respecto al mes anterior",
  },
  {
    title: "Citas creadas",
    value: "213",
    detail: "42% desde chat web",
  },
  {
    title: "Tiempo ahorrado",
    value: "38 h",
    detail: "Equivalente a 1 recepcionista parcial",
  },
];
