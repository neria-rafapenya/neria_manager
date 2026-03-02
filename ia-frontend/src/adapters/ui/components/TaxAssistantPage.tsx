import { useEffect, useMemo, useState } from "react";
import { ApiError, fetchWithAuth } from "../../../infrastructure/api/api";
import { getServiceCode, getTenantId } from "../../../infrastructure/config/env";

interface TaxSummary {
  id: string;
  title: string;
  taxYear?: number;
  region?: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  result?: Record<string, any> | null;
}

interface TaxDetail {
  summary: TaxSummary;
  input: Record<string, any> | null;
  result: Record<string, any> | null;
  report?: string | null;
  model?: string | null;
}

type LineItem = { label: string; category?: string; amount: string };

const buildItem = (): LineItem => ({ label: "", category: "", amount: "" });

const defaultForm = {
  taxYear: new Date().getFullYear() - 1,
  region: "general",
  filingType: "individual",
  residency: "residente",
  dependents: 0,
  title: "",
  notes: "",
  includeSummary: true,
  incomes: [
    { label: "Rendimientos del trabajo", category: "trabajo", amount: "" },
    { label: "Actividad economica / autonomo", category: "autonomo", amount: "" },
    { label: "Capital mobiliario", category: "capital", amount: "" },
    { label: "Alquileres", category: "alquiler", amount: "" },
  ] as LineItem[],
  deductions: [
    { label: "Plan de pensiones", category: "ahorro", amount: "" },
    { label: "Hipoteca vivienda habitual", category: "vivienda", amount: "" },
    { label: "Donativos", category: "donaciones", amount: "" },
    { label: "Guarderia", category: "familia", amount: "" },
  ] as LineItem[],
};

const steps = ["Datos basicos", "Ingresos", "Deducciones", "Resumen"];

const buildEndpoint = (tenantId: string, serviceCode: string) =>
  `/tenants/${tenantId}/services/${serviceCode}/tax-assistant`;

