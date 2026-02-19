import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api";
import { useI18n } from "../i18n/I18nProvider";
import { PublicSurvey, SurveyQuestion } from "../types";

type AnswerMap = Record<string, any>;

export function PublicSurveyPage() {
  const { publicCode } = useParams();
  const { t } = useI18n();
  const [survey, setSurvey] = useState<PublicSurvey | null>(null);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!publicCode) {
      return;
    }
    loadSurvey(publicCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicCode]);

  const loadSurvey = async (code: string) => {
    setError(null);
    try {
      const data = (await api.publicGetSurvey(code)) as PublicSurvey;
      setSurvey(data);
    } catch (err: any) {
      setError(err.message || t("No se pudo cargar la encuesta"));
    }
  };

  const handleChange = (questionId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleToggleMulti = (questionId: string, option: string) => {
    const current = Array.isArray(answers[questionId]) ? answers[questionId] : [];
    if (current.includes(option)) {
      handleChange(
        questionId,
        current.filter((item: string) => item !== option),
      );
      return;
    }
    handleChange(questionId, [...current, option]);
  };

  const isRequiredMissing = (question: SurveyQuestion) => {
    if (!question.required) {
      return false;
    }
    const value = answers[question.id];
    if (value === null || value === undefined) {
      return true;
    }
    if (Array.isArray(value)) {
      return value.length === 0;
    }
    return String(value).trim().length === 0;
  };

  const handleSubmit = async () => {
    if (!survey || !publicCode) {
      return;
    }
    setError(null);
    const missing = survey.questions.find((question) => isRequiredMissing(question));
    if (missing) {
      setError(t("Debes completar todas las preguntas obligatorias."));
      return;
    }
    if (survey.collectEmail && !email.trim()) {
      setError(t("El email es obligatorio."));
      return;
    }
    const payload = {
      respondentEmail: survey.collectEmail ? email.trim() : null,
      respondentName: survey.anonymous ? null : name.trim() || null,
      answers: Object.entries(answers).map(([questionId, value]) => ({
        questionId,
        value,
      })),
    };
    try {
      await api.publicSubmitSurvey(publicCode, payload);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || t("No se pudo enviar la respuesta"));
    }
  };

  if (error && !survey) {
    return (
      <div className="public-page">
        <div className="public-card">
          <h2>{t("Encuesta no disponible")}</h2>
          <p className="muted">{error}</p>
        </div>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="public-page">
        <div className="public-card">
          <p className="muted">{t("Cargando encuesta...")}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="public-page">
        <div className="public-card">
          <h2>{t("Gracias")}</h2>
          <p className="muted">
            {survey.thankYouText || t("Tu respuesta ha sido registrada.")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="public-page">
      <div className="public-card">
        <h1>{survey.title}</h1>
        {survey.description && <p className="muted">{survey.description}</p>}
        {survey.welcomeText && (
          <div className="info-banner">{survey.welcomeText}</div>
        )}
        {survey.collectEmail && (
          <label className="full-row">
            {t("Email")}
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@email.com"
            />
          </label>
        )}
        {!survey.anonymous && (
          <label className="full-row">
            {t("Nombre")}
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t("Tu nombre")}
            />
          </label>
        )}
        <div className="stack">
          {[...survey.questions]
            .sort((a, b) => a.orderIndex - b.orderIndex)
            .map((question) => (
            <div className="card-subtle" key={question.id}>
              <div className="question-title">
                <strong>{question.label}</strong>
                {question.required && <span className="muted"> *</span>}
              </div>
              {question.description && (
                <div className="muted">{question.description}</div>
              )}
              {question.type === "textarea" && (
                <textarea
                  value={answers[question.id] || ""}
                  onChange={(event) =>
                    handleChange(question.id, event.target.value)
                  }
                />
              )}
              {question.type === "text" && (
                <input
                  value={answers[question.id] || ""}
                  onChange={(event) =>
                    handleChange(question.id, event.target.value)
                  }
                />
              )}
              {(question.type === "single_choice" || question.type === "multi_choice") && (
                <div className="option-list">
                  {(question.options || []).map((option) => (
                    <label key={option} className="option-item">
                      <input
                        type={question.type === "single_choice" ? "radio" : "checkbox"}
                        name={question.id}
                        checked={
                          question.type === "single_choice"
                            ? answers[question.id] === option
                            : Array.isArray(answers[question.id]) &&
                              answers[question.id].includes(option)
                        }
                        onChange={() =>
                          question.type === "single_choice"
                            ? handleChange(question.id, option)
                            : handleToggleMulti(question.id, option)
                        }
                      />
                      {option}
                    </label>
                  ))}
                </div>
              )}
              {(question.type === "rating" || question.type === "nps") && (
                <div className="range-input">
                  <input
                    type="range"
                    min={question.type === "nps" ? 0 : question.scaleMin ?? 1}
                    max={question.type === "nps" ? 10 : question.scaleMax ?? 5}
                    value={
                      answers[question.id] ??
                      (question.type === "nps" ? 0 : question.scaleMin ?? 1)
                    }
                    onChange={(event) =>
                      handleChange(question.id, Number(event.target.value))
                    }
                  />
                  <div className="muted">
                    {answers[question.id] ??
                      (question.type === "nps" ? 0 : question.scaleMin ?? 1)}
                  </div>
                </div>
              )}
              {question.type === "number" && (
                <input
                  type="number"
                  value={answers[question.id] ?? ""}
                  onChange={(event) =>
                    handleChange(question.id, Number(event.target.value))
                  }
                />
              )}
            </div>
          ))}
        </div>
        {error && <div className="error-banner">{error}</div>}
        <button className="btn" onClick={handleSubmit}>
          {t("Enviar respuestas")}
        </button>
      </div>
    </div>
  );
}
