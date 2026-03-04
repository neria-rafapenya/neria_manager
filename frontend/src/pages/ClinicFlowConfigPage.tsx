import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { useI18n } from "../i18n/I18nProvider";
import { emitToast } from "../toast";
import type {
  ClinicFlowFaq,
  ClinicFlowProtocol,
  ClinicFlowReportTemplate,
  ClinicFlowService,
  ClinicFlowSettings,
  ClinicFlowTriageFlow,
  ClinicFlowUser,
} from "../types";

type OpeningHours = {
  weekday: string;
  saturday: string;
  sunday: string;
  emergency: string;
};

type ChannelSettings = {
  web: boolean;
  whatsapp: boolean;
  voice: boolean;
  email: boolean;
};

const defaultOpeningHours: OpeningHours = {
  weekday: "09:00 - 20:00",
  saturday: "09:00 - 14:00",
  sunday: "Cerrado",
  emergency: "Derivar a teléfono 24/7",
};

const defaultChannels: ChannelSettings = {
  web: true,
  whatsapp: false,
  voice: false,
  email: true,
};

const defaultSettings: ClinicFlowSettings = {
  name: "",
  legalName: "",
  email: "",
  phone: "",
  address: "",
  timezone: "Europe/Madrid",
  website: "",
  emergencyDisclaimer: "",
  privacyNotice: "",
  openingHours: "",
  channels: "",
};

