import { useEffect, useMemo, useState } from "react";
import { patientApi } from "../../../infrastructure/api/clinicflowApi";

export const PatientHomePage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<any | null>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [treatments, setTreatments] = useState<any[]>([]);
  const [interactions, setInteractions] = useState<any[]>([]);
  const [question, setQuestion] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await patientApi.summary();
        if (!active) return;
        setSummary(data);
        setAppointments(data?.appointments || []);
        setDocuments(data?.documents || []);
        setTreatments(data?.treatments || []);
        setInteractions(data?.interactions || []);
      } catch (err: any) {
        if (active) {
          setError(err.message || "No se pudo cargar la información.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const nextAppointment = useMemo(() => {
    if (!appointments.length) return null;
    return (
      appointments.find((appt) => appt.status !== "cancelled") ||
      appointments[0]
    );
  }, [appointments]);

  const handleAsk = async () => {
    if (!question.trim()) return;
    try {
      await patientApi.createInteraction({
        title: "Consulta paciente",
        type: "question",
        status: "open",
        summary: question.trim(),
      });
      setQuestion("");
      const updated = await patientApi.listInteractions();
      setInteractions(updated || []);
    } catch (err: any) {
      setError(err.message || "No se pudo enviar la consulta.");
    }
  };

  const handleRequestChange = async (appointmentId: string) => {
    const message = window.prompt(
      "Indica el motivo o preferencia para el cambio",
    );
    if (!message) return;
    await patientApi.requestAppointmentChange(appointmentId, message);
    const updated = await patientApi.listInteractions();
    setInteractions(updated || []);
  };

  const handleRequestCancel = async (appointmentId: string) => {
    const message = window.prompt("Indica el motivo de la cancelación");
    if (!message) return;
    await patientApi.requestAppointmentCancel(appointmentId, message);
    const updated = await patientApi.listInteractions();
    setInteractions(updated || []);
  };

  return (
    <div className="page">
      <div className="card">
        <h3>Mi clínica</h3>
        <p className="muted">
          Resumen de tus próximas citas, documentos y tratamientos.
        </p>
        {loading ? <p>Cargando...</p> : null}
        {error ? <p className="muted">{error}</p> : null}
        {!loading && summary ? (
          <div className="grid two-columns">
            <div className="card">
              <p className="eyebrow">Próxima cita</p>
              <h4>{nextAppointment?.title || "Sin citas próximas"}</h4>
              <p className="muted">
                {nextAppointment?.scheduledAt
                  ? new Date(nextAppointment.scheduledAt).toLocaleString()
                  : "—"}
              </p>
            </div>
            <div className="card">
              <p className="eyebrow">Documentos pendientes</p>
              <h4>{documents.length}</h4>
              <p className="muted">
                Acceso rápido a consentimientos y preparación.
              </p>
            </div>
          </div>
        ) : null}
      </div>

      <section className="grid two-columns">
        <div className="card">
          <h3>Mis citas</h3>
          {appointments.length === 0 ? (
            <p className="muted">No hay citas registradas.</p>
          ) : (
            <div className="table">
              <div className="table-header">
                <span>Cita</span>
                <span>Fecha</span>
                <span>Estado</span>
                <span>Acciones</span>
              </div>
              {appointments.map((appt) => (
                <div key={appt.id} className="table-row">
                  <span>{appt.title || "—"}</span>
                  <span>
                    {appt.scheduledAt
                      ? new Date(appt.scheduledAt).toLocaleString()
                      : "—"}
                  </span>
                  <span>{appt.status || "—"}</span>
                  <span className="table-actions">
                    <button
                      className="btn"
                      onClick={() => handleRequestChange(appt.id)}
                    >
                      Solicitar cambio
                    </button>
                    <button
                      className="btn"
                      onClick={() => handleRequestCancel(appt.id)}
                    >
                      Cancelar
                    </button>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h3>Documentos y preparación</h3>
          {documents.length === 0 ? (
            <p className="muted">No hay documentos disponibles.</p>
          ) : (
            <div className="list">
              {documents.map((doc) => (
                <div key={doc.id} className="list-row">
                  <div>
                    <p className="list-title">{doc.title}</p>
                    <p className="muted">{doc.category || "Documento"}</p>
                  </div>
                  <div className="list-meta">
                    {doc.url ? (
                      <a
                        className="link"
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Ver
                      </a>
                    ) : (
                      <span className="muted">Pendiente</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="grid two-columns">
        <div className="card">
          <h3>Chat de dudas</h3>
          <p className="muted">
            Resolvemos dudas generales y te contactaremos si hace falta.
          </p>
          <div className="list">
            {interactions.slice(0, 4).map((item) => (
              <div key={item.id} className="list-row">
                <div>
                  <p className="list-title">{item.title || "Consulta"}</p>
                  <p className="muted">{item.summary}</p>
                </div>
                <div className="list-meta">
                  <span>{item.status || ""}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="form-field" style={{ marginTop: "12px" }}>
            <label>Tu consulta</label>
            <textarea
              rows={3}
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
            />
          </div>
          <button
            className="btn primary"
            onClick={handleAsk}
            disabled={!question.trim()}
          >
            Enviar consulta
          </button>
          <p className="muted" style={{ marginTop: "8px" }}>
            Esta información es orientativa y no sustituye la consulta médica.
          </p>
        </div>

        <div className="card">
          <h3>Tratamientos</h3>
          {treatments.length === 0 ? (
            <p className="muted">No hay tratamientos activos.</p>
          ) : (
            <div className="table">
              <div className="table-header">
                <span>Tratamiento</span>
                <span>Estado</span>
                <span>Siguiente paso</span>
              </div>
              {treatments.map((t) => (
                <div key={t.id} className="table-row">
                  <span>{t.name || "—"}</span>
                  <span>{t.status || "—"}</span>
                  <span>{t.nextStep || "—"}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
