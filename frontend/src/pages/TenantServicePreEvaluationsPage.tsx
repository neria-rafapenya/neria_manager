import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { DataTable } from "../components/DataTable";
import { useI18n } from "../i18n/I18nProvider";
import { emitToast } from "../toast";
import type { PreEvaluationDetail, PreEvaluationSummary } from "../types";

const buildEmptyItem = () => ({
  question: "",
  answer: "",
});

const defaultItems = [
  { question: "Ingresos mensuales netos", answer: "" },
  { question: "Antiguedad laboral", answer: "" },
  { question: "Tipo de contrato", answer: "" },
  { question: "Importe solicitado", answer: "" },
  { question: "Ahorro o aportacion inicial", answer: "" },
  { question: "Deuda actual aproximada", answer: "" },
  { question: "Historial crediticio (incidencias)", answer: "" },
];

const buildDefaultItems = () => defaultItems.map((item) => ({ ...item }));

const emptyForm = {
  title: "",
  productType: "hipoteca",
  notes: "",
  items: buildDefaultItems(),
};

type TenantServicePreEvaluationsPageProps = {
  defaultServiceCode?: string;
};

export function TenantServicePreEvaluationsPage({
  defaultServiceCode,
}: TenantServicePreEvaluationsPageProps = {}) {
  const params = useParams();
  const tenantId = params.tenantId;
  const serviceCode = params.serviceCode ?? defaultServiceCode;
  const navigate = useNavigate();
  const { t } = useI18n();

  const [evaluations, setEvaluations] = useState<PreEvaluationSummary[]>([]);
  const [selected, setSelected] = useState<PreEvaluationDetail | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEvaluations = async () => {
    if (!tenantId || !serviceCode) return;
    setError(null);
    try {
      const data = (await api.listTenantServicePreEvaluations(
        tenantId,
        serviceCode,
      )) as PreEvaluationSummary[];
      setEvaluations(data || []);
    } catch (err: any) {
      setError(err.message || t("No se pudieron cargar las pre-evaluaciones"));
    }
  };

  const loadDetail = async (evaluationId: string) => {
    if (!tenantId || !serviceCode) return;
    setBusy(true);
    setError(null);
    try {
      const detail = (await api.getTenantServicePreEvaluation(
        tenantId,
        serviceCode,
        evaluationId,
      )) as PreEvaluationDetail;
      setSelected(detail);
    } catch (err: any) {
      setError(err.message || t("No se pudo cargar la pre-evaluacion"));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!tenantId || !serviceCode) return;
    loadEvaluations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, serviceCode]);

  const handleItemChange = (
    index: number,
    key: "question" | "answer",
    value: string,
  ) => {
    setForm((prev) => {
      const next = [...prev.items];
      next[index] = { ...next[index], [key]: value };
      return { ...prev, items: next };
    });
  };

  const addItem = () => {
    setForm((prev) => ({ ...prev, items: [...prev.items, buildEmptyItem()] }));
  };

  const removeItem = (index: number) => {
    setForm((prev) => {
      const next = prev.items.filter((_, idx) => idx !== index);
      return { ...prev, items: next.length ? next : [buildEmptyItem()] };
    });
  };

  const handleSubmit = async () => {
    if (!tenantId || !serviceCode) {
      setError(t("Selecciona un servicio para continuar."));
      return;
    }
    setBusy(true);
    setError(null);

    const payload = {
      title: form.title || undefined,
      productType: form.productType,
      notes: form.notes || undefined,
      items: form.items
        .filter((item) => item.question.trim().length > 0)
        .map((item) => ({
          question: item.question,
          answer: item.answer,
        })),
    };

    try {
      const detail = (await api.createTenantServicePreEvaluation(
        tenantId,
        serviceCode,
        payload,
      )) as PreEvaluationDetail;
      setSelected(detail);
      await loadEvaluations();
      emitToast(t("Pre-evaluacion creada"));
    } catch (err: any) {
      setError(err.message || t("No se pudo crear la pre-evaluacion"));
    } finally {
      setBusy(false);
    }
  };

  const columns = useMemo(
    () => [
      { key: "title", label: t("Titulo"), sortable: true },
      { key: "productType", label: t("Producto"), sortable: true },
      { key: "status", label: t("Estado"), sortable: true },
      {
        key: "createdAt",
        label: t("Creado"),
        sortable: true,
        render: (row: PreEvaluationSummary) =>
          row.createdAt ? new Date(row.createdAt).toLocaleString() : "—",
      },
      {
        key: "actions",
        label: t("Acciones"),
        render: (row: PreEvaluationSummary) => (
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
          <div className="eyebrow">{t("Pre-evaluacion")}</div>
          <h2>{t("Motor de reglas simulado")}</h2>
          <p className="muted">
            {t(
              "Simula elegibilidad con preguntas generales. No usa scoring real ni consulta bases de datos.",
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
            <h4>{t("Nueva pre-evaluacion")}</h4>
            <div className="row g-3 form-grid-13">
              <div className="col-12 col-md-6">
                <label>
                  {t("Producto")}
                  <select
                    className="form-select"
                    value={form.productType}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        productType: event.target.value,
                      }))
                    }
                  >
                    <option value="hipoteca">{t("Hipoteca")}</option>
                    <option value="prestamo">{t("Prestamo")}</option>
                    <option value="tarjeta">{t("Tarjeta")}</option>
                    <option value="general">{t("General")}</option>
                  </select>
                </label>
              </div>
              <div className="col-12 col-md-6">
                <label>
                  {t("Titulo")}
                  <input
                    className="form-control"
                    value={form.title}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, title: event.target.value }))
                    }
                    placeholder={t("Ejemplo: Hipoteca vivienda habitual")}
                  />
                </label>
              </div>
              <div className="col-12">
                <label>
                  {t("Notas")}
                  <textarea
                    className="form-control"
                    rows={3}
                    value={form.notes}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, notes: event.target.value }))
                    }
                  />
                </label>
              </div>
            </div>

            <div className="section-divider" />

            <h5>{t("Preguntas generales")}</h5>
            <div className="row g-3">
              {form.items.map((item, index) => (
                <div className="col-12" key={`item-${index}`}>
                  <div className="card muted-card">
                    <div className="row g-3">
                      <div className="col-12">
                        <label>
                          {t("Pregunta")}
                          <input
                            className="form-control"
                            value={item.question}
                            onChange={(event) =>
                              handleItemChange(index, "question", event.target.value)
                            }
                            placeholder={t("Ej: ¿Ingresos mensuales?")}
                          />
                        </label>
                      </div>
                      <div className="col-12">
                        <label>
                          {t("Respuesta")}
                          <textarea
                            className="form-control"
                            rows={2}
                            value={item.answer}
                            onChange={(event) =>
                              handleItemChange(index, "answer", event.target.value)
                            }
                          />
                        </label>
                      </div>
                    </div>
                    <div className="row-actions mt-2">
                      <button
                        className="btn small"
                        type="button"
                        onClick={() => removeItem(index)}
                      >
                        {t("Eliminar pregunta")}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              <div className="col-12">
                <button className="btn" type="button" onClick={addItem}>
                  {t("Anadir pregunta")}
                </button>
              </div>
            </div>

            <div className="form-actions">
              <button
                className="btn primary"
                onClick={handleSubmit}
                disabled={busy}
              >
                {busy ? t("Generando...") : t("Crear pre-evaluacion")}
              </button>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-6">
          <div className="card">
            <h4>{t("Pre-evaluaciones recientes")}</h4>
            {evaluations.length === 0 ? (
              <div className="muted">
                {t("Aun no hay pre-evaluaciones.")}
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={evaluations}
                getRowId={(row) => row.id}
                pageSize={6}
                filterKeys={["title", "productType", "status"]}
              />
            )}
          </div>

          {selected && (
            <div className="card">
              <h4>{selected.summary.title || t("Detalle")}</h4>
              <div className="muted">
                {t("Probabilidad")}: {selected.result?.probability ?? "—"}% · {t("Decision")}: {selected.result?.decision ?? "—"}
              </div>
              {selected.report && (
                <div className="mt-3">
                  <h5>{t("Explicacion")}</h5>
                  <pre className="code-block">{selected.report}</pre>
                </div>
              )}
              {selected.result?.factors && (
                <div className="mt-3">
                  <h5>{t("Factores")}</h5>
                  <ul className="plain-list">
                    {selected.result.factors.map((item: string, idx: number) => (
                      <li key={`factor-${idx}`}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {selected.result?.nextSteps && (
                <div className="mt-3">
                  <h5>{t("Siguientes pasos")}</h5>
                  <ul className="plain-list">
                    {selected.result.nextSteps.map((item: string, idx: number) => (
                      <li key={`next-${idx}`}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {selected.result?.disclaimer && (
                <div className="info-banner mt-3">{selected.result.disclaimer}</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
