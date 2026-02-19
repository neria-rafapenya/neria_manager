import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ApiError, fetchWithAuth } from "../../../infrastructure/api/api";
import { getServiceCode, getTenantId } from "../../../infrastructure/config/env";

interface SimulationSummary {
  id: string;
  title: string;
  type: string;
  currency: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  result?: Record<string, any>;
}

interface SimulationDetail {
  summary: SimulationSummary;
  input: Record<string, any>;
  result: Record<string, any>;
  explanation?: string;
  model?: string;
}

const defaultFormState = {
  type: "loan",
  title: "",
  principal: "200000",
  annualRate: "3.2",
  termYears: "20",
  termMonths: "",
  currency: "EUR",
  initialDeposit: "5000",
  monthlyContribution: "250",
};

const toNumber = (value: string): number | undefined => {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const buildEndpoint = (tenantId: string, serviceCode: string) =>
  `/tenants/${tenantId}/services/${serviceCode}/financial-simulations`;

export const FinancialSimulatorPage = () => {
  const { t } = useTranslation("common");
  const [form, setForm] = useState(defaultFormState);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [simulations, setSimulations] = useState<SimulationSummary[]>([]);
  const [current, setCurrent] = useState<SimulationDetail | null>(null);

  const tenantId = getTenantId();
  const serviceCode = getServiceCode();

  const endpoint = useMemo(() => {
    if (!tenantId || !serviceCode) return "";
    return buildEndpoint(tenantId, serviceCode);
  }, [tenantId, serviceCode]);

  const formatCurrency = (value?: number, currency?: string) => {
    if (value == null || Number.isNaN(value)) return "--";
    const currencyCode = currency || form.currency || "EUR";
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (value?: string) => {
    if (!value) return "";
    try {
      return new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value));
    } catch {
      return value;
    }
  };

  const loadList = async () => {
    if (!endpoint) {
      setError(t("financial_error_missing_service"));
      return;
    }
    setListLoading(true);
    setError(null);
    try {
      const data = await fetchWithAuth<SimulationSummary[]>(endpoint);
      setSimulations(data || []);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message || t("financial_error_generic"));
    } finally {
      setListLoading(false);
    }
  };

  const loadDetail = async (id: string) => {
    if (!endpoint) return;
    setLoading(true);
    setError(null);
    try {
      const detail = await fetchWithAuth<SimulationDetail>(`${endpoint}/${id}`);
      setCurrent(detail);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message || t("financial_error_generic"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadList();
  }, [endpoint]);

  const handleChange = (key: keyof typeof defaultFormState, value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!endpoint) {
      setError(t("financial_error_missing_service"));
      return;
    }
    setLoading(true);
    setError(null);

    const payload: Record<string, any> = {
      title: form.title || undefined,
      type: form.type,
      principal: toNumber(form.principal),
      annualRate: toNumber(form.annualRate),
      termMonths: toNumber(form.termMonths),
      termYears: toNumber(form.termYears),
      currency: form.currency,
      initialDeposit: toNumber(form.initialDeposit),
      monthlyContribution: toNumber(form.monthlyContribution),
      includeExplanation: true,
    };

    if (form.type === "savings") {
      delete payload.principal;
    } else {
      delete payload.initialDeposit;
      delete payload.monthlyContribution;
    }

    try {
      const detail = await fetchWithAuth<SimulationDetail>(endpoint, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setCurrent(detail);
      await loadList();
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message || t("financial_error_generic"));
    } finally {
      setLoading(false);
    }
  };

  const showSavings = form.type === "savings";

  return (
    <section className="financial-page">
      <div className="financial-hero">
        <div>
          <h2>{t("financial_title")}</h2>
          <p>{t("financial_subtitle")}</p>
        </div>
        <span className="financial-pill">{form.currency}</span>
      </div>

      <div className="financial-grid">
        <div className="financial-card">
          <h3>{t("financial_form_title")}</h3>
          <div className="financial-form">
            <label className="financial-field">
              <span>{t("financial_type_label")}</span>
              <select
                value={form.type}
                onChange={(event) => handleChange("type", event.target.value)}
              >
                <option value="loan">{t("financial_type_loan")}</option>
                <option value="mortgage">{t("financial_type_mortgage")}</option>
                <option value="savings">{t("financial_type_savings")}</option>
              </select>
            </label>

            <label className="financial-field">
              <span>{t("financial_currency_label")}</span>
              <input
                value={form.currency}
                maxLength={6}
                onChange={(event) => handleChange("currency", event.target.value)}
              />
            </label>

            {!showSavings && (
              <label className="financial-field">
                <span>{t("financial_amount_label")}</span>
                <input
                  type="number"
                  step="100"
                  value={form.principal}
                  onChange={(event) => handleChange("principal", event.target.value)}
                />
              </label>
            )}

            {showSavings && (
              <>
                <label className="financial-field">
                  <span>{t("financial_initial_deposit_label")}</span>
                  <input
                    type="number"
                    step="100"
                    value={form.initialDeposit}
                    onChange={(event) =>
                      handleChange("initialDeposit", event.target.value)
                    }
                  />
                </label>
                <label className="financial-field">
                  <span>{t("financial_monthly_contribution_label")}</span>
                  <input
                    type="number"
                    step="10"
                    value={form.monthlyContribution}
                    onChange={(event) =>
                      handleChange("monthlyContribution", event.target.value)
                    }
                  />
                </label>
              </>
            )}

            <label className="financial-field">
              <span>{t("financial_rate_label")}</span>
              <input
                type="number"
                step="0.1"
                value={form.annualRate}
                onChange={(event) => handleChange("annualRate", event.target.value)}
              />
            </label>

            <label className="financial-field">
              <span>{t("financial_term_years_label")}</span>
              <input
                type="number"
                step="1"
                value={form.termYears}
                onChange={(event) => handleChange("termYears", event.target.value)}
              />
            </label>

            <label className="financial-field">
              <span>{t("financial_term_months_label")}</span>
              <input
                type="number"
                step="1"
                value={form.termMonths}
                onChange={(event) => handleChange("termMonths", event.target.value)}
              />
            </label>
          </div>
          {error && <div className="financial-error">{error}</div>}
          <button
            className="fin-btn primary"
            type="button"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? t("financial_submitting") : t("financial_submit")}
          </button>
          <p className="financial-disclaimer">{t("financial_disclaimer")}</p>
        </div>

        <div className="financial-card">
          <h3>{t("financial_result_title")}</h3>
          {current ? (
            <div className="financial-result">
              <div className="financial-result-grid">
                {current.result?.monthlyPayment != null && (
                  <div>
                    <span>{t("financial_result_payment")}</span>
                    <strong>
                      {formatCurrency(
                        Number(current.result?.monthlyPayment),
                        current.summary.currency
                      )}
                    </strong>
                  </div>
                )}
                {current.result?.totalPayment != null && (
                  <div>
                    <span>{t("financial_result_total")}</span>
                    <strong>
                      {formatCurrency(
                        Number(current.result?.totalPayment),
                        current.summary.currency
                      )}
                    </strong>
                  </div>
                )}
                {current.result?.totalInterest != null && (
                  <div>
                    <span>{t("financial_result_interest")}</span>
                    <strong>
                      {formatCurrency(
                        Number(current.result?.totalInterest),
                        current.summary.currency
                      )}
                    </strong>
                  </div>
                )}
                {current.result?.finalAmount != null && (
                  <div>
                    <span>{t("financial_result_final")}</span>
                    <strong>
                      {formatCurrency(
                        Number(current.result?.finalAmount),
                        current.summary.currency
                      )}
                    </strong>
                  </div>
                )}
                {current.result?.totalContribution != null && (
                  <div>
                    <span>{t("financial_result_contribution")}</span>
                    <strong>
                      {formatCurrency(
                        Number(current.result?.totalContribution),
                        current.summary.currency
                      )}
                    </strong>
                  </div>
                )}
              </div>

              {current.explanation && (
                <div className="financial-explanation">
                  <h4>{t("financial_explanation_title")}</h4>
                  <p>{current.explanation}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="financial-empty">{t("financial_empty")}</div>
          )}
        </div>

        <div className="financial-card">
          <h3>{t("financial_recent")}</h3>
          {listLoading ? (
            <div className="financial-empty">{t("financial_submitting")}</div>
          ) : simulations.length === 0 ? (
            <div className="financial-empty">{t("financial_empty")}</div>
          ) : (
            <ul className="financial-list">
              {simulations.map((sim) => (
                <li key={sim.id}>
                  <button type="button" onClick={() => loadDetail(sim.id)}>
                    <div>
                      <strong>{sim.title}</strong>
                      <span>{formatDate(sim.createdAt)}</span>
                    </div>
                    <span className="financial-tag">{sim.type}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
};
