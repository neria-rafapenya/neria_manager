import type { AuditEvent } from "../../types";
import type { TranslateFn } from "./types";

type AuditCardProps = {
  auditEvents: AuditEvent[];
  t: TranslateFn;
};

export function AuditCard({ auditEvents, t }: AuditCardProps) {
  return (
    <div className="card">
      <h2>{t("Auditoría")}</h2>
      <p className="muted tight">{t("Eventos de auditoría más recientes.")}</p>
      <div className="audit-list audit-list-scroll">
        {auditEvents.map((event) => (
          <div className="audit-item" key={event.id}>
            <div>
              <div className="audit-action">{event.action}</div>
              <div className="muted">
                {new Date(event.createdAt).toLocaleString()}
              </div>
            </div>
            <span className={`status ${event.status}`}>{event.status}</span>
          </div>
        ))}
      </div>
      {auditEvents.length === 0 && (
        <div className="muted">{t("Sin auditoría.")}</div>
      )}
    </div>
  );
}
