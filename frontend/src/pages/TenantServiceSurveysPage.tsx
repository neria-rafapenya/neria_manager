import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { DataTable } from "../components/DataTable";
import { useI18n } from "../i18n/I18nProvider";
import { emitToast } from "../toast";
import {
  SurveyDetail,
  SurveyInsight,
  SurveyQuestion,
  SurveyResponseDetail,
  SurveyResponseSummary,
  SurveySummary,
} from "../types";

type SurveyFormState = {
  id?: string;
  title: string;
  description: string;
  status: string;
  language: string;
  allowMultiple: boolean;
  collectEmail: boolean;
  anonymous: boolean;
  startAt: string;
  endAt: string;
  welcomeText: string;
  thankYouText: string;
};

type QuestionFormState = {
  id?: string;
  label: string;
  description: string;
  type: string;
  required: boolean;
  orderIndex: number;
  optionsText: string;
  scaleMin: string;
  scaleMax: string;
  scaleMinLabel: string;
  scaleMaxLabel: string;
};

const emptySurveyForm: SurveyFormState = {
  title: "",
  description: "",
  status: "draft",
  language: "es",
  allowMultiple: true,
  collectEmail: false,
  anonymous: true,
  startAt: "",
  endAt: "",
  welcomeText: "",
  thankYouText: "",
};

const emptyQuestionForm: QuestionFormState = {
  label: "",
  description: "",
  type: "text",
  required: false,
  orderIndex: 1,
  optionsText: "",
  scaleMin: "",
  scaleMax: "",
  scaleMinLabel: "",
  scaleMaxLabel: "",
};

type TenantServiceSurveysPageProps = {
  defaultServiceCode?: string;
};

