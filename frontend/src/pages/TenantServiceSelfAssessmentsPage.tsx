import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { DataTable } from "../components/DataTable";
import { useI18n } from "../i18n/I18nProvider";
import { emitToast } from "../toast";
import type { SelfAssessmentDetail, SelfAssessmentSummary } from "../types";

const buildEmptyItem = () => ({
  question: "",
  answer: "",
  score: "3",
  evidence: "",
});

const emptyForm = {
  title: "",
  assessmentType: "compliance",
  framework: "",
  notes: "",
  includeReport: true,
  items: [buildEmptyItem()],
};

type TenantServiceSelfAssessmentsPageProps = {
  defaultServiceCode?: string;
};

export function TenantServiceSelfAssessmentsPage({
  defaultServiceCode,
}: TenantServiceSelfAssessmentsPageProps = {}) {
  const params = useParams();
  const tenantId = params.tenantId;
  const serviceCode = params.serviceCode ?? defaultServiceCode;
  const navigate = useNavigate();
  const { t } = useI18n();

  const [assessments, setAssessments] = useState<SelfAssessmentSummary[]>([]);
  const [selected, setSelected] = useState<SelfAssessmentDetail | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAssessments = async () => {
    if (!tenantId || !serviceCode) return;
    setError(null);
    try {
      const data = (await api.listTenantServiceSelfAssessments(
        tenantId,
        serviceCode,
      )) as SelfAssessmentSummary[];
      setAssessments(data || []);
    } catch (err: any) {
      setError(err.message || t("No se pudieron cargar las autoevaluaciones"));
    }
  };

  const loadDetail = async (assessmentId: string) => {
    if (!tenantId || !serviceCode) return;
    setBusy(true);
    setError(null);
    try {
      const detail = (await api.getTenantServiceSelfAssessment(
        tenantId,
        serviceCode,
        assessmentId,
      )) as SelfAssessmentDetail;
      setSelected(detail);
    } catch (err: any) {
      setError(err.message || t("No se pudo cargar la autoevaluacion"));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!tenantId || !serviceCode) return;
    loadAssessments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, serviceCode]);

  const handleItemChange = (
    index: number,
    key: "question" | "answer" | "score" | "evidence",
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
      assessmentType: form.assessmentType,
      framework: form.framework || undefined,
      notes: form.notes || undefined,
      includeReport: form.includeReport,
      items: form.items
        .filter((item) => item.question.trim().length > 0)
        .map((item) => ({
          question: item.question,
          answer: item.answer,
          evidence: item.evidence,
          score: item.score ? Number(item.score) : undefined,
        })),
    };

    try {
      const detail = (await api.createTenantServiceSelfAssessment(
        tenantId,
        serviceCode,
        payload,
      )) as SelfAssessmentDetail;
      setSelected(detail);
      await loadAssessments();
      emitToast(t("Autoevaluacion creada"));
    } catch (err: any) {
      setError(err.message || t("No se pudo crear la autoevaluacion"));
    } finally {
      setBusy(false);
    }
  };

  const columns = useMemo(
    () => [
      { key: "title", label: t("Titulo"), sortable: true },
      { key: "assessmentType", label: t("Tipo"), sortable: true },
      { key: "status", label: t("Estado"), sortable: true },
      {
        key: "createdAt",
        label: t("Creado"),
        sortable: true,
        render: (row: SelfAssessmentSummary) =>
          row.createdAt ? new Date(row.createdAt).toLocaleString() : "—",
      },
      {
        key: "actions",
        label: t("Acciones"),
        render: (row: SelfAssessmentSummary) => (
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
        <div className="muted">{t("Selecciona un servicio para gestionarlo.")}</div>
      </div>
    );
  }

  return (
    <div className="card full-width">
      <div className="card-header">
        <div>
          <div className="eyebrow">{t("Autoevaluacion inteligente")}</div>
          <h2>{t("Autoevaluaciones")}</h2>
          <p className="muted">
            {t(
              "Genera informes de cumplimiento o madurez a partir de cuestionarios dinamicos.",
            )}
          </p>
        </div>
        <div className="row-actions">
          <button className="btn" onClick={() => navigate(`/clients/${tenantId}`)}>
            {t("Volver al tenant")}
          </button>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="row g-4">
        <div className="col-12 col-xl-6">
          <div className="card">
            <h4>{t("Nueva autoevaluacion")}</h4>
            <div className="row g-3 form-grid-13">
              <div className="col-12 col-md-6">
                <label>
                  {t("Tipo")}
                  <select
                    className="form-select"
                    value={form.assessmentType}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        assessmentType: event.target.value,
                      }))
                    }
                  >
                    <option value="compliance">{t("Cumplimiento")}</option>
                    <option value="maturity">{t("Madurez digital")}</option>
                    <option value="academic">{t("Autoevaluacion academica")}</option>
                    <option value="safety">{t("Riesgos laborales")}</option>
                    <option value="esg">{t("Evaluacion ESG")}</option>
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
                    placeholder={t("Ejemplo: Auditoria ISO 27001")}
                  />
                </label>
              </div>
              <div className="col-12">
                <label>
                  {t("Marco o normativa")}
                  <input
                    className="form-control"
                    value={form.framework}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, framework: event.target.value }))
                    }
                    placeholder={t("ISO 27001, ENS, GDPR...")}
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

            <h5>{t("Criterios")}</h5>
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
                            placeholder={t("Ej: Existe un procedimiento documentado...")}
                          />
                        </label>
                      </div>
                      <div className="col-12">
                        <label>
                          {t("Respuesta")}
                          <textarea
                            className="form-control"
                            rows={3}
                            value={item.answer}
                            onChange={(event) =>
                              handleItemChange(index, "answer", event.target.value)
                            }
                          />
                        </label>
                      </div>
                      <div className="col-12 col-md-4">
                        <label>
                          {t("Puntuacion (0-5)")}
                          <input
                            className="form-control"
                            type="number"
                            min={0}
                            max={5}
                            value={item.score}
                            onChange={(event) =>
                              handleItemChange(index, "score", event.target.value)
                            }
                          />
                        </label>
                      </div>
                      <div className="col-12 col-md-8">
                        <label>
                          {t("Evidencia")}
                          <input
                            className="form-control"
                            value={item.evidence}
                            onChange={(event) =>
                              handleItemChange(index, "evidence", event.target.value)
                            }
                            placeholder={t("Referencia, documento, enlace...")}
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
                        {t("Eliminar criterio")}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              <div className="col-12">
                <button className="btn" type="button" onClick={addItem}>
                  {t("Añadir criterio")}
                </button>
              </div>
            </div>

            <div className="section-divider" />

            <label className="checkbox">
              <input
                type="checkbox"
                checked={form.includeReport}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    includeReport: event.target.checked,
                  }))
                }
              />
              {t("Generar informe con IA")}
            </label>

            <div className="form-actions">
              <button
                className="btn primary"
                onClick={handleSubmit}
                disabled={busy}
              >
                {busy ? t("Generando...") : t("Crear autoevaluacion")}
              </button>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-6">
          <div className="card">
            <h4>{t("Autoevaluaciones recientes")}</h4>
            {assessments.length === 0 ? (
              <div className="muted">{t("Aun no hay autoevaluaciones.")}</div>
            ) : (
              <DataTable
                columns={columns}
                data={assessments}
                getRowId={(row) => row.id}
                pageSize={6}
                filterKeys={["title", "assessmentType", "status"]}
              />
            )}
          </div>

          {selected && (
            <div className="card">
              <h4>{selected.summary.title || t("Detalle")}</h4>
              <div className="muted">
                {t("Nivel")}: {selected.result?.level ?? "—"} · {t("Score")}:
                {" "}
                {selected.result?.scorePercent ?? "—"}%
              </div>
              {selected.report && (
                <div className="mt-3">
                  <h5>{t("Informe")}</h5>
                  <pre className="code-block">{selected.report}</pre>
                </div>
              )}
              {selected.result?.recommendations && (
                <div className="mt-3">
                  <h5>{t("Recomendaciones")}</h5>
                  <ul className="plain-list">
                    {selected.result.recommendations.map((item: string, idx: number) => (
                      <li key={`rec-${idx}`}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {selected.result?.gaps && (
                <div className="mt-3">
                  <h5>{t("Brechas")}</h5>
                  <ul className="plain-list">
                    {selected.result.gaps.map((gap: any, idx: number) => (
                      <li key={`gap-${idx}`}>
                        {gap.question} ({gap.score})
                      </li>
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
