import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ApiError, fetchWithAuth } from "../../../infrastructure/api/api";
import { getServiceCode, getTenantId } from "../../../infrastructure/config/env";
import { useUploadManager } from "../../../infrastructure/hooks/useUploadManager";
import type { ChatAttachment } from "../../../interfaces";

interface AssessmentSummary {
  id: string;
  title: string;
  assessmentType: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  result?: Record<string, any> | null;
}

interface AssessmentDetail {
  summary: AssessmentSummary;
  input: Record<string, any> | null;
  result: Record<string, any> | null;
  report?: string;
  model?: string;
}

const buildItem = () => ({
  question: "",
  answer: "",
  score: "3",
  evidence: "",
});

const defaultForm = {
  title: "",
  assessmentType: "compliance",
  framework: "",
  notes: "",
  includeReport: true,
  items: [buildItem()],
};

const buildEndpoint = (tenantId: string, serviceCode: string) =>
  `/tenants/${tenantId}/services/${serviceCode}/self-assessments`;

export const SelfAssessmentPage = () => {
  const { t } = useTranslation("common");
  const [form, setForm] = useState(defaultForm);
  const [assessments, setAssessments] = useState<AssessmentSummary[]>([]);
  const [current, setCurrent] = useState<AssessmentDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tenantId = getTenantId();
  const serviceCode = getServiceCode();

  const {
    attachments,
    isUploading,
    error: uploadError,
    handleFilesSelected,
    uploadPending,
    removeAttachment,
    clearAttachments,
  } = useUploadManager();

  const endpoint = useMemo(() => {
    if (!tenantId || !serviceCode) return "";
    return buildEndpoint(tenantId, serviceCode);
  }, [tenantId, serviceCode]);

  const loadList = async () => {
    if (!endpoint) {
      setError(t("assessment_error_missing_service"));
      return;
    }
    setListLoading(true);
    setError(null);
    try {
      const data = await fetchWithAuth<AssessmentSummary[]>(endpoint);
      setAssessments(data || []);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message || t("assessment_error_generic"));
    } finally {
      setListLoading(false);
    }
  };

  const loadDetail = async (id: string) => {
    if (!endpoint) return;
    setLoading(true);
    setError(null);
    try {
      const detail = await fetchWithAuth<AssessmentDetail>(`${endpoint}/${id}`);
      setCurrent(detail);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message || t("assessment_error_generic"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadList();
  }, [endpoint]);

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
    setForm((prev) => ({ ...prev, items: [...prev.items, buildItem()] }));
  };

  const removeItem = (index: number) => {
    setForm((prev) => {
      const next = prev.items.filter((_, idx) => idx !== index);
      return { ...prev, items: next.length ? next : [buildItem()] };
    });
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

  const buildAttachmentPayload = (files: ChatAttachment[]) =>
    files.map((att) => ({
      fileId: att.fileId,
      url: att.url,
      name: att.filename || att.name,
      contentType: att.mimeType || att.contentType,
      size: att.sizeBytes || att.size,
      storageKey: att.storageKey,
      provider: att.provider,
    }));

  const handleSubmit = async () => {
    if (!endpoint) {
      setError(t("assessment_error_missing_service"));
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const uploaded = await uploadPending();
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
        attachments: buildAttachmentPayload(uploaded),
      };

      const detail = await fetchWithAuth<AssessmentDetail>(endpoint, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setCurrent(detail);
      setForm(defaultForm);
      clearAttachments();
      await loadList();
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message || t("assessment_error_generic"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="assessment-page">
      <div className="assessment-hero">
        <div>
          <h2>{t("assessment_title")}</h2>
          <p>{t("assessment_subtitle")}</p>
        </div>
        <span className="assessment-pill">{t("assessment_type_label")}</span>
      </div>

      {error && <div className="assessment-error">{error}</div>}

      <div className="assessment-grid">
        <div className="assessment-card">
          <h3>{t("assessment_form_title")}</h3>
          <div className="assessment-form">
            <label className="assessment-field">
              <span>{t("assessment_type_label")}</span>
              <select
                value={form.assessmentType}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    assessmentType: event.target.value,
                  }))
                }
              >
                <option value="compliance">{t("assessment_type_compliance")}</option>
                <option value="maturity">{t("assessment_type_maturity")}</option>
                <option value="academic">{t("assessment_type_academic")}</option>
                <option value="safety">{t("assessment_type_safety")}</option>
                <option value="esg">{t("assessment_type_esg")}</option>
                <option value="general">{t("assessment_type_general")}</option>
              </select>
            </label>

            <label className="assessment-field">
              <span>{t("assessment_title_label")}</span>
              <input
                value={form.title}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, title: event.target.value }))
                }
                placeholder={t("assessment_title_placeholder")}
              />
            </label>

            <label className="assessment-field">
              <span>{t("assessment_framework_label")}</span>
              <input
                value={form.framework}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, framework: event.target.value }))
                }
                placeholder={t("assessment_framework_placeholder")}
              />
            </label>

            <label className="assessment-field">
              <span>{t("assessment_notes_label")}</span>
              <textarea
                rows={3}
                value={form.notes}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, notes: event.target.value }))
                }
              />
            </label>
          </div>

          <div className="assessment-divider" />

          <h4>{t("assessment_items_title")}</h4>
          <div className="assessment-items">
            {form.items.map((item, index) => (
              <div className="assessment-item" key={`item-${index}`}>
                <label className="assessment-field">
                  <span>{t("assessment_question_label")}</span>
                  <input
                    value={item.question}
                    onChange={(event) =>
                      handleItemChange(index, "question", event.target.value)
                    }
                  />
                </label>
                <label className="assessment-field">
                  <span>{t("assessment_answer_label")}</span>
                  <textarea
                    rows={3}
                    value={item.answer}
                    onChange={(event) =>
                      handleItemChange(index, "answer", event.target.value)
                    }
                  />
                </label>
                <div className="assessment-row">
                  <label className="assessment-field">
                    <span>{t("assessment_score_label")}</span>
                    <input
                      type="number"
                      min={0}
                      max={5}
                      value={item.score}
                      onChange={(event) =>
                        handleItemChange(index, "score", event.target.value)
                      }
                    />
                  </label>
                  <label className="assessment-field grow">
                    <span>{t("assessment_evidence_label")}</span>
                    <input
                      value={item.evidence}
                      onChange={(event) =>
                        handleItemChange(index, "evidence", event.target.value)
                      }
                    />
                  </label>
                </div>
                <button
                  className="assess-btn ghost"
                  type="button"
                  onClick={() => removeItem(index)}
                >
                  {t("assessment_remove_item")}
                </button>
              </div>
            ))}
            <button className="assess-btn" type="button" onClick={addItem}>
              {t("assessment_add_item")}
            </button>
          </div>

          <div className="assessment-divider" />

          <div className="assessment-attachments">
            <div>
              <h4>{t("assessment_attachments_title")}</h4>
              <p className="muted">{t("assessment_attachments_hint")}</p>
            </div>
            <input
              type="file"
              multiple
              onChange={(event) => handleFilesSelected(event.target.files)}
            />
          </div>
          {uploadError && <div className="assessment-error">{uploadError}</div>}
          {attachments.length > 0 ? (
            <div className="assessment-files">
              {attachments.map((att) => (
                <div key={att.key} className="assessment-file">
                  <div>
                    <strong>{att.filename}</strong>
                    <span className="muted">{att.mimeType}</span>
                  </div>
                  <button
                    className="assess-btn ghost"
                    type="button"
                    onClick={() => removeAttachment(att.key)}
                  >
                    {t("assessment_remove_item")}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="muted">{t("assessment_attachments_empty")}</div>
          )}

          <div className="assessment-divider" />

          <label className="assessment-checkbox">
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
            <span>{t("assessment_include_report")}</span>
          </label>

          <button
            className="assess-btn primary"
            type="button"
            onClick={handleSubmit}
            disabled={loading || isUploading}
          >
            {loading || isUploading
              ? t("assessment_submit_loading")
              : t("assessment_submit")}
          </button>
        </div>

        <div className="assessment-card">
          <h3>{t("assessment_history_title")}</h3>
          {listLoading ? (
            <div className="muted">{t("assessment_loading")}</div>
          ) : assessments.length === 0 ? (
            <div className="muted">{t("assessment_no_results")}</div>
          ) : (
            <div className="assessment-list">
              {assessments.map((item) => (
                <button
                  className="assessment-list-item"
                  key={item.id}
                  onClick={() => loadDetail(item.id)}
                  type="button"
                >
                  <div>
                    <strong>{item.title || t("assessment_untitled")}</strong>
                    <span className="muted">
                      {item.assessmentType} · {formatDate(item.createdAt)}
                    </span>
                  </div>
                  <span className="assessment-tag">{item.status}</span>
                </button>
              ))}
            </div>
          )}

          {current && (
            <div className="assessment-result">
              <h4>{current.summary.title || t("assessment_untitled")}</h4>
              <div className="assessment-metrics">
                <div>
                  <span>{t("assessment_level_label")}</span>
                  <strong>{current.result?.level ?? "—"}</strong>
                </div>
                <div>
                  <span>{t("assessment_score_label_short")}</span>
                  <strong>{current.result?.scorePercent ?? "—"}%</strong>
                </div>
              </div>
              {current.report && (
                <div className="assessment-report">
                  <h5>{t("assessment_report_title")}</h5>
                  <pre>{current.report}</pre>
                </div>
              )}
              {current.result?.recommendations && (
                <div className="assessment-report">
                  <h5>{t("assessment_recommendations_title")}</h5>
                  <ul>
                    {current.result.recommendations.map(
                      (rec: string, idx: number) => (
                        <li key={`rec-${idx}`}>{rec}</li>
                      ),
                    )}
                  </ul>
                </div>
              )}
              {current.result?.gaps && (
                <div className="assessment-report">
                  <h5>{t("assessment_gaps_title")}</h5>
                  <ul>
                    {current.result.gaps.map((gap: any, idx: number) => (
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
    </section>
  );
};