export function TenantServiceSurveysPage({
  defaultServiceCode,
}: TenantServiceSurveysPageProps = {}) {
  const params = useParams();
  const tenantId = params.tenantId;
  const serviceCode = params.serviceCode ?? defaultServiceCode;
  const navigate = useNavigate();
  const { t } = useI18n();
  const [surveys, setSurveys] = useState<SurveySummary[]>([]);
  const [selectedSurvey, setSelectedSurvey] = useState<SurveyDetail | null>(null);
  const [surveyForm, setSurveyForm] = useState<SurveyFormState>(emptySurveyForm);
  const [questionForm, setQuestionForm] = useState<QuestionFormState>(emptyQuestionForm);
  const [surveyMode, setSurveyMode] = useState<"create" | "edit">("create");
  const [questionMode, setQuestionMode] = useState<"create" | "edit">("create");
  const [responses, setResponses] = useState<SurveyResponseSummary[]>([]);
  const [responseDetail, setResponseDetail] = useState<SurveyResponseDetail | null>(null);
  const [insights, setInsights] = useState<SurveyInsight[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toDateInputValue = (value?: string | null) => {
    if (!value) {
      return "";
    }
    return value.length >= 16 ? value.slice(0, 16) : value;
  };

  const toDatePayloadValue = (value?: string | null) => {
    if (!value) {
      return null;
    }
    if (value.length === 16) {
      return `${value}:00`;
    }
    return value;
  };

  const surveyPublicUrl = useMemo(() => {
    if (!selectedSurvey?.summary.publicCode) {
      return "";
    }
    return `${window.location.origin}/public/surveys/${selectedSurvey.summary.publicCode}`;
  }, [selectedSurvey]);

  useEffect(() => {
    if (!tenantId || !serviceCode) {
      return;
    }
    loadSurveys();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, serviceCode]);

  const loadSurveys = async () => {
    if (!tenantId || !serviceCode) {
      return;
    }
    setError(null);
    try {
      const data = (await api.listTenantServiceSurveys(
        tenantId,
        serviceCode,
      )) as SurveySummary[];
      setSurveys(data);
      if (data.length === 0) {
        setSelectedSurvey(null);
      }
    } catch (err: any) {
      setError(err.message || t("No se pudieron cargar las encuestas"));
    }
  };

  const loadSurveyDetail = async (surveyId: string) => {
    if (!tenantId || !serviceCode) {
      return;
    }
    setError(null);
    try {
      const data = (await api.getTenantServiceSurvey(
        tenantId,
        serviceCode,
        surveyId,
      )) as SurveyDetail;
      setSelectedSurvey(data);
      setSurveyMode("edit");
      setSurveyForm({
        id: data.summary.id,
        title: data.summary.title || "",
        description: data.summary.description || "",
        status: data.summary.status || "draft",
        language: data.summary.language || "es",
        allowMultiple: Boolean(data.summary.allowMultiple),
        collectEmail: Boolean(data.summary.collectEmail),
        anonymous: Boolean(data.summary.anonymous),
        startAt: toDateInputValue(data.summary.startAt),
        endAt: toDateInputValue(data.summary.endAt),
        welcomeText: data.summary.welcomeText || "",
        thankYouText: data.summary.thankYouText || "",
      });
      setQuestionForm({
        ...emptyQuestionForm,
        orderIndex:
          (data.questions?.reduce((max, item) => Math.max(max, item.orderIndex), 0) || 0) +
          1,
      });
      await loadResponses(surveyId);
      await loadInsights(surveyId);
    } catch (err: any) {
      setError(err.message || t("No se pudo cargar la encuesta"));
    }
  };

  const loadResponses = async (surveyId: string) => {
    if (!tenantId || !serviceCode) {
      return;
    }
    try {
      const data = (await api.listTenantServiceSurveyResponses(
        tenantId,
        serviceCode,
        surveyId,
      )) as SurveyResponseSummary[];
      setResponses(data);
    } catch (err: any) {
      emitToast(err.message || t("No se pudieron cargar respuestas"), "error");
    }
  };

  const loadInsights = async (surveyId: string) => {
    if (!tenantId || !serviceCode) {
      return;
    }
    try {
      const data = (await api.listTenantServiceSurveyInsights(
        tenantId,
        serviceCode,
        surveyId,
      )) as SurveyInsight[];
      setInsights(data);
    } catch (err: any) {
      emitToast(err.message || t("No se pudieron cargar insights"), "error");
    }
  };

  const resetSurveyForm = () => {
    setSurveyForm(emptySurveyForm);
    setSurveyMode("create");
    setSelectedSurvey(null);
    setResponses([]);
    setInsights([]);
  };

  const handleSaveSurvey = async () => {
    if (!tenantId || !serviceCode) {
      return;
    }
    if (!surveyForm.title.trim()) {
      emitToast(t("El titulo es obligatorio."), "error");
      return;
    }
    setBusy(true);
    try {
      const payload = {
        title: surveyForm.title.trim(),
        description: surveyForm.description.trim() || null,
        status: surveyForm.status,
        language: surveyForm.language.trim() || null,
        allowMultiple: surveyForm.allowMultiple,
        collectEmail: surveyForm.collectEmail,
        anonymous: surveyForm.anonymous,
        startAt: toDatePayloadValue(surveyForm.startAt),
        endAt: toDatePayloadValue(surveyForm.endAt),
        welcomeText: surveyForm.welcomeText.trim() || null,
        thankYouText: surveyForm.thankYouText.trim() || null,
      };
      if (surveyMode === "create") {
        await api.createTenantServiceSurvey(tenantId, serviceCode, payload);
      } else if (surveyForm.id) {
        await api.updateTenantServiceSurvey(
          tenantId,
          serviceCode,
          surveyForm.id,
          payload,
        );
      }
      await loadSurveys();
      emitToast(t("Encuesta guardada."));
    } catch (err: any) {
      emitToast(err.message || t("No se pudo guardar la encuesta"), "error");
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteSurvey = async () => {
    if (!tenantId || !serviceCode || !surveyForm.id) {
      return;
    }
    setBusy(true);
    try {
      await api.deleteTenantServiceSurvey(tenantId, serviceCode, surveyForm.id);
      emitToast(t("Encuesta eliminada."));
      resetSurveyForm();
      await loadSurveys();
    } catch (err: any) {
      emitToast(err.message || t("No se pudo eliminar la encuesta"), "error");
    } finally {
      setBusy(false);
    }
  };

  const handleSaveQuestion = async () => {
    if (!tenantId || !serviceCode || !selectedSurvey) {
      return;
    }
    if (!questionForm.label.trim()) {
      emitToast(t("La pregunta es obligatoria."), "error");
      return;
    }
    const payload = {
      label: questionForm.label.trim(),
      description: questionForm.description.trim() || null,
      type: questionForm.type,
      required: questionForm.required,
      orderIndex: Number(questionForm.orderIndex) || 1,
      options: questionForm.optionsText
        ? questionForm.optionsText.split(",").map((item) => item.trim()).filter(Boolean)
        : [],
      scaleMin: questionForm.scaleMin ? Number(questionForm.scaleMin) : null,
      scaleMax: questionForm.scaleMax ? Number(questionForm.scaleMax) : null,
      scaleMinLabel: questionForm.scaleMinLabel.trim() || null,
      scaleMaxLabel: questionForm.scaleMaxLabel.trim() || null,
    };
    setBusy(true);
    try {
      if (questionMode === "create") {
        await api.createTenantServiceSurveyQuestion(
          tenantId,
          serviceCode,
          selectedSurvey.summary.id,
          payload,
        );
      } else if (questionForm.id) {
        await api.updateTenantServiceSurveyQuestion(
          tenantId,
          serviceCode,
          selectedSurvey.summary.id,
          questionForm.id,
          payload,
        );
      }
      await loadSurveyDetail(selectedSurvey.summary.id);
      setQuestionForm(emptyQuestionForm);
      setQuestionMode("create");
    } catch (err: any) {
      emitToast(err.message || t("No se pudo guardar la pregunta"), "error");
    } finally {
      setBusy(false);
    }
  };

  const handleEditQuestion = (question: SurveyQuestion) => {
    setQuestionMode("edit");
    setQuestionForm({
      id: question.id,
      label: question.label || "",
      description: question.description || "",
      type: question.type || "text",
      required: Boolean(question.required),
      orderIndex: question.orderIndex || 1,
      optionsText: question.options?.join(", ") || "",
      scaleMin: question.scaleMin != null ? String(question.scaleMin) : "",
      scaleMax: question.scaleMax != null ? String(question.scaleMax) : "",
      scaleMinLabel: question.scaleMinLabel || "",
      scaleMaxLabel: question.scaleMaxLabel || "",
    });
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!tenantId || !serviceCode || !selectedSurvey) {
      return;
    }
    setBusy(true);
    try {
      await api.deleteTenantServiceSurveyQuestion(
        tenantId,
        serviceCode,
        selectedSurvey.summary.id,
        questionId,
      );
      await loadSurveyDetail(selectedSurvey.summary.id);
    } catch (err: any) {
      emitToast(err.message || t("No se pudo eliminar la pregunta"), "error");
    } finally {
      setBusy(false);
    }
  };

  const handleSelectResponse = async (responseId: string) => {
    if (!tenantId || !serviceCode || !selectedSurvey) {
      return;
    }
    try {
      const data = (await api.getTenantServiceSurveyResponse(
        tenantId,
        serviceCode,
        selectedSurvey.summary.id,
        responseId,
      )) as SurveyResponseDetail;
      setResponseDetail(data);
    } catch (err: any) {
      emitToast(err.message || t("No se pudo cargar la respuesta"), "error");
    }
  };

  const handleExportCsv = async () => {
    if (!tenantId || !serviceCode || !selectedSurvey) {
      return;
    }
    try {
      const blob = await api.exportTenantServiceSurveyResponses(
        tenantId,
        serviceCode,
        selectedSurvey.summary.id,
      );
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `survey_${selectedSurvey.summary.id}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      emitToast(err.message || t("No se pudo exportar"), "error");
    }
  };

  const handleRunInsights = async () => {
    if (!tenantId || !serviceCode || !selectedSurvey) {
      return;
    }
    setBusy(true);
    try {
      await api.runTenantServiceSurveyInsights(
        tenantId,
        serviceCode,
        selectedSurvey.summary.id,
      );
      await loadInsights(selectedSurvey.summary.id);
      emitToast(t("Insights generados."));
    } catch (err: any) {
      emitToast(err.message || t("No se pudieron generar insights"), "error");
    } finally {
      setBusy(false);
    }
  };

  const formatDate = (value?: string | null) => {
    if (!value) {
      return "—";
    }
    return new Date(value).toLocaleString();
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="eyebrow">{t("Servicio")}</div>
          <h1>{t("Sistema de Encuestas Inteligentes")}</h1>
          <p className="muted">
            {t(
              "Gestiona encuestas, preguntas y respuestas. Comparte el enlace publico con tus usuarios.",
            )}
          </p>
        </div>
        <div className="page-actions">
          <button className="btn" onClick={() => navigate(`/clients/${tenantId}/services/${serviceCode}`)}>
            {t("Volver al servicio")}
          </button>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="grid grid-2">
        <div className="card">
          <div className="card-header">
            <div>
              <h2>{t("Encuestas")}</h2>
              <p className="muted">{t("Crea y gestiona las encuestas.")}</p>
            </div>
            <button
              className="btn btn-secondary"
              onClick={resetSurveyForm}
              disabled={busy}
            >
              {t("Nueva encuesta")}
            </button>
          </div>
          <DataTable
            columns={[
              { key: "title", label: t("Titulo"), sortable: true },
              { key: "status", label: t("Estado"), sortable: true },
              {
                key: "responses",
                label: t("Respuestas"),
                render: (row: SurveySummary) => row.responseCount || 0,
              },
            ]}
            data={surveys}
            getRowId={(row) => row.id}
            pageSize={5}
            filterKeys={["title", "status"]}
            onRowClick={(row) => loadSurveyDetail(row.id)}
          />
          {surveys.length === 0 && (
            <div className="muted">{t("No hay encuestas creadas.")}</div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <h2>{t("Ficha de encuesta")}</h2>
              <p className="muted">
                {t("Configura idioma, estado y visibilidad.")}
              </p>
            </div>
          </div>
          <div className="form-grid">
            <label className="full-row">
              {t("Titulo")}
              <input
                value={surveyForm.title}
                onChange={(event) =>
                  setSurveyForm({ ...surveyForm, title: event.target.value })
                }
                placeholder={t("Encuesta de satisfaccion")}
              />
            </label>
            <label className="full-row">
              {t("Descripcion")}
              <textarea
                value={surveyForm.description}
                onChange={(event) =>
                  setSurveyForm({ ...surveyForm, description: event.target.value })
                }
              />
            </label>
            <label>
              {t("Estado")}
              <select
                value={surveyForm.status}
                onChange={(event) =>
                  setSurveyForm({ ...surveyForm, status: event.target.value })
                }
              >
                <option value="draft">{t("Borrador")}</option>
                <option value="active">{t("Activa")}</option>
                <option value="archived">{t("Archivada")}</option>
              </select>
            </label>
            <label>
              {t("Idioma")}
              <input
                value={surveyForm.language}
                onChange={(event) =>
                  setSurveyForm({ ...surveyForm, language: event.target.value })
                }
              />
            </label>
            <label>
              {t("Inicio")}
              <input
                type="datetime-local"
                value={surveyForm.startAt}
                onChange={(event) =>
                  setSurveyForm({ ...surveyForm, startAt: event.target.value })
                }
              />
            </label>
            <label>
              {t("Fin")}
              <input
                type="datetime-local"
                value={surveyForm.endAt}
                onChange={(event) =>
                  setSurveyForm({ ...surveyForm, endAt: event.target.value })
                }
              />
            </label>
            <label className="full-row">
              <input
                type="checkbox"
                checked={surveyForm.allowMultiple}
                onChange={(event) =>
                  setSurveyForm({ ...surveyForm, allowMultiple: event.target.checked })
                }
              />
              {t("Permitir multiples respuestas")}
            </label>
            <label className="full-row">
              <input
                type="checkbox"
                checked={surveyForm.collectEmail}
                onChange={(event) =>
                  setSurveyForm({ ...surveyForm, collectEmail: event.target.checked })
                }
              />
              {t("Solicitar email al responder")}
            </label>
            <label className="full-row">
              <input
                type="checkbox"
                checked={surveyForm.anonymous}
                onChange={(event) =>
                  setSurveyForm({ ...surveyForm, anonymous: event.target.checked })
                }
              />
              {t("Respuestas anonimas")}
            </label>
            <label className="full-row">
              {t("Mensaje de bienvenida")}
              <textarea
                value={surveyForm.welcomeText}
                onChange={(event) =>
                  setSurveyForm({ ...surveyForm, welcomeText: event.target.value })
                }
              />
            </label>
            <label className="full-row">
              {t("Mensaje de agradecimiento")}
              <textarea
                value={surveyForm.thankYouText}
                onChange={(event) =>
                  setSurveyForm({ ...surveyForm, thankYouText: event.target.value })
                }
              />
            </label>
            {surveyPublicUrl && (
              <div className="info-banner full-row">
                <div className="row">
                  <span>{t("Link publico")}</span>
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(surveyPublicUrl);
                      emitToast(t("Link copiado."));
                    }}
                  >
                    {t("Copiar")}
                  </button>
                </div>
                <div className="muted">{surveyPublicUrl}</div>
              </div>
            )}
            <div className="row-actions full-row">
              <button className="btn" onClick={handleSaveSurvey} disabled={busy}>
                {surveyMode === "create" ? t("Crear") : t("Guardar")}
              </button>
              {surveyMode === "edit" && (
                <button
                  className="btn btn-secondary"
                  onClick={handleDeleteSurvey}
                  disabled={busy}
                >
                  {t("Eliminar")}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedSurvey && (
        <>
          <div className="grid grid-2">
            <div className="card">
              <div className="card-header">
                <div>
                  <h2>{t("Preguntas")}</h2>
                  <p className="muted">
                    {t("Define el orden y el tipo de respuesta.")}
                  </p>
                </div>
              </div>
              <DataTable
                columns={[
                  { key: "orderIndex", label: "#", sortable: true },
                  { key: "label", label: t("Pregunta"), sortable: true },
                  { key: "type", label: t("Tipo") },
                  {
                    key: "actions",
                    label: t("Acciones"),
                    render: (row: SurveyQuestion) => (
                      <div className="row-actions">
                        <button
                          className="link"
                          type="button"
                          onClick={() => handleEditQuestion(row)}
                        >
                          {t("Editar")}
                        </button>
                        <button
                          className="link danger"
                          type="button"
                          onClick={() => handleDeleteQuestion(row.id)}
                        >
                          {t("Eliminar")}
                        </button>
                      </div>
                    ),
                  },
                ]}
                data={[...(selectedSurvey.questions || [])].sort((a, b) =>
                  a.orderIndex - b.orderIndex,
                )}
                getRowId={(row) => row.id}
                pageSize={6}
                filterKeys={["label", "type"]}
              />
              {selectedSurvey.questions.length === 0 && (
                <div className="muted">{t("No hay preguntas todavia.")}</div>
              )}
            </div>

            <div className="card">
              <div className="card-header">
                <div>
                  <h2>
                    {questionMode === "create"
                      ? t("Nueva pregunta")
                      : t("Editar pregunta")}
                  </h2>
                  <p className="muted">{t("Configura opciones y escala.")}</p>
                </div>
              </div>
              <div className="form-grid">
                <label className="full-row">
                  {t("Texto de la pregunta")}
                  <input
                    value={questionForm.label}
                    onChange={(event) =>
                      setQuestionForm({ ...questionForm, label: event.target.value })
                    }
                  />
                </label>
                <label className="full-row">
                  {t("Descripcion")}
                  <textarea
                    value={questionForm.description}
                    onChange={(event) =>
                      setQuestionForm({
                        ...questionForm,
                        description: event.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  {t("Tipo")}
                  <select
                    value={questionForm.type}
                    onChange={(event) =>
                      setQuestionForm({ ...questionForm, type: event.target.value })
                    }
                  >
                    <option value="text">{t("Texto corto")}</option>
                    <option value="textarea">{t("Texto largo")}</option>
                    <option value="single_choice">{t("Seleccion unica")}</option>
                    <option value="multi_choice">{t("Seleccion multiple")}</option>
                    <option value="rating">{t("Escala")}</option>
                    <option value="nps">{t("NPS")}</option>
                    <option value="number">{t("Numero")}</option>
                  </select>
                </label>
                <label>
                  {t("Orden")}
                  <input
                    type="number"
                    value={questionForm.orderIndex}
                    onChange={(event) =>
                      setQuestionForm({
                        ...questionForm,
                        orderIndex: Number(event.target.value),
                      })
                    }
                  />
                </label>
                <label className="full-row">
                  <input
                    type="checkbox"
                    checked={questionForm.required}
                    onChange={(event) =>
                      setQuestionForm({ ...questionForm, required: event.target.checked })
                    }
                  />
                  {t("Requerida")}
                </label>
                <label className="full-row">
                  {t("Opciones (separadas por coma)")}
                  <input
                    value={questionForm.optionsText}
                    onChange={(event) =>
                      setQuestionForm({
                        ...questionForm,
                        optionsText: event.target.value,
                      })
                    }
                    placeholder={t("Ej: Excelente, Bien, Regular")}
                  />
                </label>
                <label>
                  {t("Escala min")}
                  <input
                    type="number"
                    value={questionForm.scaleMin}
                    onChange={(event) =>
                      setQuestionForm({ ...questionForm, scaleMin: event.target.value })
                    }
                  />
                </label>
                <label>
                  {t("Escala max")}
                  <input
                    type="number"
                    value={questionForm.scaleMax}
                    onChange={(event) =>
                      setQuestionForm({ ...questionForm, scaleMax: event.target.value })
                    }
                  />
                </label>
                <label>
                  {t("Etiqueta min")}
                  <input
                    value={questionForm.scaleMinLabel}
                    onChange={(event) =>
                      setQuestionForm({
                        ...questionForm,
                        scaleMinLabel: event.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  {t("Etiqueta max")}
                  <input
                    value={questionForm.scaleMaxLabel}
                    onChange={(event) =>
                      setQuestionForm({
                        ...questionForm,
                        scaleMaxLabel: event.target.value,
                      })
                    }
                  />
                </label>
                <div className="row-actions full-row">
                  <button className="btn" onClick={handleSaveQuestion} disabled={busy}>
                    {questionMode === "create" ? t("Agregar") : t("Guardar")}
                  </button>
                  {questionMode === "edit" && (
                    <button
                      className="btn btn-secondary"
                      type="button"
                      onClick={() => {
                        setQuestionMode("create");
                        setQuestionForm(emptyQuestionForm);
                      }}
                    >
                      {t("Cancelar")}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-2">
            <div className="card">
              <div className="card-header">
                <div>
                  <h2>{t("Respuestas")}</h2>
                  <p className="muted">
                    {t("Consulta las respuestas recibidas.")}
                  </p>
                </div>
                <div className="row-actions">
                  <button className="btn btn-secondary" onClick={handleExportCsv}>
                    {t("Exportar CSV")}
                  </button>
                </div>
              </div>
              <DataTable
                columns={[
                  {
                    key: "submittedAt",
                    label: t("Fecha"),
                    render: (row: SurveyResponseSummary) =>
                      formatDate(row.submittedAt),
                  },
                  { key: "respondentEmail", label: t("Email") },
                  { key: "answerCount", label: t("Respuestas") },
                ]}
                data={responses}
                getRowId={(row) => row.id}
                pageSize={6}
                filterKeys={["respondentEmail"]}
                onRowClick={(row) => handleSelectResponse(row.id)}
              />
              {responses.length === 0 && (
                <div className="muted">{t("No hay respuestas.")}</div>
              )}
            </div>

            <div className="card">
              <div className="card-header">
                <div>
                  <h2>{t("Detalle de respuesta")}</h2>
                  <p className="muted">
                    {t("Selecciona una respuesta para ver el detalle.")}
                  </p>
                </div>
              </div>
              {!responseDetail && <div className="muted">—</div>}
              {responseDetail && (
                <div className="stack">
                  <div className="muted">
                    {t("Fecha")}: {formatDate(responseDetail.submittedAt)}
                  </div>
                  <div className="muted">
                    {t("Email")}: {responseDetail.respondentEmail || "—"}
                  </div>
                  <div className="stack">
                    {responseDetail.answers.map((answer, index) => (
                      <div className="card-subtle" key={`${answer.questionId}-${index}`}>
                        <div className="muted">{answer.questionId}</div>
                        <div>{String(answer.value ?? "")}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div>
                <h2>{t("Insights IA")}</h2>
                <p className="muted">
                  {t("Genera analisis y resumen ejecutivo automaticamente.")}
                </p>
              </div>
              <button className="btn" onClick={handleRunInsights} disabled={busy}>
                {t("Generar insights")}
              </button>
            </div>
            {insights.length === 0 ? (
              <div className="muted">{t("No hay insights generados.")}</div>
            ) : (
              <div className="stack">
                {insights.map((insight) => (
                  <div className="card-subtle" key={insight.id}>
                    <div className="row">
                      <strong>{insight.status}</strong>
                      <span className="muted">{formatDate(insight.createdAt)}</span>
                    </div>
                    {insight.errorMessage && (
                      <div className="error-banner">{insight.errorMessage}</div>
                    )}
                    {insight.payload && (
                      <pre className="pre-wrap">{insight.payload}</pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
