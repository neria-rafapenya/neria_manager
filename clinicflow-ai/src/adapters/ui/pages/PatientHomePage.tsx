import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { patientApi } from "../../../infrastructure/api/clinicflowApi";
import { Modal } from "../components/shared/Modal";
import { ChatBotFAQs } from "../components/ChatBotFAQs";
import {
  IconCalendar,
  IconLink,
  IconViewDocument,
} from "../components/shared/icons";

export const PatientHomePage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<any | null>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [treatments, setTreatments] = useState<any[]>([]);
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewTreatment, setPreviewTreatment] = useState<any | null>(null);
  const [isTreatmentPreviewOpen, setIsTreatmentPreviewOpen] = useState(false);
  const [treatmentReports, setTreatmentReports] = useState<any[]>([]);

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

  const refreshSummary = async () => {
    const data = await patientApi.summary();
    setSummary(data);
    setAppointments(data?.appointments || []);
    setDocuments(data?.documents || []);
    setTreatments(data?.treatments || []);
  };

  const nextAppointment = useMemo(() => {
    if (!appointments.length) return null;
    return (
      appointments.find((appt) => appt.status !== "cancelled") ||
      appointments[0]
    );
  }, [appointments]);

  const documentsByCategory = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    documents.forEach((doc) => {
      const key = doc.category || "otros";
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(doc);
    });
    return grouped;
  }, [documents]);

  const slugify = (value: string) =>
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

  const getExtension = (url?: string) => {
    if (!url) return "";
    const clean = url.split("?")[0];
    const match = clean.match(/\.([a-z0-9]+)$/i);
    return match ? match[1].toLowerCase() : "";
  };

  const buildDownloadName = (doc: any) => {
    const base = slugify(doc.title || "documento") || "documento";
    const ext = getExtension(doc.url);
    return ext ? `${base}.${ext}` : base;
  };

  const buildTreatmentDownloadName = (treatment: any) => {
    const base = slugify(
      treatment.reportTitle ||
        treatment.reportFileName ||
        treatment.name ||
        "informe",
    );
    const ext = getExtension(treatment.reportFileUrl);
    return ext ? `${base}.${ext}` : base;
  };

  const handlePreview = (doc: any) => {
    setPreviewDoc(doc);
    setIsPreviewOpen(true);
  };

  const handleTreatmentPreview = (treatment: any) => {
    setPreviewTreatment(treatment);
    setIsTreatmentPreviewOpen(true);
    setTreatmentReports([]);
    patientApi
      .listTreatmentReports(treatment.id)
      .then((reports) => {
        setTreatmentReports(Array.isArray(reports) ? reports : []);
      })
      .catch(() => setTreatmentReports([]));
  };

  const renderPreviewContent = () => {
    if (!previewDoc?.url) {
      return <p className="muted">No hay archivo disponible.</p>;
    }
    const ext = getExtension(previewDoc.url);
    if (ext === "pdf") {
      return (
        <iframe
          title={previewDoc.title || "Documento"}
          src={previewDoc.url}
          style={{ width: "100%", height: "70vh", border: "none" }}
        />
      );
    }
    if (["png", "jpg", "jpeg"].includes(ext)) {
      return (
        <img
          src={previewDoc.url}
          alt={previewDoc.title || "Documento"}
          style={{ width: "100%", maxHeight: "70vh", objectFit: "contain" }}
        />
      );
    }
    return (
      <p className="muted">
        Vista previa no disponible para este tipo de archivo.
      </p>
    );
  };

  const renderTreatmentFilePreview = (
    url?: string | null,
    title?: string | null,
  ) => {
    if (!url) {
      return <p className="muted">No hay archivo adjunto.</p>;
    }
    const ext = getExtension(url);
    if (ext === "pdf") {
      return (
        <iframe
          title={title || "Informe"}
          src={url}
          style={{ width: "100%", height: "50vh", border: "none" }}
        />
      );
    }
    if (["png", "jpg", "jpeg"].includes(ext)) {
      return (
        <img
          src={url}
          alt={title || "Informe"}
          style={{ width: "100%", maxHeight: "50vh", objectFit: "contain" }}
        />
      );
    }
    return (
      <p className="muted">Vista previa no disponible para este archivo.</p>
    );
  };

  const handleRequestChange = async (appointmentId: string) => {
    const message = window.prompt(
      "Indica el motivo o preferencia para el cambio",
    );
    if (!message) return;
    await patientApi.requestAppointmentChange(appointmentId, message);
    await refreshSummary();
  };

  const handleRequestCancel = async (appointmentId: string) => {
    const message = window.prompt("Indica el motivo de la cancelación");
    if (!message) return;
    await patientApi.requestAppointmentCancel(appointmentId, message);
    await refreshSummary();
  };

  const getTreatmentStatus = (status?: string) => {
    switch (status) {
      case "planned":
        return { label: "Planificado", className: "bg-success" };

      case "active":
        return { label: "En tratamiento", className: "bg-primary" };

      case "completed":
        return { label: "Completado", className: "bg-secondary" };

      case "cancelled":
        return { label: "Cancelado", className: "bg-danger" };

      default:
        return { label: "—", className: "bg-light text-dark" };
    }
  };

  return (
    <div className="page">
      <div className="card">
        <h3>Mi clínica</h3>
        <p className="muted mb-3">
          Resumen de tus próximas citas, documentos y tratamientos.
        </p>
        {loading ? <p>Cargando...</p> : null}
        {error ? <p className="muted">{error}</p> : null}
        {!loading && summary ? (
          <div className="grid two-columns">
            <div className="card card-colored">
              <div className="eyebrow2 d-flex align-items-center">
                Próxima cita
              </div>
              <div className="d-flex align-items-top">
                <IconCalendar width={24} height={24} className="me-2" />
                <h4>{nextAppointment?.title || "Sin citas próximas"}</h4>
              </div>
              <div className="d-flex justify-content-between">
                <div>
                  <p className="muted2">
                    {nextAppointment?.scheduledAt
                      ? `El ${new Date(nextAppointment.scheduledAt).toLocaleDateString("es-ES")} a las ${new Date(nextAppointment.scheduledAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`
                      : "—"}
                  </p>
                </div>
                <div>
                  <button
                    className="btn btn-ghost-white btn-mid"
                    onClick={() =>
                      nextAppointment && handleRequestChange(nextAppointment.id)
                    }
                  >
                    Solicitar cambio &gt;
                  </button>
                </div>
              </div>
            </div>
            <div className="card card-colored-red">
              <p className="eyebrow2">Documentos pendientes</p>
              <h4>{documents.length}</h4>
              <p className="muted2">
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
            <div className="table-responsive">
              <table className="table align-top table-striped table-hover">
                <thead>
                  <tr>
                    <th>Cita</th>
                    <th>Fecha</th>
                    <th>Estado</th>
                    <th style={{ width: "220px" }}>Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {appointments.map((appt) => (
                    <tr key={appt.id}>
                      <td width="30%">
                        <IconCalendar className="me-1" height={14} width={14} />{" "}
                        {appt.title || "—"}
                      </td>

                      <td width="30%">
                        {appt.scheduledAt
                          ? new Date(appt.scheduledAt).toLocaleString("es-ES")
                          : "—"}
                      </td>

                      <td width="10%">
                        {appt.status === "requested" ? (
                          <span className="chip chip-success">Pendiente</span>
                        ) : (
                          appt.status || "—"
                        )}
                      </td>

                      <td width="30%">
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-ghost-no-padding btn-small"
                            onClick={() => handleRequestChange(appt.id)}
                          >
                            Solicitar cambio
                          </button>

                          <button
                            className="btn btn-ghost-no-padding btn-small"
                            onClick={() => handleRequestCancel(appt.id)}
                          >
                            Cancelar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {/* <div style={{ marginTop: "18px" }}>
            <h4>Reservar nueva cita</h4>
            <p className="muted mb-3">
              Usa el chat de visitas para pedir disponibilidad con tus propias
              palabras y reservar en segundos.
            </p>
            <Link className="btn btn-primary btn-normal" to="/paciente/visitas">
              Ir al chat de citas
            </Link>
          </div> */}
        </div>

        <div className="card">
          <h3>Documentos y preparación</h3>
          {documents.length === 0 ? (
            <p className="muted">No hay documentos disponibles.</p>
          ) : (
            <div className="list">
              {Object.entries(documentsByCategory).map(([category, items]) => (
                <div key={category} style={{ width: "100%" }}>
                  <p className="eyebrow mt-2 mb-3">{category}</p>
                  {items.map((doc) => (
                    <div key={doc.id} className="list-row">
                      <div>
                        <p className="list-title">
                          <IconLink className="me-2" size={14} /> {doc.title}
                        </p>
                      </div>
                      <div className="list-meta">
                        {doc.url ? (
                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-primary btn-mid"
                              type="button"
                              onClick={() => handlePreview(doc)}
                            >
                              Vista previa
                            </button>
                            <a
                              className="btn btn-secondary btn-mid"
                              href={doc.url}
                              download={buildDownloadName(doc)}
                            >
                              Descargar
                            </a>
                          </div>
                        ) : (
                          <span className="muted">Pendiente</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="grid two-columns">
        <ChatBotFAQs interactions={[]} onRefreshInteractions={async () => {}} />

        <div className="card">
          <h3>Tratamientos</h3>
          {treatments.length === 0 ? (
            <p className="muted">No hay tratamientos activos.</p>
          ) : (
            <div className="table-responsive">
              <table className="table align-top table-striped table-hover align-middle">
                <thead>
                  <tr>
                    <th>Tratamiento</th>
                    <th>Estado</th>
                    <th>Informe</th>
                  </tr>
                </thead>

                <tbody>
                  {treatments.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <strong>
                          <IconLink className="me-2" size={14} />{" "}
                          {t.name || "—"}
                        </strong>
                        <div className="muted ps-4">{t.nextStep || "—"}</div>
                      </td>

                      <td>
                        {(() => {
                          const s = getTreatmentStatus(t.status);
                          return (
                            <span
                              className={"chip chip-success ${s.className}"}
                            >
                              {s.label}
                            </span>
                          );
                        })()}
                      </td>

                      <td>
                        {t.reportTitle || t.reportText || t.reportFileUrl ? (
                          <div>{t.reportTitle || "Informe de tratamiento"}</div>
                        ) : null}
                      </td>
                      <td>
                        {" "}
                        <button
                          className="btn btn-ghost p-0"
                          onClick={() => handleTreatmentPreview(t)}
                        >
                          <IconViewDocument size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
      <Modal
        isOpen={isPreviewOpen}
        title={previewDoc?.title || "Vista previa"}
        onClose={() => setIsPreviewOpen(false)}
      >
        {renderPreviewContent()}
        <div className="d-flex justify-content-end mt-3">
          {previewDoc?.url ? (
            <a
              className="btn btn-secondary"
              href={previewDoc.url}
              download={buildDownloadName(previewDoc)}
            >
              Descargar
            </a>
          ) : null}
        </div>
      </Modal>

      <Modal
        isOpen={isTreatmentPreviewOpen}
        title={
          previewTreatment?.reportTitle || previewTreatment?.name || "Informe"
        }
        onClose={() => setIsTreatmentPreviewOpen(false)}
      >
        {previewTreatment?.reportText ? (
          <div className="mb-3">{previewTreatment.reportText}</div>
        ) : (
          <p className="muted">No hay informe en texto.</p>
        )}
        <div className="mt-3">
          <strong>Vista previa</strong>
          <div className="mt-2">
            {renderTreatmentFilePreview(
              previewTreatment?.reportFileUrl,
              previewTreatment?.reportTitle || previewTreatment?.name,
            )}
          </div>
          {previewTreatment?.reportFileUrl ? (
            <div className="d-flex justify-content-end mt-2">
              <a
                className="btn btn-secondary"
                href={previewTreatment.reportFileUrl}
                download={buildTreatmentDownloadName(previewTreatment)}
              >
                Descargar archivo
              </a>
            </div>
          ) : null}
        </div>

        <div className="mt-4">
          <strong>Historial de informes</strong>
          {treatmentReports.length === 0 ? (
            <p className="muted mt-2">Sin versiones anteriores.</p>
          ) : (
            <div className="table mt-2">
              <div className="table-header">
                <span>Fecha</span>
                <span>Título</span>
                <span>Autor</span>
                <span>Archivo</span>
              </div>
              {treatmentReports.map((r) => (
                <div key={r.id} className="table-row">
                  <span>
                    {r.createdAt ? new Date(r.createdAt).toLocaleString() : "—"}
                  </span>
                  <span>{r.title || "Informe"}</span>
                  <span>{r.createdByName || "Equipo clínico"}</span>
                  <span>
                    {r.fileUrl ? (
                      <a
                        className="btn btn-link p-0"
                        href={r.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Ver archivo
                      </a>
                    ) : (
                      "—"
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
