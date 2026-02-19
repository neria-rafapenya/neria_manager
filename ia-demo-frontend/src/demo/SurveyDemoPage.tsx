import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { loadDemos } from "./demoLoader";
import type { DemoConfig } from "./types";

const STORAGE_KEY = "ia_demo_surveys";

type SurveyItem = {
  id: string;
  title: string;
  description: string;
  status: "draft" | "active";
  createdAt: string;
};

const seedSurveys: SurveyItem[] = [
  {
    id: "encuesta-satisfaccion-001",
    title: "Encuesta de satisfacción cliente",
    description: "Feedback post-servicio para medir satisfacción general.",
    status: "active",
    createdAt: new Date().toISOString(),
  },
  {
    id: "encuesta-clima-002",
    title: "Clima laboral Q1",
    description: "Pulso de bienestar y cultura interna.",
    status: "draft",
    createdAt: new Date().toISOString(),
  },
];

const mockQuestions = [
  {
    id: "q1",
    label: "¿Cómo valorarías la experiencia general?",
    type: "rating",
    scale: 5,
  },
  {
    id: "q2",
    label: "¿Qué fue lo más útil del servicio?",
    type: "text",
  },
  {
    id: "q3",
    label: "Selecciona los puntos destacados",
    type: "multi",
    options: ["Rapidez", "Claridad", "Resultados", "Soporte"],
  },
  {
    id: "q4",
    label: "¿Recomendarías el servicio?",
    type: "single",
    options: ["Sí", "No"],
  },
];

const loadStoredSurveys = (): SurveyItem[] => {
  if (typeof window === "undefined") return seedSurveys;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedSurveys;
    const parsed = JSON.parse(raw) as SurveyItem[];
    return Array.isArray(parsed) && parsed.length ? parsed : seedSurveys;
  } catch {
    return seedSurveys;
  }
};

