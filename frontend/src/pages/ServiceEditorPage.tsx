import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { PageWithDocs } from "../components/PageWithDocs";
import { FieldWithHelp } from "../components/FieldWithHelp";
import { useI18n } from "../i18n/I18nProvider";
import type { ServiceCatalogItem } from "../types";
import { emitToast } from "../toast";

const CODE_REGEX = /^[a-z0-9-]{3,64}$/;
const normalizeBool = (value: boolean | undefined | null) =>
  value == null ? true : value;

export function ServiceEditorPage() {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const isNew = !serviceId;
  const [loading, setLoading] = useState(!isNew);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    code: "",
    name: "",
    description: "",
    apiBaseUrl: "",
    priceMonthlyEur: "",
    priceAnnualEur: "",
    enabled: true,
    endpointsEnabled: true,
    humanHandoffEnabled: true,
    fileStorageEnabled: true,
    documentProcessingEnabled: false,
    ocrEnabled: false,
    semanticSearchEnabled: false,
    jiraEnabled: false,
    jiraProjectKey: "",
    jiraDefaultIssueType: "Task",
    jiraAllowUserPriorityOverride: true,
    jiraAutoLabelWithServiceName: true,
  });
  const codeValue = form.code.trim();
  const codeValid = codeValue.length > 0 && CODE_REGEX.test(codeValue);
  const priceMonthly = Number(form.priceMonthlyEur);
  const priceAnnual = Number(form.priceAnnualEur);
  const pricesValid =
    Number.isFinite(priceMonthly) &&
    Number.isFinite(priceAnnual) &&
    priceMonthly > 0 &&
    priceAnnual > 0;

  useEffect(() => {
    if (isNew) {
      return;
    }
    const load = async () => {
      try {
        setLoading(true);
        const list = await api.listServiceCatalog();
        const match = (list as ServiceCatalogItem[]).find(
          (item) => item.id === serviceId,
        );
        if (!match) {
          throw new Error(t("Servicio no encontrado"));
        }
        setForm({
          code: match.code || "",
          name: match.name || "",
          description: match.description || "",
          apiBaseUrl: match.apiBaseUrl || "",
          priceMonthlyEur: String(match.priceMonthlyEur ?? ""),
          priceAnnualEur: String(match.priceAnnualEur ?? ""),
          enabled: match.enabled,
          endpointsEnabled: normalizeBool(match.endpointsEnabled),
          humanHandoffEnabled: normalizeBool(match.humanHandoffEnabled),
          fileStorageEnabled: normalizeBool(match.fileStorageEnabled),
          documentProcessingEnabled: match.documentProcessingEnabled ?? false,
          ocrEnabled: match.ocrEnabled ?? false,
          semanticSearchEnabled: match.semanticSearchEnabled ?? false,
          jiraEnabled: match.jiraEnabled ?? false,
          jiraProjectKey: match.jiraProjectKey || "",
          jiraDefaultIssueType: match.jiraDefaultIssueType || "Task",
          jiraAllowUserPriorityOverride:
            match.jiraAllowUserPriorityOverride ?? true,
          jiraAutoLabelWithServiceName:
            match.jiraAutoLabelWithServiceName ?? true,
        });
        setError(null);
      } catch (err: any) {
        setError(err.message || t("Error cargando servicio"));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isNew, serviceId]);

  const canSubmit = useMemo(() => {
    if (!codeValid) return false;
    if (!form.name.trim()) return false;
    if (!form.description.trim()) return false;
    if (!pricesValid) return false;
    return true;
  }, [
    codeValid,
    form.name,
    form.description,
    pricesValid,
  ]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      const payload = {
        code: form.code.trim(),
        name: form.name.trim(),
        description: form.description.trim(),
        apiBaseUrl: form.apiBaseUrl.trim() || null,
        priceMonthlyEur: priceMonthly,
        priceAnnualEur: priceAnnual,
        enabled: form.enabled,
        endpointsEnabled: form.endpointsEnabled,
        humanHandoffEnabled: form.humanHandoffEnabled,
        fileStorageEnabled: form.fileStorageEnabled,
        documentProcessingEnabled: form.documentProcessingEnabled,
        ocrEnabled: form.ocrEnabled,
        semanticSearchEnabled: form.semanticSearchEnabled,
        jiraEnabled: form.jiraEnabled,
        jiraProjectKey: form.jiraProjectKey.trim() || null,
        jiraDefaultIssueType: form.jiraDefaultIssueType.trim() || null,
        jiraAllowUserPriorityOverride: form.jiraAllowUserPriorityOverride,
        jiraAutoLabelWithServiceName: form.jiraAutoLabelWithServiceName,
      };
      if (isNew) {
        await api.createServiceCatalog(payload);
        emitToast(t("Servicio creado"));
        navigate("/services");
      } else if (serviceId) {
        await api.updateServiceCatalog(serviceId, payload);
        emitToast(t("Servicio actualizado"));
      }
    } catch (err: any) {
      setError(err.message || t("Error guardando servicio"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageWithDocs slug="services">
        <div className="muted">{t("Cargando servicio...")}</div>
      </PageWithDocs>
    );
  }

  return (
    <PageWithDocs slug="services">
      <section className="grid">
        {error && <div className="error-banner">{error}</div>}
        <div className="card">
          <div className="card-header">
            <div>
              <h2>{isNew ? t("Nuevo servicio") : t("Editar servicio")}</h2>
              <p className="muted">
                {t(
                  "Configura el servicio que estará disponible para los tenants.",
                )}
              </p>
            </div>
            <Link className="btn" to="/services">
              {t("Volver")}
            </Link>
          </div>
          <div className="form-grid">
            <div className="info-banner full-row">
              {t(
                "Los endpoints se definen cuando el servicio se asigna a un tenant. Aquí solo indicamos si el servicio soporta endpoints.",
              )}
            </div>
            <FieldWithHelp help="serviceCode">
              <div className="field-stack">
                <input
                  placeholder={t("Código único (ej: chatbot-general)")}
                  value={form.code}
                  onChange={(event) =>
                    setForm({ ...form, code: event.target.value })
                  }
                />
                <span className="muted">
                  {t("Usa 3-64 caracteres en minúsculas, números o guiones.")}
                </span>
                {form.code.length > 0 && !codeValid && (
                  <div className="error-banner">
                    {t("Código inválido. Solo minúsculas, números o guiones.")}
                  </div>
                )}
              </div>
            </FieldWithHelp>
            <FieldWithHelp help="serviceName">
              <input
                placeholder={t("Nombre del servicio")}
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
              />
            </FieldWithHelp>
            <FieldWithHelp help="serviceDescription">
              <textarea
                placeholder={t("Descripción principal")}
                value={form.description}
                onChange={(event) =>
                  setForm({ ...form, description: event.target.value })
                }
                rows={3}
              />
            </FieldWithHelp>
            <FieldWithHelp help="serviceApiBaseUrl">
              <input
                placeholder={t("URL base de la API (opcional)")}
                value={form.apiBaseUrl}
                onChange={(event) =>
                  setForm({ ...form, apiBaseUrl: event.target.value })
                }
              />
            </FieldWithHelp>
            <FieldWithHelp help="servicePriceMonthly">
              <input
                type="number"
                step="0.01"
                placeholder={t("Precio mensual EUR")}
                value={form.priceMonthlyEur}
                onChange={(event) =>
                  setForm({ ...form, priceMonthlyEur: event.target.value })
                }
              />
            </FieldWithHelp>
            <FieldWithHelp help="servicePriceAnnual">
              <input
                type="number"
                step="0.01"
                placeholder={t("Precio anual EUR")}
                value={form.priceAnnualEur}
                onChange={(event) =>
                  setForm({ ...form, priceAnnualEur: event.target.value })
                }
              />
            </FieldWithHelp>
            {!pricesValid && (
              <div className="muted">
                {t("Los precios deben ser números mayores que 0.")}
              </div>
            )}
            <FieldWithHelp help="serviceEndpointsEnabled">
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={form.endpointsEnabled}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      endpointsEnabled: event.target.checked,
                    })
                  }
                />
                {t("Permite endpoints configurables")}
              </label>
            </FieldWithHelp>
            <FieldWithHelp help="serviceHumanHandoffEnabled">
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={form.humanHandoffEnabled}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      humanHandoffEnabled: event.target.checked,
                    })
                  }
                />
                {t("Permite atención humana")}
              </label>
            </FieldWithHelp>
            <FieldWithHelp help="serviceFileStorageEnabled">
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={form.fileStorageEnabled}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      fileStorageEnabled: event.target.checked,
                    })
                  }
                />
                {t("Permite adjuntos y almacenamiento")}
              </label>
            </FieldWithHelp>
            <FieldWithHelp help="serviceDocumentProcessingEnabled">
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={form.documentProcessingEnabled}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      documentProcessingEnabled: event.target.checked,
                    })
                  }
                />
                {t("Procesamiento documental (OCR + IA)")}
              </label>
            </FieldWithHelp>
            <FieldWithHelp help="serviceOcrEnabled">
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={form.ocrEnabled}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      ocrEnabled: event.target.checked,
                    })
                  }
                  disabled={!form.documentProcessingEnabled}
                />
                {t("OCR habilitado")}
              </label>
            </FieldWithHelp>
            <FieldWithHelp help="serviceSemanticEnabled">
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={form.semanticSearchEnabled}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      semanticSearchEnabled: event.target.checked,
                    })
                  }
                  disabled={!form.documentProcessingEnabled}
                />
                {t("IA semántica habilitada")}
              </label>
            </FieldWithHelp>
            <div className="section-divider full-row" />
            <div className="full-row">
              <strong>{t("Integración Jira")}</strong>
            </div>
            <FieldWithHelp help="serviceJiraEnabled">
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={form.jiraEnabled}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      jiraEnabled: event.target.checked,
                    })
                  }
                />
                {t("Habilitar Jira")}
              </label>
            </FieldWithHelp>
            <FieldWithHelp help="serviceJiraProjectKey">
              <input
                placeholder={t("Project key (ej: NER)")}
                value={form.jiraProjectKey}
                onChange={(event) =>
                  setForm({ ...form, jiraProjectKey: event.target.value })
                }
                disabled={!form.jiraEnabled}
              />
            </FieldWithHelp>
            <FieldWithHelp help="serviceJiraDefaultIssueType">
              <input
                placeholder={t("Tipo de issue por defecto (Task, Bug, Story)")}
                value={form.jiraDefaultIssueType}
                onChange={(event) =>
                  setForm({
                    ...form,
                    jiraDefaultIssueType: event.target.value,
                  })
                }
                disabled={!form.jiraEnabled}
              />
            </FieldWithHelp>
            <FieldWithHelp help="serviceJiraAllowUserPriorityOverride">
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={form.jiraAllowUserPriorityOverride}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      jiraAllowUserPriorityOverride: event.target.checked,
                    })
                  }
                  disabled={!form.jiraEnabled}
                />
                {t("Permitir prioridad definida por el usuario")}
              </label>
            </FieldWithHelp>
            <FieldWithHelp help="serviceJiraAutoLabelWithServiceName">
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={form.jiraAutoLabelWithServiceName}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      jiraAutoLabelWithServiceName: event.target.checked,
                    })
                  }
                  disabled={!form.jiraEnabled}
                />
                {t("Etiquetar con el nombre del servicio")}
              </label>
            </FieldWithHelp>
            <FieldWithHelp help="serviceEnabled">
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={form.enabled}
                  onChange={(event) =>
                    setForm({ ...form, enabled: event.target.checked })
                  }
                />
                {t("Habilitado")}
              </label>
            </FieldWithHelp>
            <div className="form-actions">
              <button
                className="btn primary"
                onClick={handleSave}
                disabled={!canSubmit || saving}
              >
                {saving ? t("Guardando...") : t("Guardar servicio")}
              </button>
              <Link className="btn" to="/services">
                {t("Cancelar")}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PageWithDocs>
  );
}
