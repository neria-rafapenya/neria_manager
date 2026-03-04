import { useEffect, useMemo, useState } from "react";
import { SectionHeader } from "../components/SectionHeader";

import {
  getRolePermissions,
  normalizeClinicRole,
} from "../../../core/domain/roles";
import { useAuthContext } from "../../../infrastructure/contexts/AuthContext";
import { staffApi } from "../../../infrastructure/api/clinicflowApi";

export const PatientsPage = () => {
  const { user } = useAuthContext();
  const permissions = getRolePermissions(normalizeClinicRole(user?.role));

  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
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
    url: "",
    status: "pending",
  });

  const [newTreatment, setNewTreatment] = useState({
    name: "",
    status: "planned",
    nextStep: "",
  });

  const [newInteraction, setNewInteraction] = useState({
    title: "Nota",
    summary: "",
    type: "note",
    status: "open",
  });

  const loadPatients = async () => {
    try {
      setLoading(true);
      const data = await staffApi.listPatients();
      setPatients(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || "No se pudieron cargar los pacientes.");
    } finally {
      setLoading(false);
    }
  };

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
    loadPatients();
  }, []);

  useEffect(() => {
    if (selectedPatientId) {
      loadPatientData(selectedPatientId);
    }
  }, [selectedPatientId]);

  const selectedPatient = useMemo(
    () => patients.find((p) => p.id === selectedPatientId) || null,
    [patients, selectedPatientId],
  );

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
    await staffApi.createDocument({
      patientUserId: selectedPatientId,
      ...newDocument,
    });
    setNewDocument({ title: "", category: "", url: "", status: "pending" });
    loadPatientData(selectedPatientId);
  };

  const handleCreateTreatment = async () => {
    if (!selectedPatientId) return;
    await staffApi.createTreatment({
      patientUserId: selectedPatientId,
      ...newTreatment,
    });
    setNewTreatment({ name: "", status: "planned", nextStep: "" });
    loadPatientData(selectedPatientId);
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
          <select
            value={selectedPatientId}
            onChange={(event) => setSelectedPatientId(event.target.value)}
          >
            <option value="">Selecciona un paciente</option>
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.name || patient.email}
              </option>
            ))}
          </select>
        </label>
      </div>

      {selectedPatient ? (
        <section className="grid two-columns">
          <div className="card">
            <h3>Citas</h3>
            <div className="table">
              <div className="table-header">
                <span>Título</span>
                <span>Fecha</span>
                <span>Estado</span>
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
                </div>
              ))}
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
                  className="btn primary"
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
            <div className="table">
              <div className="table-header">
                <span>Documento</span>
                <span>Estado</span>
              </div>
              {documents.map((doc) => (
                <div key={doc.id} className="table-row">
                  <span>{doc.title || "—"}</span>
                  <span>{doc.status || "—"}</span>
                </div>
              ))}
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
                    <input
                      value={newDocument.category}
                      onChange={(event) =>
                        setNewDocument((prev) => ({
                          ...prev,
                          category: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="form-field">
                    URL
                    <input
                      value={newDocument.url}
                      onChange={(event) =>
                        setNewDocument((prev) => ({
                          ...prev,
                          url: event.target.value,
                        }))
                      }
                    />
                  </label>
                </div>
                <button className="btn primary" onClick={handleCreateDocument}>
                  Añadir documento
                </button>
              </>
            ) : (
              <p className="muted">Solo lectura para tu rol.</p>
            )}
          </div>

          <div className="card">
            <h3>Tratamientos</h3>
            <div className="table">
              <div className="table-header">
                <span>Tratamiento</span>
                <span>Estado</span>
              </div>
              {treatments.map((t) => (
                <div key={t.id} className="table-row">
                  <span>{t.name || "—"}</span>
                  <span>{t.status || "—"}</span>
                </div>
              ))}
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
                <button className="btn primary" onClick={handleCreateTreatment}>
                  Añadir tratamiento
                </button>
              </>
            ) : (
              <p className="muted">Solo lectura para tu rol.</p>
            )}
          </div>

          <div className="card">
            <h3>Interacciones</h3>
            <div className="list">
              {interactions.map((i) => (
                <div key={i.id} className="list-row">
                  <div>
                    <p className="list-title">{i.title}</p>
                    <p className="muted">{i.summary}</p>
                  </div>
                  <div className="list-meta">
                    <span>{i.status}</span>
                  </div>
                </div>
              ))}
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
                  className="btn primary"
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
    </div>
  );
};
