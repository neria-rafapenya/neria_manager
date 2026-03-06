import { useEffect, useState } from "react";
import { SectionHeader } from "../components/SectionHeader";
import { Tag } from "../components/Tag";
import { staffApi } from "../../../infrastructure/api/clinicflowApi";

export const ConversationsPage = () => {
  const [handoffs, setHandoffs] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [responseText, setResponseText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [handoffList, logList] = await Promise.all([
        staffApi.listFaqHandoffs(),
        staffApi.listFaqLogs(),
      ]);
      setHandoffs(Array.isArray(handoffList) ? handoffList : []);
      setLogs(Array.isArray(logList) ? logList : []);
    } catch (err: any) {
      setError(err?.message || "No se pudieron cargar las solicitudes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelect = (handoff: any) => {
    setSelected(handoff);
    setResponseText(handoff?.responseText || "");
  };

  const handleRespond = async () => {
    if (!selected?.id || !responseText.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await staffApi.respondFaqHandoff(selected.id, responseText.trim());
      await loadData();
      setSelected(null);
      setResponseText("");
    } catch (err: any) {
      setError(err?.message || "No se pudo enviar la respuesta.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (value?: string | null) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="page">
      <SectionHeader
        title="Bandeja omnicanal"
        subtitle="Solicitudes humanas y logs de FAQ"
        action="Actualizar bandeja"
      />

      {error ? <div className="card error-banner">{error}</div> : null}

      <section className="grid two-columns">
        <div className="card list-card">
          <h3>Solicitudes a humano</h3>
          <div className="list">
            {handoffs.length === 0 ? (
              <div className="list-row">
                <div>
                  <p className="list-title">Sin solicitudes pendientes</p>
                  <p className="muted">Cuando un paciente pida ayuda, aparecerá aquí.</p>
                </div>
              </div>
            ) : (
              handoffs.map((handoff) => (
                <div
                  key={handoff.id}
                  className="list-row"
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSelect(handoff)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") handleSelect(handoff);
                  }}
                >
                  <div>
                    <p className="list-title">
                      {handoff.patientName || handoff.patientEmail || "Paciente"}
                    </p>
                    <p className="muted">{formatDate(handoff.requestedAt)}</p>
                  </div>
                  <div className="list-meta">
                    <Tag tone={handoff.status === "answered" ? "success" : "warning"}>
                      {handoff.status === "answered" ? "Respondido" : "Pendiente"}
                    </Tag>
                    <span className="muted">FAQ</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="conversation-preview">
          <div className="card">
            <h3>Responder solicitud</h3>
            {!selected ? (
              <p className="muted">
                Selecciona una solicitud para ver el detalle y responder.
              </p>
            ) : (
              <>
                <div className="summary-box">
                  <p className="eyebrow">Historial adjunto</p>
                  {Array.isArray(selected.messages) && selected.messages.length ? (
                    selected.messages.map((msg: any, idx: number) => (
                      <p key={`${selected.id}-msg-${idx}`}>
                        <strong>{msg.role}:</strong> {msg.content}
                      </p>
                    ))
                  ) : (
                    <p className="muted">Sin mensajes adjuntos.</p>
                  )}
                </div>
                <label className="form-field">
                  Respuesta
                  <textarea
                    rows={4}
                    value={responseText}
                    onChange={(event) => setResponseText(event.target.value)}
                  />
                </label>
                <div className="summary-actions">
                  <button
                    className="btn btn-primary btn-normal"
                    onClick={handleRespond}
                    disabled={loading || !responseText.trim()}
                  >
                    Enviar respuesta
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="card" style={{ marginTop: "16px" }}>
            <h3>Logs de FAQ (sin contenido)</h3>
            <div className="list">
              {logs.length === 0 ? (
                <div className="list-row">
                  <div>
                    <p className="list-title">Sin logs recientes</p>
                    <p className="muted">Aquí verás actividad de FAQ.</p>
                  </div>
                </div>
              ) : (
                logs.slice(0, 8).map((log) => (
                  <div key={log.id} className="list-row">
                    <div>
                      <p className="list-title">
                        {log.patient?.name || log.patient?.email || "Paciente"}
                      </p>
                      <p className="muted">{formatDate(log.createdAt)}</p>
                    </div>
                    <div className="list-meta">
                      <span>FAQ</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
