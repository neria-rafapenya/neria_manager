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
      ] = await Promise.all([
        api.getClinicFlowSettings(tenantId, serviceCode),
        api.listClinicFlowServices(tenantId, serviceCode),
        api.listClinicFlowProtocols(tenantId, serviceCode),
        api.listClinicFlowFaq(tenantId, serviceCode),
        api.listClinicFlowTriageFlows(tenantId, serviceCode),
        api.listClinicFlowReportTemplates(tenantId, serviceCode),
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