const parseJson = <T,>(value: string | null | undefined, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const formatCurrency = (value: number | string | null | undefined) => {
  if (value === null || value === undefined || value === "") return "—";
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return "—";
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(numeric);
};

export function ClinicFlowConfigPage() {
  const params = useParams();
  const tenantId = params.tenantId;
  const serviceCode = "clinicflow";
  const navigate = useNavigate();
  const { t } = useI18n();

  const [settings, setSettings] = useState<ClinicFlowSettings>(defaultSettings);
  const [openingHours, setOpeningHours] = useState<OpeningHours>(
    defaultOpeningHours,
  );
  const [channels, setChannels] = useState<ChannelSettings>(defaultChannels);
  const [services, setServices] = useState<ClinicFlowService[]>([]);
  const [protocols, setProtocols] = useState<ClinicFlowProtocol[]>([]);
  const [faqEntries, setFaqEntries] = useState<ClinicFlowFaq[]>([]);
  const [triageFlows, setTriageFlows] = useState<ClinicFlowTriageFlow[]>([]);
  const [reports, setReports] = useState<ClinicFlowReportTemplate[]>([]);
  const [users, setUsers] = useState<ClinicFlowUser[]>([]);
  const [userDraft, setUserDraft] = useState({
    name: "",
    email: "",
    role: "manager",
    status: "active",
    password: "",
    mustChangePassword: true,
  });
  const [userBusy, setUserBusy] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const title = useMemo(() => {
    return tenantId ? `ClinicFlow AI · ${tenantId}` : "ClinicFlow AI";
  }, [tenantId]);

  const loadClinicFlow = async () => {
    if (!tenantId) return;
    setBusy(true);
    setError(null);
    try {
      const [
        settingsResponse,
        serviceList,
        protocolList,
        faqList,
        triageList,
        reportList,
        userList,
      ] = await Promise.all([
        api.getClinicFlowSettings(tenantId, serviceCode),
        api.listClinicFlowServices(tenantId, serviceCode),
        api.listClinicFlowProtocols(tenantId, serviceCode),
        api.listClinicFlowFaq(tenantId, serviceCode),
        api.listClinicFlowTriageFlows(tenantId, serviceCode),
        api.listClinicFlowReportTemplates(tenantId, serviceCode),
        api.listClinicFlowUsers(tenantId, serviceCode),
      ]);

      const mergedSettings = {
        ...defaultSettings,
        ...(settingsResponse || {}),
      } as ClinicFlowSettings;

      setSettings(mergedSettings);
      setOpeningHours(
        parseJson<OpeningHours>(mergedSettings.openingHours, defaultOpeningHours),
      );
      setChannels(
        parseJson<ChannelSettings>(mergedSettings.channels, defaultChannels),
      );
      setServices((serviceList as ClinicFlowService[]) || []);
      setProtocols((protocolList as ClinicFlowProtocol[]) || []);
      setFaqEntries((faqList as ClinicFlowFaq[]) || []);
      setTriageFlows((triageList as ClinicFlowTriageFlow[]) || []);
      setReports((reportList as ClinicFlowReportTemplate[]) || []);
      setUsers((userList as ClinicFlowUser[]) || []);
    } catch (err: any) {
      setError(err.message || t("No se pudo cargar ClinicFlow"));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    loadClinicFlow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  const handleSave = async () => {
    if (!tenantId) return;
    setBusy(true);
    setError(null);
    try {
      const payload: ClinicFlowSettings = {
        ...settings,
        openingHours: JSON.stringify(openingHours),
        channels: JSON.stringify(channels),
      };
      const updated = (await api.updateClinicFlowSettings(
        tenantId,
        serviceCode,
        payload,
      )) as ClinicFlowSettings;
      setSettings({ ...defaultSettings, ...updated });
      emitToast(t("Configuración guardada"));
    } catch (err: any) {
      setError(err.message || t("No se pudo guardar la configuración"));
    } finally {
      setBusy(false);
    }
  };

  const handleCreateUser = async () => {
    if (!tenantId) return;
    setUserBusy(true);
    setUserError(null);
    try {
      const payload = {
        name: userDraft.name || undefined,
        email: userDraft.email,
        role: userDraft.role,
        status: userDraft.status,
        password: userDraft.password,
        mustChangePassword: userDraft.mustChangePassword,
      };
      const created = (await api.createClinicFlowUser(
        tenantId,
        serviceCode,
        payload,
      )) as ClinicFlowUser;
      setUsers((prev) => [created, ...prev]);
      setUserDraft({
        name: "",
        email: "",
        role: "manager",
        status: "active",
        password: "",
        mustChangePassword: true,
      });
      emitToast(t("Usuario creado"));
    } catch (err: any) {
      setUserError(err.message || t("No se pudo crear el usuario"));
    } finally {
      setUserBusy(false);
    }
  };

  const updateUserLocal = (id: string, patch: Partial<ClinicFlowUser>) => {
    setUsers((prev) =>
      prev.map((user) => (user.id === id ? { ...user, ...patch } : user)),
    );
  };

  const handleUpdateUser = async (userId: string) => {
    if (!tenantId) return;
    const user = users.find((item) => item.id === userId);
    if (!user) return;
    setUserBusy(true);
    setUserError(null);
    try {
      const payload = {
        name: user.name || undefined,
        email: user.email,
        role: user.role,
        status: user.status,
        mustChangePassword: user.mustChangePassword ?? false,
      };
      const updated = (await api.updateClinicFlowUser(
        tenantId,
        serviceCode,
        userId,
        payload,
      )) as ClinicFlowUser;
      updateUserLocal(userId, updated);
      emitToast(t("Usuario actualizado"));
    } catch (err: any) {
      setUserError(err.message || t("No se pudo actualizar el usuario"));
    } finally {
      setUserBusy(false);
    }
  };

  const handleResetPassword = async (userId: string) => {
    if (!tenantId) return;
    const password = window.prompt(t("Nueva contraseña"));
    if (!password) return;
    setUserBusy(true);
    setUserError(null);
    try {
      await api.resetClinicFlowUserPassword(tenantId, serviceCode, userId, {
        password,
        mustChangePassword: true,
      });
      emitToast(t("Contraseña restablecida"));
    } catch (err: any) {
      setUserError(err.message || t("No se pudo restablecer la contraseña"));
    } finally {
      setUserBusy(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!tenantId) return;
    const confirmed = window.confirm(t("¿Eliminar este usuario?"));
    if (!confirmed) return;
    setUserBusy(true);
    setUserError(null);
    try {
      await api.deleteClinicFlowUser(tenantId, serviceCode, userId);
      setUsers((prev) => prev.filter((item) => item.id !== userId));
      emitToast(t("Usuario eliminado"));
    } catch (err: any) {
      setUserError(err.message || t("No se pudo eliminar el usuario"));
    } finally {
      setUserBusy(false);
    }
  };

  const protocolItems = protocols.map((protocol) => ({
    label: `${protocol.title ?? t("Protocolo")} ${
      protocol.version ? `· ${protocol.version}` : ""
    }`.trim(),
    done:
      protocol.status?.toLowerCase().includes("aprob") ||
      protocol.status?.toLowerCase().includes("activo") ||
      false,
  }));

  const faqItems = faqEntries.map((entry) => ({
    label: entry.question ?? t("FAQ"),
    done: entry.active ?? true,
  }));

  const triageItems = triageFlows.map((flow) => ({
    label: flow.name ?? t("Flujo"),
    done:
      flow.status?.toLowerCase().includes("activo") ||
      flow.status?.toLowerCase().includes("public") ||
      false,
  }));

  const reportItems = reports;

  const renderChecklist = (
    items: { label: string; done: boolean }[],
    fallback: string[],
  ) => {
    const rows = items.length
      ? items
      : fallback.map((label) => ({ label, done: false }));
    return (
      <ul className="checklist">
        {rows.map((row, idx) => (
          <li key={`${row.label}-${idx}`} className={row.done ? "done" : ""}>
            {row.label}
          </li>
        ))}
      </ul>
    );
  };

  if (!tenantId) {
    return (
      <div className="card">
        <div className="muted">
          {t("Selecciona un tenant para configurar ClinicFlow.")}
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="card-header">
        <div>
          <h2>{title}</h2>
          <p className="muted">
            Configuración clínica omnicanal: FAQ, agenda, triaje y plantillas
            clínicas.
          </p>
        </div>
        <div className="card-header-actions">
          <button className="btn" onClick={() => navigate(-1)}>
            {t("Volver")}
          </button>
          <button className="btn primary" onClick={handleSave} disabled={busy}>
            {busy ? t("Guardando...") : t("Guardar cambios")}
          </button>
        </div>
      </div>

      {error ? (
        <div className="card">
          <div className="error-banner">{error}</div>
        </div>
      ) : null}

      <div className="card">
        <h3>{t("Datos de la clínica")}</h3>
        <div className="form-grid form-grid-2">
          <label className="form-field">
            {t("Nombre comercial")}
            <input
              value={settings.name ?? ""}
              onChange={(event) =>
                setSettings((prev) => ({ ...prev, name: event.target.value }))
              }
            />
          </label>
          <label className="form-field">
            {t("Razón social")}
            <input
              value={settings.legalName ?? ""}
              onChange={(event) =>
                setSettings((prev) => ({
                  ...prev,
                  legalName: event.target.value,
                }))
              }
            />
          </label>
          <label className="form-field">
            {t("Email")}
            <input
              value={settings.email ?? ""}
              onChange={(event) =>
                setSettings((prev) => ({ ...prev, email: event.target.value }))
              }
            />
          </label>
          <label className="form-field">
            {t("Teléfono")}
            <input
              value={settings.phone ?? ""}
              onChange={(event) =>
                setSettings((prev) => ({ ...prev, phone: event.target.value }))
              }
            />
          </label>
          <label className="form-field full">
            {t("Dirección")}
            <input
              value={settings.address ?? ""}
              onChange={(event) =>
                setSettings((prev) => ({
                  ...prev,
                  address: event.target.value,
                }))
              }
            />
          </label>
          <label className="form-field">
            {t("Zona horaria")}
            <input
              value={settings.timezone ?? ""}
              onChange={(event) =>
                setSettings((prev) => ({
                  ...prev,
                  timezone: event.target.value,
                }))
              }
            />
          </label>
          <label className="form-field">
            {t("Web")}
            <input
              value={settings.website ?? ""}
              onChange={(event) =>
                setSettings((prev) => ({
                  ...prev,
                  website: event.target.value,
                }))
              }
            />
          </label>
        </div>
      </div>

      <div className="card">
        <h3>{t("Usuarios del equipo")}</h3>
        <div className="form-grid form-grid-2">
          <label className="form-field">
            {t("Nombre")}
            <input
              value={userDraft.name}
              onChange={(event) =>
                setUserDraft((prev) => ({
                  ...prev,
                  name: event.target.value,
                }))
              }
            />
          </label>
          <label className="form-field">
            {t("Correo")}
            <input
              type="email"
              value={userDraft.email}
              onChange={(event) =>
                setUserDraft((prev) => ({
                  ...prev,
                  email: event.target.value,
                }))
              }
            />
          </label>
          <label className="form-field">
            {t("Rol")}
            <select
              value={userDraft.role}
              onChange={(event) =>
                setUserDraft((prev) => ({
                  ...prev,
                  role: event.target.value,
                }))
              }
            >
              <option value="manager">{t("Gestor")}</option>
              <option value="staff">{t("Personal")}</option>
              <option value="assistant">{t("Asistente")}</option>
              <option value="patient">{t("Paciente")}</option>
            </select>
          </label>
          <label className="form-field">
            {t("Estado")}
            <select
              value={userDraft.status}
              onChange={(event) =>
                setUserDraft((prev) => ({
                  ...prev,
                  status: event.target.value,
                }))
              }
            >
              <option value="active">{t("Activo")}</option>
              <option value="inactive">{t("Inactivo")}</option>
            </select>
          </label>
          <label className="form-field">
            {t("Contraseña inicial")}
            <input
              type="password"
              value={userDraft.password}
              onChange={(event) =>
                setUserDraft((prev) => ({
                  ...prev,
                  password: event.target.value,
                }))
              }
            />
          </label>
          <label className="form-field">
            {t("Forzar cambio de contraseña")}
            <select
              value={userDraft.mustChangePassword ? "yes" : "no"}
              onChange={(event) =>
                setUserDraft((prev) => ({
                  ...prev,
                  mustChangePassword: event.target.value === "yes",
                }))
              }
            >
              <option value="yes">{t("Sí")}</option>
              <option value="no">{t("No")}</option>
            </select>
          </label>
        </div>
        {userError ? <div className="error-banner">{userError}</div> : null}
        <button
          className="btn primary"
          type="button"
          disabled={!userDraft.email || !userDraft.password || userBusy}
          onClick={handleCreateUser}
        >
          {userBusy ? t("Guardando...") : t("Crear usuario")}
        </button>

        <div className="table" style={{ marginTop: "16px" }}>
          <div className="table-header">
            <span>{t("Usuario")}</span>
            <span>{t("Rol")}</span>
            <span>{t("Estado")}</span>
            <span>{t("Acciones")}</span>
          </div>
          {users.length === 0 ? (
            <div className="table-row">
              <span className="muted">{t("Sin usuarios aún")}</span>
              <span>—</span>
              <span>—</span>
              <span>—</span>
            </div>
          ) : (
            users.map((row) => (
              <div key={row.id} className="table-row">
                <span>
                  <strong>{row.name || row.email}</strong>
                  <span className="muted" style={{ display: "block" }}>
                    {row.email}
                  </span>
                </span>
                <span>
                  <select
                    value={row.role || "staff"}
                    onChange={(event) =>
                      updateUserLocal(row.id, { role: event.target.value })
                    }
                  >
                    <option value="manager">{t("Gestor")}</option>
                    <option value="staff">{t("Personal")}</option>
                    <option value="assistant">{t("Asistente")}</option>
                    <option value="patient">{t("Paciente")}</option>
                  </select>
                </span>
                <span>
                  <select
                    value={row.status || "active"}
                    onChange={(event) =>
                      updateUserLocal(row.id, { status: event.target.value })
                    }
                  >
                    <option value="active">{t("Activo")}</option>
                    <option value="inactive">{t("Inactivo")}</option>
                  </select>
                </span>
                <span className="table-actions">
                  <button
                    className="btn"
                    type="button"
                    disabled={userBusy}
                    onClick={() => handleUpdateUser(row.id)}
                  >
                    {t("Guardar")}
                  </button>
                  <button
                    className="btn"
                    type="button"
                    disabled={userBusy}
                    onClick={() => handleResetPassword(row.id)}
                  >
                    {t("Reset pass")}
                  </button>
                  <button
                    className="btn danger"
                    type="button"
                    disabled={userBusy}
                    onClick={() => handleDeleteUser(row.id)}
                  >
                    {t("Eliminar")}
                  </button>
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="grid two-columns">
        <div className="card">
          <h3>{t("Canales activos")}</h3>
          <div className="option-list">
            <label className="option-item">
              <input
                type="checkbox"
                checked={channels.web}
                onChange={(event) =>
                  setChannels((prev) => ({
                    ...prev,
                    web: event.target.checked,
                  }))
                }
              />
              <span>Chat web embebido</span>
            </label>
            <label className="option-item">
              <input
                type="checkbox"
                checked={channels.whatsapp}
                onChange={(event) =>
                  setChannels((prev) => ({
                    ...prev,
                    whatsapp: event.target.checked,
                  }))
                }
              />
              <span>WhatsApp (fase 2)</span>
            </label>
            <label className="option-item">
              <input
                type="checkbox"
                checked={channels.voice}
                onChange={(event) =>
                  setChannels((prev) => ({
                    ...prev,
                    voice: event.target.checked,
                  }))
                }
              />
              <span>Teléfono / voz (fase 2)</span>
            </label>
            <label className="option-item">
              <input
                type="checkbox"
                checked={channels.email}
                onChange={(event) =>
                  setChannels((prev) => ({
                    ...prev,
                    email: event.target.checked,
                  }))
                }
              />
              <span>Email asistido</span>
            </label>
          </div>
          <p className="muted">
            Ajusta las horas de disponibilidad y mensajes de fuera de horario.
          </p>
        </div>

        <div className="card">
          <h3>{t("Horario de atención")}</h3>
          <div className="form-grid form-grid-2">
            <label className="form-field">
              {t("L-V")}
              <input
                value={openingHours.weekday}
                onChange={(event) =>
                  setOpeningHours((prev) => ({
                    ...prev,
                    weekday: event.target.value,
                  }))
                }
              />
            </label>
            <label className="form-field">
              {t("Sábado")}
              <input
                value={openingHours.saturday}
                onChange={(event) =>
                  setOpeningHours((prev) => ({
                    ...prev,
                    saturday: event.target.value,
                  }))
                }
              />
            </label>
            <label className="form-field">
              {t("Domingo")}
              <input
                value={openingHours.sunday}
                onChange={(event) =>
                  setOpeningHours((prev) => ({
                    ...prev,
                    sunday: event.target.value,
                  }))
                }
              />
            </label>
            <label className="form-field">
              {t("Urgencias")}
              <input
                value={openingHours.emergency}
                onChange={(event) =>
                  setOpeningHours((prev) => ({
                    ...prev,
                    emergency: event.target.value,
                  }))
                }
              />
            </label>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>{t("Servicios y precios orientativos")}</h3>
        <div className="table">
          <div className="table-header">
            <span>{t("Servicio")}</span>
            <span>{t("Duración")}</span>
            <span>{t("Precio")}</span>
            <span>{t("Activo")}</span>
          </div>
          {services.length === 0 ? (
            <div className="table-row">
              <span className="muted">{t("Sin servicios todavía")}</span>
              <span>—</span>
              <span>—</span>
              <span className="tag neutral">{t("No")}</span>
            </div>
          ) : (
            services.map((row) => {
              const price = row.priceMin || row.priceMax
                ? `${formatCurrency(row.priceMin)}${
                    row.priceMax && row.priceMax !== row.priceMin
                      ? ` - ${formatCurrency(row.priceMax)}`
                      : ""
                  }`
                : "—";
              return (
                <div key={row.id} className="table-row">
                  <span>{row.name || row.code || "—"}</span>
                  <span>
                    {row.durationMin ? `${row.durationMin} min` : "—"}
                  </span>
                  <span>{price}</span>
                  <span className={`tag ${row.active ? "neutral" : "warning"}`}>
                    {row.active ? t("Sí") : t("No")}
                  </span>
                </div>
              );
            })
          )}
        </div>
        <button
          className="btn"
          type="button"
          onClick={() => emitToast(t("Edición disponible próximamente"))}
        >
          {t("Añadir servicio")}
        </button>
      </div>

      <div className="card">
        <h3>{t("Usuarios del equipo")}</h3>
        <div className="form-grid form-grid-2">
          <label className="form-field">
            {t("Nombre")}
            <input
              value={userDraft.name}
              onChange={(event) =>
                setUserDraft((prev) => ({
                  ...prev,
                  name: event.target.value,
                }))
              }
            />
          </label>
          <label className="form-field">
            {t("Correo")}
            <input
              type="email"
              value={userDraft.email}
              onChange={(event) =>
                setUserDraft((prev) => ({
                  ...prev,
                  email: event.target.value,
                }))
              }
            />
          </label>
          <label className="form-field">
            {t("Rol")}
            <select
              value={userDraft.role}
              onChange={(event) =>
                setUserDraft((prev) => ({
                  ...prev,
                  role: event.target.value,
                }))
              }
            >
              <option value="manager">{t("Gestor")}</option>
              <option value="staff">{t("Personal")}</option>
              <option value="assistant">{t("Asistente")}</option>
              <option value="patient">{t("Paciente")}</option>
            </select>
          </label>
          <label className="form-field">
            {t("Estado")}
            <select
              value={userDraft.status}
              onChange={(event) =>
                setUserDraft((prev) => ({
                  ...prev,
                  status: event.target.value,
                }))
              }
            >
              <option value="active">{t("Activo")}</option>
              <option value="inactive">{t("Inactivo")}</option>
            </select>
          </label>
          <label className="form-field">
            {t("Contraseña inicial")}
            <input
              type="password"
              value={userDraft.password}
              onChange={(event) =>
                setUserDraft((prev) => ({
                  ...prev,
                  password: event.target.value,
                }))
              }
            />
          </label>
          <label className="form-field">
            {t("Forzar cambio de contraseña")}
            <select
              value={userDraft.mustChangePassword ? "yes" : "no"}
              onChange={(event) =>
                setUserDraft((prev) => ({
                  ...prev,
                  mustChangePassword: event.target.value === "yes",
                }))
              }
            >
              <option value="yes">{t("Sí")}</option>
              <option value="no">{t("No")}</option>
            </select>
          </label>
        </div>
        {userError ? <div className="error-banner">{userError}</div> : null}
        <button
          className="btn primary"
          type="button"
          disabled={!userDraft.email || !userDraft.password || userBusy}
          onClick={handleCreateUser}
        >
          {userBusy ? t("Guardando...") : t("Crear usuario")}
        </button>

        <div className="table" style={{ marginTop: "16px" }}>
          <div className="table-header">
            <span>{t("Usuario")}</span>
            <span>{t("Rol")}</span>
            <span>{t("Estado")}</span>
            <span>{t("Acciones")}</span>
          </div>
          {users.length === 0 ? (
            <div className="table-row">
              <span className="muted">{t("Sin usuarios aún")}</span>
              <span>—</span>
              <span>—</span>
              <span>—</span>
            </div>
          ) : (
            users.map((row) => (
              <div key={row.id} className="table-row">
                <span>
                  <strong>{row.name || row.email}</strong>
                  <span className="muted" style={{ display: "block" }}>
                    {row.email}
                  </span>
                </span>
                <span>
                  <select
                    value={row.role || "staff"}
                    onChange={(event) =>
                      updateUserLocal(row.id, { role: event.target.value })
                    }
                  >
                    <option value="manager">{t("Gestor")}</option>
                    <option value="staff">{t("Personal")}</option>
                    <option value="assistant">{t("Asistente")}</option>
                    <option value="patient">{t("Paciente")}</option>
                  </select>
                </span>
                <span>
                  <select
                    value={row.status || "active"}
                    onChange={(event) =>
                      updateUserLocal(row.id, { status: event.target.value })
                    }
                  >
                    <option value="active">{t("Activo")}</option>
                    <option value="inactive">{t("Inactivo")}</option>
                  </select>
                </span>
                <span className="table-actions">
                  <button
                    className="btn"
                    type="button"
                    disabled={userBusy}
                    onClick={() => handleUpdateUser(row.id)}
                  >
                    {t("Guardar")}
                  </button>
                  <button
                    className="btn"
                    type="button"
                    disabled={userBusy}
                    onClick={() => handleResetPassword(row.id)}
                  >
                    {t("Reset pass")}
                  </button>
                  <button
                    className="btn danger"
                    type="button"
                    disabled={userBusy}
                    onClick={() => handleDeleteUser(row.id)}
                  >
                    {t("Eliminar")}
                  </button>
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="grid two-columns">
        <div className="card">
          <h3>{t("Protocolos + FAQ")}</h3>
          {renderChecklist(protocolItems.concat(faqItems), [
            "Endodoncia · versión 1.3",
            "Implantología · revisión médica",
            "Urgencias · pendiente de validación",
            "FAQ seguros y financiación",
          ])}
          <button
            className="btn"
            type="button"
            onClick={() => emitToast(t("Edición disponible próximamente"))}
          >
            {t("Subir documento")}
          </button>
        </div>

        <div className="card">
          <h3>{t("Triaje inteligente")}</h3>
          {renderChecklist(triageItems, [
            "Dolor dental intenso",
            "Post-operatorio implante",
            "Blanqueamiento",
            "Urgencias pediátricas",
          ])}
          <button
            className="btn"
            type="button"
            onClick={() => emitToast(t("Edición disponible próximamente"))}
          >
            {t("Editar flujos")}
          </button>
        </div>
      </div>

      <div className="card">
        <h3>{t("Usuarios del equipo")}</h3>
        <div className="form-grid form-grid-2">
          <label className="form-field">
            {t("Nombre")}
            <input
              value={userDraft.name}
              onChange={(event) =>
                setUserDraft((prev) => ({
                  ...prev,
                  name: event.target.value,
                }))
              }
            />
          </label>
          <label className="form-field">
            {t("Correo")}
            <input
              type="email"
              value={userDraft.email}
              onChange={(event) =>
                setUserDraft((prev) => ({
                  ...prev,
                  email: event.target.value,
                }))
              }
            />
          </label>
          <label className="form-field">
            {t("Rol")}
            <select
              value={userDraft.role}
              onChange={(event) =>
                setUserDraft((prev) => ({
                  ...prev,
                  role: event.target.value,
                }))
              }
            >
              <option value="manager">{t("Gestor")}</option>
              <option value="staff">{t("Personal")}</option>
              <option value="assistant">{t("Asistente")}</option>
              <option value="patient">{t("Paciente")}</option>
            </select>
          </label>
          <label className="form-field">
            {t("Estado")}
            <select
              value={userDraft.status}
              onChange={(event) =>
                setUserDraft((prev) => ({
                  ...prev,
                  status: event.target.value,
                }))
              }
            >
              <option value="active">{t("Activo")}</option>
              <option value="inactive">{t("Inactivo")}</option>
            </select>
          </label>
          <label className="form-field">
            {t("Contraseña inicial")}
            <input
              type="password"
              value={userDraft.password}
              onChange={(event) =>
                setUserDraft((prev) => ({
                  ...prev,
                  password: event.target.value,
                }))
              }
            />
          </label>
          <label className="form-field">
            {t("Forzar cambio de contraseña")}
            <select
              value={userDraft.mustChangePassword ? "yes" : "no"}
              onChange={(event) =>
                setUserDraft((prev) => ({
                  ...prev,
                  mustChangePassword: event.target.value === "yes",
                }))
              }
            >
              <option value="yes">{t("Sí")}</option>
              <option value="no">{t("No")}</option>
            </select>
          </label>
        </div>
        {userError ? <div className="error-banner">{userError}</div> : null}
        <button
          className="btn primary"
          type="button"
          disabled={!userDraft.email || !userDraft.password || userBusy}
          onClick={handleCreateUser}
        >
          {userBusy ? t("Guardando...") : t("Crear usuario")}
        </button>

        <div className="table" style={{ marginTop: "16px" }}>
          <div className="table-header">
            <span>{t("Usuario")}</span>
            <span>{t("Rol")}</span>
            <span>{t("Estado")}</span>
            <span>{t("Acciones")}</span>
          </div>
          {users.length === 0 ? (
            <div className="table-row">
              <span className="muted">{t("Sin usuarios aún")}</span>
              <span>—</span>
              <span>—</span>
              <span>—</span>
            </div>
          ) : (
            users.map((row) => (
              <div key={row.id} className="table-row">
                <span>
                  <strong>{row.name || row.email}</strong>
                  <span className="muted" style={{ display: "block" }}>
                    {row.email}
                  </span>
                </span>
                <span>
                  <select
                    value={row.role || "staff"}
                    onChange={(event) =>
                      updateUserLocal(row.id, { role: event.target.value })
                    }
                  >
                    <option value="manager">{t("Gestor")}</option>
                    <option value="staff">{t("Personal")}</option>
                    <option value="assistant">{t("Asistente")}</option>
                    <option value="patient">{t("Paciente")}</option>
                  </select>
                </span>
                <span>
                  <select
                    value={row.status || "active"}
                    onChange={(event) =>
                      updateUserLocal(row.id, { status: event.target.value })
                    }
                  >
                    <option value="active">{t("Activo")}</option>
                    <option value="inactive">{t("Inactivo")}</option>
                  </select>
                </span>
                <span className="table-actions">
                  <button
                    className="btn"
                    type="button"
                    disabled={userBusy}
                    onClick={() => handleUpdateUser(row.id)}
                  >
                    {t("Guardar")}
                  </button>
                  <button
                    className="btn"
                    type="button"
                    disabled={userBusy}
                    onClick={() => handleResetPassword(row.id)}
                  >
                    {t("Reset pass")}
                  </button>
                  <button
                    className="btn danger"
                    type="button"
                    disabled={userBusy}
                    onClick={() => handleDeleteUser(row.id)}
                  >
                    {t("Eliminar")}
                  </button>
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="grid two-columns">
        <div className="card">
          <h3>{t("Plantillas de informe")}</h3>
          <div className="table">
            <div className="table-header">
              <span>{t("Plantilla")}</span>
              <span>{t("Especialidad")}</span>
              <span>{t("Estado")}</span>
            </div>
            {reportItems.length === 0 ? (
              <div className="table-row">
                <span className="muted">{t("Sin plantillas aún")}</span>
                <span>—</span>
                <span className="tag warning">{t("Pendiente")}</span>
              </div>
            ) : (
              reportItems.map((row) => (
                <div key={row.id} className="table-row">
                  <span>{row.name || "—"}</span>
                  <span>{row.specialty || "—"}</span>
                  <span className="tag warning">
                    {row.status || t("Revisión")}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <h3>{t("Cumplimiento y guardrails")}</h3>
          <ul className="checklist">
            <li className="done">Disclaimer clínico visible</li>
            <li className="done">No diagnóstico automático</li>
            <li className="done">Cifrado y retención</li>
            <li>Pendiente: DPA proveedores externos</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
