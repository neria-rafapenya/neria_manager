import { useEffect, useState } from "react";
import { SectionHeader } from "../components/SectionHeader";
import { Modal } from "../components/shared/Modal";

import {
  getRolePermissions,
  normalizeClinicRole,
} from "../../../core/domain/roles";
import { useAuthContext } from "../../../infrastructure/contexts/AuthContext";
import { staffApi } from "../../../infrastructure/api/clinicflowApi";

export const PatientsPage = () => {
  const { user } = useAuthContext();
  const permissions = getRolePermissions(normalizeClinicRole(user?.role));

  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [patientQuery, setPatientQuery] = useState<string>("");
  const [patientResults, setPatientResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const STORAGE_KEY = "clinicflow_selected_patient";

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { id: string; label?: string };
      if (parsed?.id) {
        setSelectedPatientId(parsed.id);
        if (parsed.label) {
          setPatientQuery(parsed.label);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!selectedPatientId) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          id: selectedPatientId,
          label: patientQuery?.trim() || undefined,
        }),
      );
    } catch {
      // ignore
    }
  }, [selectedPatientId, patientQuery]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [treatments, setTreatments] = useState<any[]>([]);
  const [interactions, setInteractions] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [newAppointment, setNewAppointment] = useState({
    title: "",
    scheduledAt: "",
    durationMin: 30,
    status: "scheduled",
    practitionerName: "",
    location: "",
  });

  const [newDocument, setNewDocument] = useState({
    title: "",
    category: "",
    file: null as File | null,
  });

  const [newTreatment, setNewTreatment] = useState({
    name: "",
    status: "planned",
    nextStep: "",
    reportTitle: "",
    reportText: "",
    reportFile: null as File | null,
  });

  const [isReportOpen, setIsReportOpen] = useState(false);
  const [activeTreatment, setActiveTreatment] = useState<any | null>(null);
  const [reportHistory, setReportHistory] = useState<any[]>([]);
  const [reportTitle, setReportTitle] = useState("");
  const [reportText, setReportText] = useState("");
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [reportPreviewUrl, setReportPreviewUrl] = useState<string | null>(null);
  const [reportPreviewTitle, setReportPreviewTitle] = useState<string | null>(
    null,
  );

  const [newInteraction, setNewInteraction] = useState({
    title: "Nota",
    summary: "",
    type: "note",
    status: "open",
  });

  const loadPatientData = async (patientId: string) => {
    if (!patientId) return;
    try {
      setLoading(true);
      const [appt, docs, treats, inter] = await Promise.all([
        staffApi.listAppointments(patientId),
        staffApi.listDocuments(patientId),
        staffApi.listTreatments(patientId),
        staffApi.listInteractions(patientId),
      ]);
      setAppointments(appt || []);
      setDocuments(docs || []);
      setTreatments(treats || []);
      setInteractions(inter || []);
    } catch (err: any) {
      setError(err.message || "No se pudo cargar la información del paciente.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPatientId) {
      loadPatientData(selectedPatientId);
    }
  }, [selectedPatientId]);

  const formatPatientLabel = (patient: any) => {
    const name = patient?.name?.trim();
    const email = patient?.email?.trim();
    if (name && email) return `${name} · ${email}`;
    return name || email || "Paciente";
  };

  useEffect(() => {
    if (!showSuggestions) return;
    const query = patientQuery.trim();
    if (query.length < 2) {
      setPatientResults([]);
      setIsSearching(false);
      return;
    }
    const handle = window.setTimeout(async () => {
      try {
        setIsSearching(true);
        const data = await staffApi.searchPatients(query);
        setPatientResults(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setError(err.message || "No se pudo buscar pacientes.");
      } finally {
        setIsSearching(false);
      }
    }, 250);
    return () => {
      window.clearTimeout(handle);
    };
  }, [patientQuery, showSuggestions]);

  const handleCreateAppointment = async () => {
    if (!selectedPatientId) return;
    await staffApi.createAppointment({
      patientUserId: selectedPatientId,
      ...newAppointment,
      scheduledAt: newAppointment.scheduledAt
        ? new Date(newAppointment.scheduledAt).toISOString()
        : null,
    });
    setNewAppointment({
      title: "",
      scheduledAt: "",
      durationMin: 30,
      status: "scheduled",
      practitionerName: "",
      location: "",
    });
    loadPatientData(selectedPatientId);
  };

  const handleCreateDocument = async () => {
    if (!selectedPatientId) return;
    if (!newDocument.file) {
      setError("Selecciona un archivo para subir.");
      return;
    }
    await staffApi.uploadDocument({
      patientUserId: selectedPatientId,
      title: newDocument.title || undefined,
      category: newDocument.category || undefined,
      file: newDocument.file,
    });
    setNewDocument({ title: "", category: "", file: null });
    loadPatientData(selectedPatientId);
  };

  const handleCreateTreatment = async () => {
    if (!selectedPatientId) return;
    const { reportFile, ...payload } = newTreatment;
    const created = await staffApi.createTreatment({
      patientUserId: selectedPatientId,
      ...payload,
    });
    if (reportFile && created?.id) {
      await staffApi.uploadTreatmentReport(created.id, {
        file: reportFile,
      });
    }
    setNewTreatment({
      name: "",
      status: "planned",
      nextStep: "",
      reportTitle: "",
      reportText: "",
      reportFile: null,
    });
    loadPatientData(selectedPatientId);
  };

  const openReportModal = async (treatment: any) => {
    setActiveTreatment(treatment);
    setReportTitle(treatment.reportTitle || "");
    setReportText(treatment.reportText || "");
    setReportFile(null);
    setReportPreviewUrl(treatment.reportFileUrl || null);
    setReportPreviewTitle(treatment.reportTitle || treatment.name || "Informe");
    try {
      const history = await staffApi.listTreatmentReports(treatment.id);
      setReportHistory(Array.isArray(history) ? history : []);
    } catch (err: any) {
      setError(err.message || "No se pudo cargar el historial del informe.");
      setReportHistory([]);
    }
    setIsReportOpen(true);
  };

  const saveReport = async () => {
    if (!activeTreatment) return;
    await staffApi.updateTreatmentReport(activeTreatment.id, {
      reportTitle: reportTitle || null,
      reportText: reportText || null,
    });
    if (reportFile) {
      await staffApi.uploadTreatmentReport(activeTreatment.id, {
        file: reportFile,
        title: reportTitle || undefined,
      });
    }
    await loadPatientData(selectedPatientId);
    const history = await staffApi.listTreatmentReports(activeTreatment.id);
    setReportHistory(Array.isArray(history) ? history : []);
    setReportFile(null);
  };

  const deleteReport = async (reportId: string) => {
    if (!activeTreatment) return;
    await staffApi.deleteTreatmentReport(reportId);
    const history = await staffApi.listTreatmentReports(activeTreatment.id);
    setReportHistory(Array.isArray(history) ? history : []);
  };

  const getExtension = (url?: string | null) => {
    if (!url) return "";
    const clean = url.split("?")[0];
    const match = clean.match(/\.([a-z0-9]+)$/i);
    return match ? match[1].toLowerCase() : "";
  };

  const renderReportPreview = (url?: string | null, title?: string | null) => {
    if (!url) return <p className="muted">No hay archivo adjunto.</p>;
    const ext = getExtension(url);
    if (ext === "pdf") {
      return (
        <iframe
          title={title || "Informe"}
          src={url}
          style={{ width: "100%", height: "320px", border: "none" }}
        />
      );
    }
    if (["png", "jpg", "jpeg"].includes(ext)) {
      return (
        <img
          src={url}
          alt={title || "Informe"}
          style={{ width: "100%", maxHeight: "320px", objectFit: "contain" }}
        />
      );
    }
    return (
      <p className="muted">Vista previa no disponible para este archivo.</p>
    );
  };

  const handleCreateInteraction = async () => {
    if (!selectedPatientId) return;
    await staffApi.createInteraction({
      ...newInteraction,
      patientUserId: selectedPatientId,
    });
    setNewInteraction({
      title: "Nota",
      summary: "",
      type: "note",
      status: "open",
    });
    loadPatientData(selectedPatientId);
  };

  return (
    <div className="page">
      <SectionHeader
        title="Pacientes"
        subtitle="Gestión de citas, documentos y tratamientos"
      />

      {error ? <div className="error-banner">{error}</div> : null}

      <div className="card">
        <label className="form-field">
          Selecciona paciente
          <div className="patient-autocomplete">
            <input
              type="search"
              placeholder="Empieza a escribir nombre o email…"
              value={patientQuery}
              onFocus={() => {
                setIsFocused(true);
                setShowSuggestions(true);
              }}
              onBlur={() => {
                window.setTimeout(() => {
                  setIsFocused(false);
                  setShowSuggestions(false);
                }, 150);
              }}
              onChange={(event) => {
                const value = event.target.value;
                setPatientQuery(value);
                setShowSuggestions(true);
                if (!value.trim()) {
                  setSelectedPatientId("");
                  setPatientResults([]);
                }
              }}
            />

            <button
              type="button"
              className="btn btn-light btn-clear-patient"
              onClick={() => {
                setSelectedPatientId("");
                setPatientQuery("");
                setPatientResults([]);
                setShowSuggestions(false);
                try {
                  window.localStorage.removeItem(STORAGE_KEY);
                } catch {
                  // ignore
                }
              }}
            >
              Limpiar
            </button>

            {showSuggestions && isFocused && patientQuery.trim().length >= 2 ? (
              <div className="patient-suggestions">
                {isSearching ? (
                  <div className="patient-suggestion muted">Buscando…</div>
                ) : patientResults.length === 0 ? (
                  <div className="patient-suggestion muted">
                    No hay resultados
                  </div>
                ) : (
                  patientResults.map((patient) => (
                    <button
                      key={patient.id}
                      type="button"
                      className="patient-suggestion"
                      onMouseDown={() => {
                        setSelectedPatientId(patient.id);
                        setPatientQuery(formatPatientLabel(patient));
                        setShowSuggestions(false);
                        setPatientResults([]);
                      }}
                    >
                      <div className="patient-suggestion-title">
                        {patient.name || "Paciente"}
                      </div>
                      <div className="patient-suggestion-meta">
                        {patient.email || ""}
                      </div>
                    </button>
                  ))
                )}
              </div>
            ) : null}
          </div>
        </label>
      </div>

      {selectedPatientId ? (
        <section className="grid two-columns">
          <div className="card">
            <h3>Citas</h3>

            <div className="table-responsive">
              <table className="table table-striped table-hover align-top">
                <thead>
                  <tr>
                    <th>Título</th>
                    <th>Fecha</th>
                    <th>Estado</th>
                  </tr>
                </thead>

                <tbody>
                  {appointments.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-muted">
                        No hay citas registradas
                      </td>
                    </tr>
                  ) : (
                    appointments.map((appt) => (
                      <tr key={appt.id}>
                        <td>{appt.title || "—"}</td>

                        <td>
                          {appt.scheduledAt
                            ? new Date(appt.scheduledAt).toLocaleString("es-ES")
                            : "—"}
                        </td>

                        <td>{appt.status || "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {permissions.canManageAppointments ? (
              <>
                <div className="form-grid form-grid-2">
                  <label className="form-field">
                    Título
                    <input
                      value={newAppointment.title}
                      onChange={(event) =>
                        setNewAppointment((prev) => ({
                          ...prev,
                          title: event.target.value,
                        }))
                      }
                    />
                  </label>

                  <label className="form-field">
                    Fecha
                    <input
                      type="datetime-local"
                      value={newAppointment.scheduledAt}
                      onChange={(event) =>
                        setNewAppointment((prev) => ({
                          ...prev,
                          scheduledAt: event.target.value,
                        }))
                      }
                    />
                  </label>

                  <label className="form-field">
                    Profesional
                    <input
                      value={newAppointment.practitionerName}
                      onChange={(event) =>
                        setNewAppointment((prev) => ({
                          ...prev,
                          practitionerName: event.target.value,
                        }))
                      }
                    />
                  </label>

                  <label className="form-field">
                    Ubicación
                    <input
                      value={newAppointment.location}
                      onChange={(event) =>
                        setNewAppointment((prev) => ({
                          ...prev,
                          location: event.target.value,
                        }))
                      }
                    />
                  </label>
                </div>

                <button
                  className="btn btn-primary btn-normal"
                  onClick={handleCreateAppointment}
                >
                  Añadir cita
                </button>
              </>
            ) : (
              <p className="muted">Solo lectura para tu rol.</p>
            )}
          </div>

          <div className="card">
            <h3>Documentos</h3>

            <div className="table-responsive">
              <table className="table  align-top table-striped table-hover ">
                <thead>
                  <tr>
                    <th>Documento</th>
                    <th>Categoría</th>
                    <th>Estado</th>
                  </tr>
                </thead>

                <tbody>
                  {documents.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-muted">
                        No hay documentos disponibles
                      </td>
                    </tr>
                  ) : (
                    documents.map((doc) => (
                      <tr key={doc.id}>
                        <td>
                          {doc.url ? (
                            <a
                              className="link"
                              href={doc.url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {doc.title || "Documento"}
                            </a>
                          ) : (
                            doc.title || "—"
                          )}
                        </td>

                        <td>{doc.category || "—"}</td>

                        <td>{doc.status || "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {permissions.canManageDocuments ? (
              <>
                <div className="form-grid form-grid-2">
                  <label className="form-field">
                    Título
                    <input
                      value={newDocument.title}
                      onChange={(event) =>
                        setNewDocument((prev) => ({
                          ...prev,
                          title: event.target.value,
                        }))
                      }
                    />
                  </label>

                  <label className="form-field">
                    Categoría
                    <select
                      value={newDocument.category}
                      onChange={(event) =>
                        setNewDocument((prev) => ({
                          ...prev,
                          category: event.target.value,
                        }))
                      }
                    >
                      <option value="">Selecciona categoría</option>
                      <option value="certificados">Certificados</option>
                      <option value="resultados">Resultados</option>
                      <option value="facturas">Facturas</option>
                      <option value="circulares">Circulares</option>
                      <option value="presupuestos">Presupuestos</option>
                    </select>
                  </label>

                  <label className="form-field">
                    Archivo
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.csv,.png,.jpg,.jpeg"
                      onChange={(event) =>
                        setNewDocument((prev) => ({
                          ...prev,
                          file: event.target.files?.[0] || null,
                        }))
                      }
                    />
                  </label>
                </div>

                <button
                  className="btn btn-primary btn-normal"
                  onClick={handleCreateDocument}
                >
                  Añadir documento
                </button>
              </>
            ) : (
              <p className="muted">Solo lectura para tu rol.</p>
            )}
          </div>

          <div className="card">
            <h3>Tratamientos</h3>

            <div className="table-responsive">
              <table className="table table-striped table-hover align-top">
                <thead>
                  <tr>
                    <th>Tratamiento</th>
                    <th>Estado</th>
                    <th>Informe</th>
                    {permissions.canManageTreatments ? <th>Acciones</th> : null}
                  </tr>
                </thead>

                <tbody>
                  {treatments.length === 0 ? (
                    <tr className="align-top">
                      <td
                        colSpan={permissions.canManageTreatments ? 4 : 3}
                        className="text-muted align-top"
                      >
                        No hay tratamientos registrados
                      </td>
                    </tr>
                  ) : (
                    treatments.map((t) => (
                      <tr key={t.id}>
                        <td>{t.name || "—"}</td>
                        <td className="align-top">{t.status || "—"}</td>
                        <td>
                          {t.reportTitle || t.reportText || t.reportFileUrl ? (
                            <span className="text-muted">Disponible</span>
                          ) : (
                            "—"
                          )}
                        </td>
                        {permissions.canManageTreatments ? (
                          <td>
                            <button
                              className="btn btn-link p-0"
                              onClick={() => openReportModal(t)}
                            >
                              Editar informe
                            </button>
                          </td>
                        ) : null}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {permissions.canManageTreatments ? (
              <>
                <div className="form-grid form-grid-2">
                  <label className="form-field">
                    Nombre
                    <input
                      value={newTreatment.name}
                      onChange={(event) =>
                        setNewTreatment((prev) => ({
                          ...prev,
                          name: event.target.value,
                        }))
                      }
                    />
                  </label>

                  <label className="form-field">
                    Siguiente paso
                    <input
                      value={newTreatment.nextStep}
                      onChange={(event) =>
                        setNewTreatment((prev) => ({
                          ...prev,
                          nextStep: event.target.value,
                        }))
                      }
                    />
                  </label>
                </div>

                <div className="form-grid form-grid-2">
                  <label className="form-field">
                    Título del informe
                    <input
                      value={newTreatment.reportTitle}
                      onChange={(event) =>
                        setNewTreatment((prev) => ({
                          ...prev,
                          reportTitle: event.target.value,
                        }))
                      }
                    />
                  </label>

                  <label className="form-field">
                    Archivo del informe (opcional)
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.csv,.png,.jpg,.jpeg"
                      onChange={(event) =>
                        setNewTreatment((prev) => ({
                          ...prev,
                          reportFile: event.target.files?.[0] || null,
                        }))
                      }
                    />
                  </label>
                </div>

                <label className="form-field">
                  Informe (texto)
                  <textarea
                    rows={4}
                    value={newTreatment.reportText}
                    onChange={(event) =>
                      setNewTreatment((prev) => ({
                        ...prev,
                        reportText: event.target.value,
                      }))
                    }
                  />
                </label>

                <button
                  className="btn btn-primary btn-normal"
                  onClick={handleCreateTreatment}
                >
                  Añadir tratamiento
                </button>
              </>
            ) : (
              <p className="muted">Solo lectura para tu rol.</p>
            )}
          </div>

          <div className="card">
            <h3>Interacciones</h3>

            <div className="table-responsive">
              <table className="table align-top table-striped table-hover ">
                <thead>
                  <tr>
                    <th>Interacción</th>
                    <th>Resumen</th>
                    <th>Estado</th>
                  </tr>
                </thead>

                <tbody>
                  {interactions.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-muted">
                        No hay interacciones registradas
                      </td>
                    </tr>
                  ) : (
                    interactions.map((i) => (
                      <tr key={i.id}>
                        <td>{i.title || "—"}</td>

                        <td>
                          <span className="text-muted">{i.summary || "—"}</span>
                        </td>

                        <td>{i.status || "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {permissions.canManageInteractions ? (
              <>
                <div className="form-field">
                  <label>Nota</label>
                  <textarea
                    rows={3}
                    value={newInteraction.summary}
                    onChange={(event) =>
                      setNewInteraction((prev) => ({
                        ...prev,
                        summary: event.target.value,
                      }))
                    }
                  />
                </div>

                <button
                  className="btn btn-primary btn-normal"
                  onClick={handleCreateInteraction}
                >
                  Añadir nota
                </button>
              </>
            ) : (
              <p className="muted">Solo lectura para tu rol.</p>
            )}
          </div>
        </section>
      ) : null}

      {loading ? <p className="muted">Cargando...</p> : null}

      <Modal
        isOpen={isReportOpen}
        title={
          activeTreatment?.name
            ? `Informe · ${activeTreatment.name}`
            : "Informe"
        }
        onClose={() => setIsReportOpen(false)}
        size="lg"
      >
        <div className="form-grid form-grid-2">
          <label className="form-field">
            Título del informe
            <input
              value={reportTitle}
              onChange={(event) => setReportTitle(event.target.value)}
            />
          </label>

          <label className="form-field">
            Archivo (PDF/imagen)
            <input
              type="file"
              accept=".pdf,.doc,.docx,.csv,.png,.jpg,.jpeg"
              onChange={(event) => {
                const file = event.target.files?.[0] || null;
                setReportFile(file);
                if (file) {
                  setReportPreviewUrl(null);
                  setReportPreviewTitle(file.name);
                }
              }}
            />
          </label>
        </div>

        <label className="form-field">
          Informe (texto)
          <textarea
            rows={4}
            value={reportText}
            onChange={(event) => setReportText(event.target.value)}
          />
        </label>

        <div className="mt-3">
          <strong>Vista previa</strong>
          <div className="mt-2">
            {renderReportPreview(reportPreviewUrl, reportPreviewTitle)}
          </div>
        </div>

        <div className="mt-4">
          <strong>Historial de informes</strong>
          {reportHistory.length === 0 ? (
            <p className="muted mt-2">No hay versiones anteriores.</p>
          ) : (
            <div className="table mt-2">
              <div className="table-header">
                <span>Fecha</span>
                <span>Título</span>
                <span>Autor</span>
                <span>Archivo</span>
                <span>Acciones</span>
              </div>
              {reportHistory.map((r) => (
                <div key={r.id} className="table-row">
                  <span>
                    {r.createdAt ? new Date(r.createdAt).toLocaleString() : "—"}
                  </span>
                  <span>{r.title || "Informe"}</span>
                  <span>{r.createdByName || "—"}</span>
                  <span>
                    {r.fileUrl ? (
                      <button
                        className="btn btn-link p-0"
                        onClick={() => {
                          setReportPreviewUrl(r.fileUrl);
                          setReportPreviewTitle(r.title || "Informe");
                        }}
                      >
                        Ver archivo
                      </button>
                    ) : (
                      "—"
                    )}
                  </span>
                  <span>
                    <button
                      className="btn btn-link text-danger p-0"
                      onClick={() => deleteReport(r.id)}
                    >
                      Eliminar
                    </button>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="d-flex justify-content-end gap-2 mt-4">
          <button
            className="btn secondary"
            onClick={() => setIsReportOpen(false)}
          >
            Cerrar
          </button>
          <button className="btn btn-primary" onClick={saveReport}>
            Guardar informe
          </button>
        </div>
      </Modal>
    </div>
  );
};
