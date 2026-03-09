import type { ClaimStatus, CompletenessStatus } from "@/domain/models/claim";

interface Props {
  status: ClaimStatus | CompletenessStatus;
}

const labels: Record<string, string> = {
  nuevo: "Nuevo",
  en_revision: "En revision",
  pendiente_documentos: "Pendiente docs",
  peritaje: "Peritaje",
  resuelto: "Resuelto",
  cerrado: "Cerrado",
  incompleto: "Incompleto",
  parcial: "Parcial",
  completo: "Completo",
};

export function StatusPill({ status }: Props) {
  return <span className={`status-pill status-${status}`}>{labels[status] ?? status}</span>;
}
