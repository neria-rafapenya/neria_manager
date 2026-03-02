import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { DataTable } from "../components/DataTable";
import { useI18n } from "../i18n/I18nProvider";
import { emitToast } from "../toast";
import type { TaxAssistantDetail, TaxAssistantSummary } from "../types";

const buildItem = () => ({ label: "", category: "", amount: "" });

const defaultIncomeItems = [
  { label: "Rendimientos del trabajo", category: "trabajo", amount: "" },
  { label: "Actividad economica / autonomo", category: "autonomo", amount: "" },
  { label: "Capital mobiliario", category: "capital", amount: "" },
  { label: "Alquileres", category: "alquiler", amount: "" },
];

const defaultDeductionItems = [
  { label: "Plan de pensiones", category: "ahorro", amount: "" },
  { label: "Hipoteca vivienda habitual", category: "vivienda", amount: "" },
  { label: "Donativos", category: "donaciones", amount: "" },
  { label: "Guarderia", category: "familia", amount: "" },
];

const buildDefaultItems = (items: typeof defaultIncomeItems) =>
  items.map((item) => ({ ...item }));

const emptyForm = {
  title: "",
  taxYear: new Date().getFullYear() - 1,
  region: "general",
  filingType: "individual",
  residency: "residente",
  dependents: 0,
  notes: "",
  includeSummary: true,
  incomes: buildDefaultItems(defaultIncomeItems),
  deductions: buildDefaultItems(defaultDeductionItems),
};

type TenantServiceTaxAssistantPageProps = {
  defaultServiceCode?: string;
};

