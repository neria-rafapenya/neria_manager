export type ClinicRole = "manager" | "staff" | "assistant" | "patient" | "unknown";

export const normalizeClinicRole = (value?: string | null): ClinicRole => {
  if (!value) return "unknown";
  const role = value.trim().toLowerCase();
  if (role === "gestor" || role === "manager") return "manager";
  if (role === "personal" || role === "staff") return "staff";
  if (role === "asistente" || role === "assistant") return "assistant";
  if (role === "patient" || role === "paciente") return "patient";
  return "unknown";
};

export const getRolePermissions = (role: ClinicRole) => {
  const isPatient = role === "patient";
  const isManager = role === "manager";
  const isStaff = role === "staff";
  const isAssistant = role === "assistant";

  return {
    role,
    isPatient,
    isManager,
    isStaff,
    isAssistant,
    canViewDashboard: !isPatient,
    canViewConversations: !isPatient,
    canViewAgenda: !isPatient,
    canViewPatients: isManager || isStaff || isAssistant,
    canViewProtocols: isManager || isStaff,
    canViewTriage: isManager || isStaff,
    canViewReports: isManager || isStaff,
    canViewMetrics: isManager,
    canViewAdmin: isManager,
    canManageAppointments: isManager || isStaff,
    canManageDocuments: isManager || isStaff,
    canManageTreatments: isManager,
    canManageInteractions: isManager || isStaff || isAssistant,
  };
};
