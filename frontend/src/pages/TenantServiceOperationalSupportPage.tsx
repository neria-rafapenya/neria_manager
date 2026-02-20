import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { DataTable } from "../components/DataTable";
import { useI18n } from "../i18n/I18nProvider";
import { emitToast } from "../toast";
import type {
  OperationalSupportDetail,
  OperationalSupportSummary,
} from "../types";

const emptyForm = {
  title: "",
  entryType: "draft",
  intent: "soporte",
  question: "",
  context: "",
  template: "",
};

type TenantServiceOperationalSupportPageProps = {
  defaultServiceCode?: string;
};

export function TenantServiceOperationalSupportPage({
  defaultServiceCode,
}: TenantServiceOperationalSupportPageProps = {}) {
  const params = useParams();
  const tenantId = params.tenantId;
  const serviceCode = params.serviceCode ?? defaultServiceCode;
  const navigate = useNavigate();
  const { t } = useI18n();

  const [entries, setEntries] = useState<OperationalSupportSummary[]>([]);
  const [selected, setSelected] = useState<OperationalSupportDetail | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEntries = async () => {
    if (!tenantId || !serviceCode) return;
    setError(null);
    try {
      const data = (await api.listTenantServiceOperationalSupport(
        tenantId,
        serviceCode,
      )) as OperationalSupportSummary[];
      setEntries(data || []);
    } catch (err: any) {
      setError(err.message || t("No se pudieron cargar los borradores"));
    }
  };

  const loadDetail = async (entryId: string) => {
    if (!tenantId || !serviceCode) return;
    setBusy(true);
    setError(null);
    try {
      const detail = (await api.getTenantServiceOperationalSupport(
        tenantId,
        serviceCode,
        entryId,
      )) as OperationalSupportDetail;
      setSelected(detail);
    } catch (err: any) {
      setError(err.message || t("No se pudo cargar el detalle"));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!tenantId || !serviceCode) return;
    loadEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, serviceCode]);

  const handleSubmit = async () => {
    if (!tenantId || !serviceCode) {
      setError(t("Selecciona un servicio para continuar."));
      return;
    }
    setBusy(true);
    setError(null);

    const payload = {
      title: form.title || undefined,
      entryType: form.entryType,
      intent: form.intent || undefined,
      question: form.question || undefined,
      context: form.context || undefined,
      template: form.template || undefined,
    };

    try {
      const detail = (await api.createTenantServiceOperationalSupport(
        tenantId,
        serviceCode,
        payload,
      )) as OperationalSupportDetail;
      setSelected(detail);
      await loadEntries();
      emitToast(t("Entrada creada"));
      if (form.entryType === "draft") {
        setForm((prev) => ({ ...prev, question: "", context: "" }));
      }
    } catch (err: any) {
      setError(err.message || t("No se pudo crear la entrada"));
    } finally {
      setBusy(false);
    }
  };

  const columns = useMemo(
    () => [
      { key: "title", label: t("Titulo"), sortable: true },
      { key: "entryType", label: t("Tipo"), sortable: true },
      { key: "status", label: t("Estado"), sortable: true },
      {
        key: "createdAt",
        label: t("Creado"),
        sortable: true,
        render: (row: OperationalSupportSummary) =>
          row.createdAt ? new Date(row.createdAt).toLocaleString() : "—",
      },
      {
        key: "actions",
        label: t("Acciones"),
        render: (row: OperationalSupportSummary) => (
          <button
            className="btn small"
            type="button"
            onClick={() => loadDetail(row.id)}
            disabled={busy}
          >
            {t("Ver")}
          </button>
        ),
      },
    ],
    [t, busy],
  );

  if (!tenantId || !serviceCode) {
    return (
      <div className="card">
        <div className="muted">
          {t("Selecciona un servicio para gestionarlo.")}
        </div>
      </div>
    );
  }

  return (
    <div className="card full-width">
      <div className="card-header">
        <div>
          <div className="eyebrow">{t("Soporte operativo")}</div>
          <h2>{t("Borradores y plantillas")}</h2>
          <p className="muted">
            {t(
              "Genera borradores de respuesta y gestiona plantillas internas sin datos sensibles.",
            )}
          </p>
        </div>
        <div className="row-actions">
          <button className="btn" onClick={() => navigate(`/clients/${tenantId}/services/${serviceCode}`)}>
            {t("Volver al servicio")}
          </button>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="row g-4">
        <div className="col-12 col-xl-6">
          <div className="card">
            <h4>{t("Nueva entrada")}</h4>
            <div className="row g-3 form-grid-13">
              <div className="col-12 col-md-6">
                <label>
                  {t("Tipo de entrada")}
                  <select
                    className="form-select"
                    value={form.entryType}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        entryType: event.target.value,
                      }))
                    }
                  >
                    <option value="draft">{t("Borrador")}</option>
                    <option value="template">{t("Plantilla")}</option>
                  </select>
                </label>
              </div>
              <div className="col-12 col-md-6">
                <label>
                  {t("Intencion")}
                  <input
                    className="form-control"
                    value={form.intent}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, intent: event.target.value }))
                    }
                    placeholder={t("Ej: normativa, producto, respuesta")}
                  />
                </label>
              </div>
              <div className="col-12">
                <label>
                  {t("Titulo")}
                  <input
                    className="form-control"
                    value={form.title}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, title: event.target.value }))
                    }
                    placeholder={t("Ejemplo: Respuesta FAQ hipotecas")}
                  />
                </label>
              </div>
              {form.entryType === "draft" && (
                <>
                  <div className="col-12">
                    <label>
                      {t("Pregunta")}
                      <input
                        className="form-control"
                        value={form.question}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            question: event.target.value,
                          }))
                        }
                        placeholder={t("Ej: Puedo optar a una hipoteca?")}
                      />
                    </label>
                  </div>
                  <div className="col-12">
                    <label>
                      {t("Contexto interno (opcional)")}
                      <textarea
                        className="form-control"
                        rows={4}
                        value={form.context}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            context: event.target.value,
                          }))
                        }
                        placeholder={t("Fragmentos de documentacion o notas internas")}
                      />
                    </label>
                  </div>
                  <div className="col-12">
                    <label>
                      {t("Plantilla sugerida (opcional)")}
                      <textarea
                        className="form-control"
                        rows={3}
                        value={form.template}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            template: event.target.value,
                          }))
                        }
                        placeholder={t("Estructura base para la respuesta")}
                      />
                    </label>
                  </div>
                </>
              )}
              {form.entryType === "template" && (
                <div className="col-12">
                  <label>
                    {t("Contenido de la plantilla")}
                    <textarea
                      className="form-control"
                      rows={6}
                      value={form.template}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          template: event.target.value,
                        }))
                      }
                      placeholder={t("Escribe el texto de la plantilla")}
                    />
                  </label>
                </div>
              )}
            </div>

            <div className="form-actions">
              <button
                className="btn primary"
                onClick={handleSubmit}
                disabled={
                  busy ||
                  (form.entryType === "draft" && !form.question.trim()) ||
                  (form.entryType === "template" && !form.template.trim())
                }
              >
                {busy ? t("Generando...") : t("Guardar")}
              </button>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-6">
          <div className="card">
            <h4>{t("Historial")}</h4>
            {entries.length === 0 ? (
              <div className="muted">{t("Aun no hay entradas.")}</div>
            ) : (
              <DataTable
                columns={columns}
                data={entries}
                getRowId={(row) => row.id}
                pageSize={6}
                filterKeys={["title", "entryType", "status"]}
              />
            )}
          </div>

          {selected && (
            <div className="card">
              <h4>{selected.summary.title || t("Detalle")}</h4>
              <div className="muted">
                {t("Tipo")}: {selected.summary.entryType} · {t("Estado")}: {selected.summary.status}
              </div>
              {selected.report && (
                <div className="mt-3">
                  <h5>{t("Contenido")}</h5>
                  <pre className="code-block">{selected.report}</pre>
                </div>
              )}
              {selected.result?.warnings && (
                <div className="mt-3">
                  <h5>{t("Avisos")}</h5>
                  <ul className="plain-list">
                    {selected.result.warnings.map((item: string, idx: number) => (
                      <li key={`warn-${idx}`}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {selected.result?.questions && (
                <div className="mt-3">
                  <h5>{t("Preguntas sugeridas")}</h5>
                  <ul className="plain-list">
                    {selected.result.questions.map((item: string, idx: number) => (
                      <li key={`q-${idx}`}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