export function TenantServiceTaxAssistantPage({
  defaultServiceCode,
}: TenantServiceTaxAssistantPageProps = {}) {
  const params = useParams();
  const tenantId = params.tenantId;
  const serviceCode = params.serviceCode ?? defaultServiceCode;
  const navigate = useNavigate();
  const { t } = useI18n();

  const [cases, setCases] = useState<TaxAssistantSummary[]>([]);
  const [selected, setSelected] = useState<TaxAssistantDetail | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCases = async () => {
    if (!tenantId || !serviceCode) return;
    setError(null);
    try {
      const data = (await api.listTenantServiceTaxAssistant(
        tenantId,
        serviceCode,
      )) as TaxAssistantSummary[];
      setCases(data || []);
    } catch (err: any) {
      setError(err.message || t("No se pudieron cargar los casos"));
    }
  };

  const loadDetail = async (caseId: string) => {
    if (!tenantId || !serviceCode) return;
    setBusy(true);
    setError(null);
    try {
      const detail = (await api.getTenantServiceTaxAssistant(
        tenantId,
        serviceCode,
        caseId,
      )) as TaxAssistantDetail;
      setSelected(detail);
    } catch (err: any) {
      setError(err.message || t("No se pudo cargar el detalle"));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!tenantId || !serviceCode) return;
    loadCases();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, serviceCode]);

  const handleItemChange = (
    list: "incomes" | "deductions",
    index: number,
    key: "label" | "category" | "amount",
    value: string,
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
    if (!tenantId || !serviceCode) {
      setError(t("Selecciona un servicio para continuar."));
      return;
    }
    setBusy(true);
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
        .filter((item) => item.label.trim().length > 0 || item.amount)
        .map((item) => ({
          label: item.label,
          category: item.category || undefined,
          amount: Number(item.amount) || 0,
        })),
      deductions: form.deductions
        .filter((item) => item.label.trim().length > 0 || item.amount)
        .map((item) => ({
          label: item.label,
          category: item.category || undefined,
          amount: Number(item.amount) || 0,
        })),
    };

    try {
      const detail = (await api.createTenantServiceTaxAssistant(
        tenantId,
        serviceCode,
        payload,
      )) as TaxAssistantDetail;
      setSelected(detail);
      await loadCases();
      emitToast(t("Caso creado"));
    } catch (err: any) {
      setError(err.message || t("No se pudo crear el caso"));
    } finally {
      setBusy(false);
    }
  };

  const columns = useMemo(
    () => [
      { key: "title", label: t("Titulo"), sortable: true },
      { key: "taxYear", label: t("Ejercicio"), sortable: true },
      { key: "status", label: t("Estado"), sortable: true },
      {
        key: "createdAt",
        label: t("Creado"),
        sortable: true,
        render: (row: TaxAssistantSummary) =>
          row.createdAt ? new Date(row.createdAt).toLocaleString() : "—",
      },
      {
        key: "actions",
        label: t("Acciones"),
        render: (row: TaxAssistantSummary) => (
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
          <div className="eyebrow">{t("Asistente renta")}</div>
          <h2>{t("Declaracion de la renta")}</h2>
          <p className="muted">
            {t(
              "Recoge ingresos y deducciones, genera checklist y un borrador explicativo sin valor legal.",
            )}
          </p>
        </div>
        <div className="row-actions">
          <button
            className="btn"
            onClick={() => navigate(`/clients/${tenantId}/services/${serviceCode}`)}
          >
            {t("Volver al servicio")}
          </button>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="row g-4">
        <div className="col-12 col-xl-6">
          <div className="card">
            <h4>{t("Nuevo caso")}</h4>
            <div className="row g-3 form-grid-13">
              <div className="col-12 col-md-6">
                <label>
                  {t("Ejercicio fiscal")}
                  <input
                    className="form-control"
                    type="number"
                    value={form.taxYear}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        taxYear: Number(event.target.value),
                      }))
                    }
                  />
                </label>
              </div>
              <div className="col-12 col-md-6">
                <label>
                  {t("Region")}
                  <input
                    className="form-control"
                    value={form.region}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, region: event.target.value }))
                    }
                  />
                </label>
              </div>
              <div className="col-12 col-md-6">
                <label>
                  {t("Tipo de declaracion")}
                  <select
                    className="form-select"
                    value={form.filingType}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        filingType: event.target.value,
                      }))
                    }
                  >
                    <option value="individual">{t("Individual")}</option>
                    <option value="conjunta">{t("Conjunta")}</option>
                  </select>
                </label>
              </div>
              <div className="col-12 col-md-6">
                <label>
                  {t("Residencia")}
                  <select
                    className="form-select"
                    value={form.residency}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        residency: event.target.value,
                      }))
                    }
                  >
                    <option value="residente">{t("Residente")}</option>
                    <option value="no_residente">{t("No residente")}</option>
                  </select>
                </label>
              </div>
              <div className="col-12 col-md-6">
                <label>
                  {t("Dependientes")}
                  <input
                    className="form-control"
                    type="number"
                    value={form.dependents}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        dependents: Number(event.target.value),
                      }))
                    }
                  />
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
                    placeholder={t("Ej: Renta familiar 2024")}
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
              <div className="col-12">
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={form.includeSummary}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        includeSummary: event.target.checked,
                      }))
                    }
                  />
                  {t("Generar resumen con IA")}
                </label>
              </div>
            </div>

            <div className="divider" />

            <h4>{t("Ingresos")}</h4>
            <div className="row g-3">
              {form.incomes.map((item, idx) => (
                <div className="col-12" key={`income-${idx}`}>
                  <div className="row g-2 align-items-end">
                    <div className="col-12 col-md-6">
                      <input
                        className="form-control"
                        value={item.label}
                        onChange={(event) =>
                          handleItemChange("incomes", idx, "label", event.target.value)
                        }
                        placeholder={t("Concepto")}
                      />
                    </div>
                    <div className="col-6 col-md-3">
                      <input
                        className="form-control"
                        value={item.amount}
                        onChange={(event) =>
                          handleItemChange("incomes", idx, "amount", event.target.value)
                        }
                        placeholder={t("Importe")}
                      />
                    </div>
                    <div className="col-6 col-md-3">
                      <button
                        className="btn"
                        type="button"
                        onClick={() => removeItem("incomes", idx)}
                      >
                        {t("Quitar")}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              <div className="col-12">
                <button className="btn" type="button" onClick={() => addItem("incomes")}>
                  {t("Agregar ingreso")}
                </button>
              </div>
            </div>

            <div className="divider" />

            <h4>{t("Deducciones")}</h4>
            <div className="row g-3">
              {form.deductions.map((item, idx) => (
                <div className="col-12" key={`deduction-${idx}`}>
                  <div className="row g-2 align-items-end">
                    <div className="col-12 col-md-6">
                      <input
                        className="form-control"
                        value={item.label}
                        onChange={(event) =>
                          handleItemChange("deductions", idx, "label", event.target.value)
                        }
                        placeholder={t("Concepto")}
                      />
                    </div>
                    <div className="col-6 col-md-3">
                      <input
                        className="form-control"
                        value={item.amount}
                        onChange={(event) =>
                          handleItemChange("deductions", idx, "amount", event.target.value)
                        }
                        placeholder={t("Importe")}
                      />
                    </div>
                    <div className="col-6 col-md-3">
                      <button
                        className="btn"
                        type="button"
                        onClick={() => removeItem("deductions", idx)}
                      >
                        {t("Quitar")}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              <div className="col-12">
                <button className="btn" type="button" onClick={() => addItem("deductions")}>
                  {t("Agregar deduccion")}
                </button>
              </div>
            </div>

            <div className="row-actions" style={{ marginTop: 16 }}>
              <button className="btn primary" onClick={handleSubmit} disabled={busy}>
                {busy ? t("Procesando...") : t("Generar borrador")}
              </button>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-6">
          <div className="card">
            <h4>{t("Casos recientes")}</h4>
            <DataTable
              columns={columns}
              data={cases}
              getRowId={(row) => row.id}
              pageSize={6}
              filterKeys={["title", "status", "taxYear", "region"]}
            />
          </div>

          {selected && (
            <div className="card" style={{ marginTop: 16 }}>
              <h4>{t("Detalle")}</h4>
              <div className="mini-list">
                <div className="mini-row">
                  <span>{t("Titulo")}</span>
                  <span>{selected.summary.title}</span>
                </div>
                <div className="mini-row">
                  <span>{t("Ejercicio")}</span>
                  <span>{selected.summary.taxYear || "—"}</span>
                </div>
                <div className="mini-row">
                  <span>{t("Region")}</span>
                  <span>{selected.summary.region || "—"}</span>
                </div>
                <div className="mini-row">
                  <span>{t("Estado")}</span>
                  <span>{selected.summary.status}</span>
                </div>
              </div>
              {selected.report && (
                <div className="muted" style={{ marginTop: 12 }}>
                  {selected.report}
                </div>
              )}
              {selected.result && (
                <pre className="code-block" style={{ marginTop: 12 }}>
                  {JSON.stringify(selected.result, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