const persistSurveys = (items: SurveyItem[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};

export const SurveyDemoPage = () => {
  const { code } = useParams();
  const [demo, setDemo] = useState<DemoConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [surveys, setSurveys] = useState<SurveyItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [titleInput, setTitleInput] = useState("");
  const [descInput, setDescInput] = useState("");
  const [statusInput, setStatusInput] = useState<"draft" | "active">("active");
  const [formError, setFormError] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string | string[]>>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let mounted = true;
    loadDemos()
      .then((items) => {
        if (!mounted) return;
        setDemo(items.find((item) => item.code === code) || null);
        setLoading(false);
      })
      .catch(() => {
        if (!mounted) return;
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [code]);

  useEffect(() => {
    const initial = loadStoredSurveys();
    setSurveys(initial);
    if (initial.length > 0) {
      setSelectedId(initial[0].id);
    }
  }, []);

  useEffect(() => {
    persistSurveys(surveys);
  }, [surveys]);

  const selectedSurvey = surveys.find((item) => item.id === selectedId) || null;

  const publicLink = selectedSurvey
    ? `https://demo.neria.app/public/surveys/${selectedSurvey.id}`
    : "";

  const progress = useMemo(() => {
    const answered = Object.keys(values).length;
    return Math.round((answered / mockQuestions.length) * 100);
  }, [values]);

  const handleToggle = (id: string, option: string) => {
    setValues((prev) => {
      const current = prev[id];
      const list = Array.isArray(current) ? [...current] : [];
      const idx = list.indexOf(option);
      if (idx >= 0) list.splice(idx, 1);
      else list.push(option);
      return { ...prev, [id]: list };
    });
  };

  const handleCreateSurvey = () => {
    const title = titleInput.trim();
    if (!title) {
      setFormError("El titulo es obligatorio.");
      return;
    }
    const newSurvey: SurveyItem = {
      id: `encuesta-${Date.now()}`,
      title,
      description: descInput.trim() || "Sin descripcion",
      status: statusInput,
      createdAt: new Date().toISOString(),
    };
    const next = [newSurvey, ...surveys];
    setSurveys(next);
    setSelectedId(newSurvey.id);
    setTitleInput("");
    setDescInput("");
    setStatusInput("active");
    setFormError(null);
  };

  const handleSubmitMock = () => {
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2500);
    setValues({});
  };

  if (loading) {
    return (
      <div className="survey-shell">
        <p className="muted">Cargando encuesta...</p>
      </div>
    );
  }

  if (!demo) {
    return (
      <div className="survey-shell">
        <p className="demo-error">Encuesta no encontrada</p>
        <Link to="/" className="demo-link">
          Volver a demos
        </Link>
      </div>
    );
  }

  return (
    <div className="survey-shell">
      <header className="survey-header">
        <div>
          <h1>{demo.name}</h1>
          {demo.description && <p className="muted">{demo.description}</p>}
        </div>
        <div className="survey-progress">
          <span>Progreso de respuesta</span>
          <div className="survey-progress-bar">
            <div style={{ width: `${progress}%` }} />
          </div>
        </div>
      </header>

      <div className="survey-grid">
        <aside className="survey-list">
          <div className="survey-list-header">
            <strong>Encuestas publicas</strong>
            <span className="survey-count">{surveys.length}</span>
          </div>

          {surveys.map((item) => (
            <button
              type="button"
              key={item.id}
              className={`survey-item${item.id === selectedId ? " active" : ""}`}
              onClick={() => setSelectedId(item.id)}
            >
              <div>
                <div className="survey-item-title">{item.title}</div>
                <div className="survey-item-desc">{item.description}</div>
              </div>
              <span className={`survey-status ${item.status}`}>{item.status}</span>
            </button>
          ))}

          <div className="survey-create">
            <h3>Crear encuesta publica</h3>
            <label>
              Titulo
              <input
                value={titleInput}
                onChange={(event) => setTitleInput(event.target.value)}
                placeholder="Nombre de la encuesta"
              />
            </label>
            <label>
              Descripcion
              <textarea
                value={descInput}
                onChange={(event) => setDescInput(event.target.value)}
                placeholder="Describe el objetivo"
              />
            </label>
            <label>
              Estado inicial
              <select
                value={statusInput}
                onChange={(event) =>
                  setStatusInput(event.target.value as "draft" | "active")
                }
              >
                <option value="active">Activa</option>
                <option value="draft">Borrador</option>
              </select>
            </label>
            {formError && <div className="survey-error">{formError}</div>}
            <button className="survey-submit" type="button" onClick={handleCreateSurvey}>
              Crear encuesta
            </button>
          </div>
        </aside>

        <section className="survey-detail">
          {selectedSurvey ? (
            <>
              <div className="survey-detail-header">
                <div>
                  <h2>{selectedSurvey.title}</h2>
                  <p className="muted">{selectedSurvey.description}</p>
                </div>
                <span className={`survey-status ${selectedSurvey.status}`}>
                  {selectedSurvey.status}
                </span>
              </div>

              <div className="survey-link">
                <div>
                  <strong>Enlace publico</strong>
                  <p className="muted">{publicLink}</p>
                </div>
                <a className="survey-submit" href={publicLink} target="_blank" rel="noreferrer">
                  Abrir enlace
                </a>
              </div>

              {submitted && (
                <div className="survey-success">
                  Respuesta enviada (demo). La IA generará insights en segundos.
                </div>
              )}

              <div className="survey-card">
                {mockQuestions.map((q) => (
                  <div key={q.id} className="survey-question">
                    <h3>{q.label}</h3>

                    {q.type === "rating" && (
                      <div className="survey-rating">
                        {Array.from({ length: q.scale }).map((_, idx) => {
                          const value = String(idx + 1);
                          const selected = values[q.id] === value;
                          return (
                            <button
                              type="button"
                              key={value}
                              className={`survey-pill${selected ? " active" : ""}`}
                              onClick={() =>
                                setValues((prev) => ({ ...prev, [q.id]: value }))
                              }
                            >
                              {value}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {q.type === "text" && (
                      <textarea
                        className="survey-textarea"
                        placeholder="Escribe aqui tu respuesta"
                        value={String(values[q.id] || "")}
                        onChange={(event) =>
                          setValues((prev) => ({
                            ...prev,
                            [q.id]: event.target.value,
                          }))
                        }
                      />
                    )}

                    {q.type === "multi" && (
                      <div className="survey-multi">
                        {q.options.map((opt) => {
                          const selected = Array.isArray(values[q.id])
                            ? values[q.id].includes(opt)
                            : false;
                          return (
                            <button
                              type="button"
                              key={opt}
                              className={`survey-pill${selected ? " active" : ""}`}
                              onClick={() => handleToggle(q.id, opt)}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {q.type === "single" && (
                      <div className="survey-multi">
                        {q.options.map((opt) => {
                          const selected = values[q.id] === opt;
                          return (
                            <button
                              type="button"
                              key={opt}
                              className={`survey-pill${selected ? " active" : ""}`}
                              onClick={() =>
                                setValues((prev) => ({ ...prev, [q.id]: opt }))
                              }
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}

                <div className="survey-actions">
                  <button
                    type="button"
                    className="survey-submit"
                    onClick={handleSubmitMock}
                  >
                    Enviar respuestas
                  </button>
                  <Link to="/" className="demo-link">
                    Volver a demos
                  </Link>
                </div>
              </div>
            </>
          ) : (
            <div className="survey-empty">Selecciona una encuesta.</div>
          )}
        </section>
      </div>
    </div>
  );
};
