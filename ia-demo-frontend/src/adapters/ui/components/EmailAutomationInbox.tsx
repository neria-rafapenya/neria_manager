import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import DOMPurify from "dompurify";
import { API_ENDPOINTS } from "../../../core/domain/constants/apiEndpoints";
import { fetchWithAuth } from "../../../infrastructure/api/api";
import { getServiceCode } from "../../../infrastructure/config/env";
import type { EmailMessage } from "../../../interfaces/EmailMessage";

const formatDate = (value?: string | null): string => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
};

const normalizeLabel = (value?: string | null, fallback = "—") => {
  if (!value) return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
};

export const EmailAutomationInbox = () => {
  const { t } = useTranslation("common");
  const serviceCode = getServiceCode();
  const [messages, setMessages] = useState<EmailMessage[]>([]);
  const [search, setSearch] = useState("");
  const [intentFilter, setIntentFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"text" | "html">("text");
  const [showImages, setShowImages] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMessages = useCallback(async () => {
    if (!serviceCode) {
      setError(t("email_error_missing_service"));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWithAuth<EmailMessage[]>(
        API_ENDPOINTS.EMAIL_MESSAGES(serviceCode, 50)
      );
      setMessages(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.message || t("email_error_generic"));
    } finally {
      setLoading(false);
    }
  }, [serviceCode, t]);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  const intentOptions = useMemo(() => {
    const values = new Set<string>();
    messages.forEach((msg) => {
      if (msg.intent) values.add(msg.intent);
    });
    return ["all", ...Array.from(values)];
  }, [messages]);

  const priorityOptions = useMemo(() => {
    const values = new Set<string>();
    messages.forEach((msg) => {
      if (msg.priority) values.add(msg.priority);
    });
    return ["all", ...Array.from(values)];
  }, [messages]);

  const actionOptions = useMemo(() => {
    const values = new Set<string>();
    messages.forEach((msg) => {
      if (msg.actionStatus) values.add(msg.actionStatus);
      else if (msg.actionType) values.add(msg.actionType);
    });
    return ["all", ...Array.from(values)];
  }, [messages]);

  const filteredMessages = useMemo(() => {
    const query = search.trim().toLowerCase();
    return messages.filter((msg) => {
      if (
        query &&
        ![
          msg.subject,
          msg.fromEmail,
          msg.fromName,
          msg.intent,
          msg.priority,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query))
      ) {
        return false;
      }
      if (intentFilter !== "all" && msg.intent !== intentFilter) {
        return false;
      }
      if (priorityFilter !== "all" && msg.priority !== priorityFilter) {
        return false;
      }
      const actionValue = msg.actionStatus || msg.actionType || "";
      if (actionFilter !== "all" && actionValue !== actionFilter) {
        return false;
      }
      return true;
    });
  }, [messages, search, intentFilter, priorityFilter, actionFilter]);

  useEffect(() => {
    if (filteredMessages.length === 0) {
      setActiveId(null);
      return;
    }
    if (!activeId || !filteredMessages.some((msg) => msg.id === activeId)) {
      setActiveId(filteredMessages[0].id);
    }
  }, [filteredMessages, activeId]);

  const activeMessage = useMemo(
    () => filteredMessages.find((msg) => msg.id === activeId) || null,
    [filteredMessages, activeId]
  );

  const activeAccountLabel = useMemo(() => {
    if (activeMessage?.accountLabel) return activeMessage.accountLabel;
    const fallback = filteredMessages.find((msg) => msg.accountLabel)?.accountLabel;
    return fallback || "—";
  }, [activeMessage, filteredMessages]);

  const sanitizedHtml = useMemo(() => {
    if (!activeMessage?.bodyHtml) return "";
    const forbidden = showImages ? ["svg", "style"] : ["img", "svg", "style"];
    return DOMPurify.sanitize(activeMessage.bodyHtml, {
      FORBID_TAGS: forbidden,
    });
  }, [activeMessage, showImages]);

  return (
    <section className="email-automation-shell">
      <div className="email-automation-topbar">
        <div>
          <h2>{t("email_title")}</h2>
          <p>{t("email_subtitle")}</p>
        </div>
        <p className="email-automation-llm-note">
          El LLM clasifica y resume cada correo para priorizar y sugerir la
          acción adecuada.
        </p>
        <button
          className="ea-btn"
          type="button"
          onClick={() => void loadMessages()}
          disabled={loading}
        >
          {loading ? t("email_refreshing") : t("email_refresh")}
        </button>
      </div>

      {error && <div className="ea-alert error">{error}</div>}
      {!error && loading && (
        <div className="ea-alert">{t("email_loading")}</div>
      )}

      <div className="email-automation-filters">
        <div className="email-filter">
          <span>{t("email_filter_search")}</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("email_filter_search_placeholder")}
          />
        </div>
        <div className="email-filter">
          <span>{t("email_filter_intent")}</span>
          <select
            value={intentFilter}
            onChange={(event) => setIntentFilter(event.target.value)}
          >
            {intentOptions.map((value) => (
              <option key={value} value={value}>
                {value === "all"
                  ? t("email_filter_all")
                  : normalizeLabel(value)}
              </option>
            ))}
          </select>
        </div>
        <div className="email-filter">
          <span>{t("email_filter_priority")}</span>
          <select
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value)}
          >
            {priorityOptions.map((value) => (
              <option key={value} value={value}>
                {value === "all"
                  ? t("email_filter_all")
                  : normalizeLabel(value)}
              </option>
            ))}
          </select>
        </div>
        <div className="email-filter">
          <span>{t("email_filter_action")}</span>
          <select
            value={actionFilter}
            onChange={(event) => setActionFilter(event.target.value)}
          >
            {actionOptions.map((value) => (
              <option key={value} value={value}>
                {value === "all"
                  ? t("email_filter_all")
                  : normalizeLabel(value)}
              </option>
            ))}
          </select>
        </div>
        <button
          className="ea-btn ghost"
          type="button"
          onClick={() => {
            setSearch("");
            setIntentFilter("all");
            setPriorityFilter("all");
            setActionFilter("all");
          }}
        >
          {t("email_filter_clear")}
        </button>
      </div>

      <div className="email-automation-grid">
        <aside className="email-automation-list">
          <div className="email-automation-list-header">
            <div>
              <span>{t("email_inbox")}</span>
              <span className="email-automation-account">
                Cuenta: {normalizeLabel(activeAccountLabel)}
              </span>
            </div>
            <span className="email-automation-count">
              {filteredMessages.length}
            </span>
          </div>
          {filteredMessages.length === 0 && !loading && (
            <div className="email-automation-empty">
              {t("email_empty")}
            </div>
          )}
          <div className="email-automation-items">
            {filteredMessages.map((message) => (
              <button
                type="button"
                key={message.id}
                className={`email-item${
                  message.id === activeId ? " active" : ""
                }`}
                onClick={() => setActiveId(message.id)}
              >
                <div className="email-item-main">
                  <span className="email-item-subject">
                    {normalizeLabel(message.subject, t("email_no_subject"))}
                  </span>
                  <span className="email-item-from">
                    {normalizeLabel(
                      message.fromEmail || message.fromName,
                      t("email_unknown_sender")
                    )}
                  </span>
                </div>
                <div className="email-item-meta">
                  <span className="email-chip">
                    {normalizeLabel(message.intent, t("email_intent_other"))}
                  </span>
                  <span className="email-date">
                    {formatDate(message.receivedAt)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </aside>

        <section className="email-automation-detail">
          {activeMessage ? (
            <>
              <div className="email-detail-header">
                <h3>
                  {normalizeLabel(
                    activeMessage.subject,
                    t("email_no_subject")
                  )}
                </h3>
                <div className="email-detail-tags">
                  <span className="email-tag">
                    {t("email_intent")}:{" "}
                    {normalizeLabel(activeMessage.intent, t("email_intent_other"))}
                  </span>
                  <span className="email-tag">
                    {t("email_priority")}:{" "}
                    {normalizeLabel(activeMessage.priority, "—")}
                  </span>
                  <span className="email-tag">
                    {t("email_action")}:{" "}
                    {normalizeLabel(
                      activeMessage.actionStatus || activeMessage.actionType,
                      "—"
                    )}
                  </span>
                </div>
              </div>
              <div className="email-detail-meta">
                <span>
                  {t("email_from")}:{" "}
                  {normalizeLabel(
                    activeMessage.fromEmail || activeMessage.fromName,
                    t("email_unknown_sender")
                  )}
                </span>
                <span>
                  {t("email_received")}: {formatDate(activeMessage.receivedAt)}
                </span>
              </div>
              <div className="email-detail-preview">
                <div className="email-detail-preview-header">
                  <h4>{t("email_preview_title")}</h4>
                  <div className="email-view-toggle">
                    <button
                      className={`ea-btn ghost${viewMode === "text" ? " active" : ""}`}
                      type="button"
                      onClick={() => setViewMode("text")}
                    >
                      Texto
                    </button>
                    <button
                      className={`ea-btn ghost${viewMode === "html" ? " active" : ""}`}
                      type="button"
                      onClick={() => setViewMode("html")}
                    >
                      HTML
                    </button>
                  </div>
                  <label className="email-image-toggle">
                    <input
                      type="checkbox"
                      checked={showImages}
                      onChange={(event) => setShowImages(event.target.checked)}
                    />
                    Mostrar imágenes
                  </label>
                </div>
                {viewMode === "html" ? (
                  sanitizedHtml ? (
                    <div
                      className="email-html-preview"
                      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
                    />
                  ) : (
                    <p>HTML no disponible.</p>
                  )
                ) : activeMessage.bodyText ? (
                  <p>{activeMessage.bodyText}</p>
                ) : activeMessage.bodyPreview ? (
                  <p>{activeMessage.bodyPreview}</p>
                ) : (
                  <p>Sin contenido para previsualizar.</p>
                )}
                <p className="email-html-note">
                  {showImages
                    ? "Imágenes remotas habilitadas bajo demanda."
                    : "Imágenes remotas bloqueadas por seguridad."}
                </p>
              </div>
              {activeMessage.jiraIssueUrl && (
                <div className="email-detail-actions">
                  <a
                    className="ea-btn ghost"
                    href={activeMessage.jiraIssueUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t("email_view_jira")}{" "}
                    {activeMessage.jiraIssueKey || ""}
                  </a>
                </div>
              )}
              {!activeMessage.jiraIssueUrl && (
                <div className="email-detail-empty">
                  {t("email_no_jira")}
                </div>
              )}
            </>
          ) : (
            <div className="email-automation-empty">
              {t("email_empty")}
            </div>
          )}
        </section>
      </div>
    </section>
  );
};
