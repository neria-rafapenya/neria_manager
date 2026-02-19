import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { DataTable } from "../components/DataTable";
import { useI18n } from "../i18n/I18nProvider";
import { emitToast } from "../toast";
import type {
  FinancialSimulationDetail,
  FinancialSimulationSummary,
} from "../types";

const emptyForm = {
  type: "loan",
  title: "",
  principal: "200000",
  annualRate: "3.2",
  termYears: "20",
  termMonths: "",
  currency: "EUR",
  initialDeposit: "5000",
  monthlyContribution: "250",
  includeExplanation: true,
};

type TenantServiceFinancialSimulationsPageProps = {
  defaultServiceCode?: string;
};

export function TenantServiceFinancialSimulationsPage({
  defaultServiceCode,
}: TenantServiceFinancialSimulationsPageProps = {}) {
  const params = useParams();
  const tenantId = params.tenantId;
  const serviceCode = params.serviceCode ?? defaultServiceCode;
  const navigate = useNavigate();
  const { t } = useI18n();

  const [simulations, setSimulations] = useState<FinancialSimulationSummary[]>(
    [],
  );
  const [selected, setSelected] = useState<FinancialSimulationDetail | null>(
    null,
  );
  const [form, setForm] = useState({ ...emptyForm });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const showSavings = form.type === "savings";

  const parseNumber = (value: string) => {
    if (!value) return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  const loadSimulations = async () => {
    if (!tenantId || !serviceCode) {
      return;
    }
    setError(null);
    try {
      const data = (await api.listTenantServiceFinancialSimulations(
        tenantId,
        serviceCode,
      )) as FinancialSimulationSummary[];
      setSimulations(data);
    } catch (err: any) {
      setError(err.message || t("No se pudieron cargar las simulaciones"));
    }
  };

  const loadDetail = async (simulationId: string) => {
    if (!tenantId || !serviceCode) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const detail = (await api.getTenantServiceFinancialSimulation(
        tenantId,
        serviceCode,
        simulationId,
      )) as FinancialSimulationDetail;
      setSelected(detail);
    } catch (err: any) {
      setError(err.message || t("No se pudo cargar la simulación"));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!tenantId || !serviceCode) {
      return;
    }
    loadSimulations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, serviceCode]);

  const handleSubmit = async () => {
    if (!tenantId || !serviceCode) {
      setError(t("Selecciona un servicio para continuar."));
      return;
    }
    setBusy(true);
    setError(null);

    const payload: Record<string, any> = {
      title: form.title || undefined,
      type: form.type,
      principal: parseNumber(form.principal),
      annualRate: parseNumber(form.annualRate),
      termYears: parseNumber(form.termYears),
      termMonths: parseNumber(form.termMonths),
      currency: form.currency,
      initialDeposit: parseNumber(form.initialDeposit),
      monthlyContribution: parseNumber(form.monthlyContribution),
      includeExplanation: form.includeExplanation,
    };

    if (form.type === "savings") {
      delete payload.principal;
    } else {
      delete payload.initialDeposit;
      delete payload.monthlyContribution;
    }

    try {
      const detail = (await api.createTenantServiceFinancialSimulation(
        tenantId,
        serviceCode,
        payload,
      )) as FinancialSimulationDetail;
      setSelected(detail);
      await loadSimulations();
      emitToast(t("Simulación creada"));
    } catch (err: any) {
      setError(err.message || t("No se pudo crear la simulación"));
    } finally {
      setBusy(false);
    }
  };

  const columns = useMemo(
    () => [
      { key: "title", label: t("Título"), sortable: true },
      { key: "type", label: t("Tipo"), sortable: true },
      { key: "status", label: t("Estado"), sortable: true },
      {
        key: "createdAt",
        label: t("Creado"),
        sortable: true,
        render: (row: FinancialSimulationSummary) =>
          row.createdAt ? new Date(row.createdAt).toLocaleString() : "—",
      },
      {
        key: "actions",
        label: t("Acciones"),
        render: (row: FinancialSimulationSummary) => (
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
          <div className="eyebrow">{t("Simulador financiero")}</div>
          <h2>{t("Simulaciones de productos financieros")}</h2>
          <p className="muted">
            {t(
              "Crea escenarios de préstamo, hipoteca o ahorro con explicaciones orientativas.",
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
            <h4>{t("Nueva simulación")}</h4>
            <div className="row g-3 form-grid-13">
              <div className="col-12 col-md-6">
                <label>
                  {t("Tipo")}
                  <select
                    className="form-select"
                    value={form.type}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, type: event.target.value }))
                    }
                  >
                    <option value="loan">{t("Préstamo")}</option>
                    <option value="mortgage">{t("Hipoteca")}</option>
                    <option value="savings">{t("Ahorro")}</option>
                  </select>
                </label>
              </div>
              <div className="col-12 col-md-6">
                <label>
                  {t("Moneda")}
                  <input
                    className="form-control"
                    value={form.currency}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, currency: event.target.value }))
                    }
                  />
                </label>
              </div>
              {!showSavings && (
                <div className="col-12 col-md-6">
                  <label>
                    {t("Principal")}
                    <input
                      className="form-control"
                      type="number"
                      value={form.principal}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, principal: event.target.value }))
                      }
                    />
                  </label>
                </div>
              )}
              {showSavings && (
                <>
                  <div className="col-12 col-md-6">
                    <label>
                      {t("Aporte inicial")}
                      <input
                        className="form-control"
                        type="number"
                        value={form.initialDeposit}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            initialDeposit: event.target.value,
                          }))
                        }
                      />
                    </label>
                  </div>
                  <div className="col-12 col-md-6">
                    <label>
                      {t("Aporte mensual")}
                      <input
                        className="form-control"
                        type="number"
                        value={form.monthlyContribution}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            monthlyContribution: event.target.value,
                          }))
                        }
                      />
                    </label>
                  </div>
                </>
              )}
              <div className="col-12 col-md-6">
                <label>
                  {t("Interés anual (%)")}
                  <input
                    className="form-control"
                    type="number"
                    value={form.annualRate}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, annualRate: event.target.value }))
                    }
                  />
                </label>
              </div>
              <div className="col-12 col-md-6">
                <label>
                  {t("Plazo (años)")}
                  <input
                    className="form-control"
                    type="number"
                    value={form.termYears}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, termYears: event.target.value }))
                    }
                  />
                </label>
              </div>
              <div className="col-12 col-md-6">
                <label>
                  {t("Plazo (meses)")}
                  <input
                    className="form-control"
                    type="number"
                    value={form.termMonths}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, termMonths: event.target.value }))
                    }
                  />
                </label>
              </div>
              <div className="col-12">
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={form.includeExplanation}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        includeExplanation: event.target.checked,
                      }))
                    }
                  />
                  <span>{t("Generar explicación con IA")}</span>
                </label>
              </div>
            </div>
            <div className="form-actions">
              <button className="btn primary" onClick={handleSubmit} disabled={busy}>
                {busy ? t("Simulando...") : t("Crear simulación")}
              </button>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-6">
          <div className="card">
            <h4>{t("Resultado")}</h4>
            {!selected ? (
              <div className="muted">{t("Selecciona una simulación")}</div>
            ) : (
              <div className="mini-list">
                <div className="mini-row">
                  <span>{t("Tipo")}</span>
                  <span>{selected.summary.type}</span>
                </div>
                <div className="mini-row">
                  <span>{t("Estado")}</span>
                  <span>{selected.summary.status}</span>
                </div>
                {selected.result && (
                  <div className="mini-row">
                    <span>{t("Resultado")}</span>
                    <span>{JSON.stringify(selected.result)}</span>
                  </div>
                )}
                {selected.explanation && (
                  <div className="mini-row">
                    <span>{t("Explicación")}</span>
                    <span>{selected.explanation}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="col-12">
          <div className="card">
            <h4>{t("Simulaciones recientes")}</h4>
            {simulations.length === 0 ? (
              <div className="muted">{t("No hay simulaciones registradas.")}</div>
            ) : (
              <DataTable
                columns={columns}
                data={simulations}
                getRowId={(row) => row.id}
                filterKeys={["title", "type", "status"]}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