export const TaxAssistantPage = () => {
  const [form, setForm] = useState({ ...defaultForm });
  const [step, setStep] = useState(0);
  const [cases, setCases] = useState<TaxSummary[]>([]);
  const [current, setCurrent] = useState<TaxDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tenantId = getTenantId();
  const serviceCode = getServiceCode();

  const endpoint = useMemo(() => {
    if (!tenantId || !serviceCode) return "";
    return buildEndpoint(tenantId, serviceCode);
  }, [tenantId, serviceCode]);

  const totalIncome = useMemo(() => {
    return form.incomes.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [form.incomes]);

  const totalDeductions = useMemo(() => {
    return form.deductions.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [form.deductions]);

  const netBase = totalIncome - totalDeductions;

  const loadList = async () => {
    if (!endpoint) {
      setError("Falta configurar tenant y servicio.");
      return;
    }
    setListLoading(true);
    setError(null);
    try {
      const data = await fetchWithAuth<TaxSummary[]>(endpoint);
      setCases(data || []);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message || "No se pudo cargar el historial");
    } finally {
      setListLoading(false);
    }
  };

  const loadDetail = async (id: string) => {
    if (!endpoint) return;
    setLoading(true);
    setError(null);
    try {
      const detail = await fetchWithAuth<TaxDetail>(`${endpoint}/${id}`);
      setCurrent(detail);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message || "No se pudo cargar el detalle");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadList();
  }, [endpoint]);

  const handleItemChange = (
    list: "incomes" | "deductions",
    index: number,
    key: keyof LineItem,
    value: string
  ) => {
    setForm((prev) => {
      const next = [...prev[list]];
      next[index] = { ...next[index], [key]: value };
      return { ...prev, [list]: next };
    });
  };

  const addItem = (list: "incomes" | "deductions") => {
    setForm((prev) => ({ ...prev, [list]: [...prev[list], buildItem()] }));
  };

  const removeItem = (list: "incomes" | "deductions", index: number) => {
    setForm((prev) => {
      const next = prev[list].filter((_, idx) => idx !== index);
      return { ...prev, [list]: next.length ? next : [buildItem()] };
    });
  };

  const handleSubmit = async () => {
    if (!endpoint) {
      setError("Falta configurar tenant y servicio.");
      return;
    }
    setLoading(true);
    setError(null);

    const payload = {
      title: form.title || undefined,
      taxYear: Number(form.taxYear) || undefined,
      region: form.region || undefined,
      filingType: form.filingType || undefined,
      residency: form.residency || undefined,
      dependents: Number(form.dependents) || 0,
      notes: form.notes || undefined,
      includeSummary: form.includeSummary,
      incomes: form.incomes
        .filter((item) => item.label.trim() || item.amount)
        .map((item) => ({
          label: item.label,
          category: item.category || undefined,
          amount: Number(item.amount) || 0,
        })),
      deductions: form.deductions
        .filter((item) => item.label.trim() || item.amount)
        .map((item) => ({
          label: item.label,
          category: item.category || undefined,
          amount: Number(item.amount) || 0,
        })),
    };

    try {
      const detail = await fetchWithAuth<TaxDetail>(endpoint, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setCurrent(detail);
      await loadList();
      setStep(3);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message || "No se pudo generar el borrador");
    } finally {
      setLoading(false);
    }
  };


  const resultPayload = (current?.result ?? {}) as Record<string, any>;
  const summaryText =
    typeof (resultPayload as any).summary === "string"
      ? (resultPayload as any).summary
      : current?.report || "";
  const totals =
    resultPayload && typeof resultPayload === "object"
      ? ((resultPayload as any).totals ?? {})
      : {};
  const checklist = Array.isArray((resultPayload as any).checklist)
    ? (resultPayload as any).checklist
    : [];
  const nextSteps = Array.isArray((resultPayload as any).nextSteps)
    ? (resultPayload as any).nextSteps
    : [];
  const warnings = Array.isArray((resultPayload as any).warnings)
    ? (resultPayload as any).warnings
    : [];
  const questions = Array.isArray((resultPayload as any).questions)
    ? (resultPayload as any).questions
    : [];
  const disclaimer =
    typeof (resultPayload as any).disclaimer === "string"
      ? (resultPayload as any).disclaimer
      : "";
  const renderList = (items: any[]) => (
    <ul>
      {items.map((item, idx) => (
        <li key={idx}>{String(item)}</li>
      ))}
    </ul>
  );
  return (
    <section className="tax-page">
      <div className="tax-hero">
        <div>
          <h2>Asistente de Renta (Espana)</h2>
          <p>
            Completa el asistente paso a paso para obtener un borrador orientativo y
            una checklist de documentos.
          </p>
        </div>
        <div className="tax-pill">Paso {step + 1} de {steps.length}</div>
      </div>

      {error && <div className="tax-error">{error}</div>}

      <div className="tax-stepper">
        {steps.map((label, idx) => (
          <button
            key={label}
            type="button"
            className={`tax-step ${idx === step ? "active" : ""}`}
            onClick={() => setStep(idx)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="tax-grid">
        <div className="tax-card">
          {step === 0 && (
            <div className="tax-section">
              <div className="tax-field">
                <label>Ejercicio fiscal</label>
                <input
                  type="number"
                  value={form.taxYear}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, taxYear: Number(event.target.value) }))
                  }
                />
              </div>
              <div className="tax-field">
                <label>Region</label>
                <input
                  value={form.region}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, region: event.target.value }))
                  }
                />
              </div>
              <div className="tax-field">
                <label>Tipo de declaracion</label>
                <select
                  value={form.filingType}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, filingType: event.target.value }))
                  }
                >
                  <option value="individual">Individual</option>
                  <option value="conjunta">Conjunta</option>
                </select>
              </div>
              <div className="tax-field">
                <label>Residencia</label>
                <select
                  value={form.residency}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, residency: event.target.value }))
                  }
                >
                  <option value="residente">Residente</option>
                  <option value="no_residente">No residente</option>
                </select>
              </div>
              <div className="tax-field">
                <label>Dependientes</label>
                <input
                  type="number"
                  value={form.dependents}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, dependents: Number(event.target.value) }))
                  }
                />
              </div>
              <div className="tax-field full">
                <label>Titulo</label>
                <input
                  value={form.title}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, title: event.target.value }))
                  }
                  placeholder="Ej: Renta familiar 2024"
                />
              </div>
              <div className="tax-field full">
                <label>Notas</label>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, notes: event.target.value }))
                  }
                />
              </div>
              <label className="tax-checkbox">
                <input
                  type="checkbox"
                  checked={form.includeSummary}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, includeSummary: event.target.checked }))
                  }
                />
                Generar resumen con IA
              </label>
            </div>
          )}

          {step === 1 && (
            <div className="tax-section">
              {form.incomes.map((item, idx) => (
                <div className="tax-row" key={`income-${idx}`}>
                  <input
                    value={item.label}
                    onChange={(event) =>
                      handleItemChange("incomes", idx, "label", event.target.value)
                    }
                    placeholder="Concepto"
                  />
                  <input
                    value={item.amount}
                    onChange={(event) =>
                      handleItemChange("incomes", idx, "amount", event.target.value)
                    }
                    placeholder="Importe"
                  />
                  <button type="button" onClick={() => removeItem("incomes", idx)}>
                    Quitar
                  </button>
                </div>
              ))}
              <button className="tax-add" type="button" onClick={() => addItem("incomes")}
              >
                Agregar ingreso
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="tax-section">
              {form.deductions.map((item, idx) => (
                <div className="tax-row" key={`deduction-${idx}`}>
                  <input
                    value={item.label}
                    onChange={(event) =>
                      handleItemChange("deductions", idx, "label", event.target.value)
                    }
                    placeholder="Concepto"
                  />
                  <input
                    value={item.amount}
                    onChange={(event) =>
                      handleItemChange("deductions", idx, "amount", event.target.value)
                    }
                    placeholder="Importe"
                  />
                  <button type="button" onClick={() => removeItem("deductions", idx)}>
                    Quitar
                  </button>
                </div>
              ))}
              <button className="tax-add" type="button" onClick={() => addItem("deductions")}
              >
                Agregar deduccion
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="tax-section">
              <div className="tax-summary">
                <div>
                  <span>Total ingresos</span>
                  <strong>{totalIncome.toFixed(2)} €</strong>
                </div>
                <div>
                  <span>Total deducciones</span>
                  <strong>{totalDeductions.toFixed(2)} €</strong>
                </div>
                <div>
                  <span>Base neta</span>
                  <strong>{netBase.toFixed(2)} €</strong>
                </div>
              </div>
              <p className="muted">
                Este resultado es orientativo. El asistente no sustituye asesoramiento fiscal.
              </p>
            </div>
          )}

          <div className="tax-actions">
            <button type="button" className="ghost" onClick={() => setStep(Math.max(step - 1, 0))}
            >
              Anterior
            </button>
            {step < steps.length - 1 && (
              <button type="button" onClick={() => setStep(Math.min(step + 1, steps.length - 1))}
              >
                Siguiente
              </button>
            )}
            {step === steps.length - 1 && (
              <button type="button" className="primary" onClick={handleSubmit} disabled={loading}
              >
                {loading ? "Procesando..." : "Generar borrador"}
              </button>
            )}
          </div>
        </div>

        <div className="tax-card">
          <h3>Historial</h3>
          {listLoading ? <p className="muted">Cargando...</p> : null}
          {!listLoading && cases.length === 0 ? (
            <p className="muted">No hay casos aun.</p>
          ) : (
            <ul className="tax-list">
              {cases.map((item) => (
                <li key={item.id}>
                  <button type="button" onClick={() => loadDetail(item.id)}>
                    <span>{item.title || `Renta ${item.taxYear}`}</span>
                    <small>{item.status}</small>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {current && (
            <div className="tax-result">
              <h4>{current.summary.title || `Renta ${current.summary.taxYear ?? ""}`}</h4>
              {summaryText && <p>{summaryText}</p>}

              {totals && Object.keys(totals).length > 0 && (
                <div className="tax-summary">
                  <div>
                    <span>Total ingresos</span>
                    <strong>{Number((totals as any).income || 0).toFixed(2)} €</strong>
                  </div>
                  <div>
                    <span>Total deducciones</span>
                    <strong>{Number((totals as any).deductions || 0).toFixed(2)} €</strong>
                  </div>
                  <div>
                    <span>Base neta</span>
                    <strong>{Number((totals as any).netBase || 0).toFixed(2)} €</strong>
                  </div>
                </div>
              )}

              {checklist.length > 0 && (
                <div className="tax-result-section">
                  <h5>Checklist</h5>
                  {renderList(checklist)}
                </div>
              )}
              {nextSteps.length > 0 && (
                <div className="tax-result-section">
                  <h5>Proximos pasos</h5>
                  {renderList(nextSteps)}
                </div>
              )}
              {warnings.length > 0 && (
                <div className="tax-result-section">
                  <h5>Alertas</h5>
                  {renderList(warnings)}
                </div>
              )}
              {questions.length > 0 && (
                <div className="tax-result-section">
                  <h5>Preguntas</h5>
                  {renderList(questions)}
                </div>
              )}
              {disclaimer && (
                <div className="tax-result-section">
                  <h5>Nota</h5>
                  <p className="muted">{disclaimer}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
