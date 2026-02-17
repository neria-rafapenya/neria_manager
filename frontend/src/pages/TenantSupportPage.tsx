import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { PageWithDocs } from "../components/PageWithDocs";
import { DataTable } from "../components/DataTable";
import { useAuth } from "../auth";
import { useI18n } from "../i18n/I18nProvider";
import type { ChatAttachment, ChatConversation, ChatMessage, ChatUserSummary } from "../types";

const HANDOFF_POLL_MS = 8000;
const MESSAGE_POLL_MS = 5000;

export function TenantSupportPage() {
  const { tenantId } = useParams();
  const navigate = useNavigate();
  const { role, tenantId: authTenantId } = useAuth();
  const { t } = useI18n();

  const [handoffs, setHandoffs] = useState<ChatConversation[]>([]);
  const [chatUsers, setChatUsers] = useState<ChatUserSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageDraft, setMessageDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (role !== "tenant" || !authTenantId || !tenantId) {
      return;
    }
    if (tenantId !== authTenantId) {
      navigate(`/clients/${authTenantId}/support`, { replace: true });
    }
  }, [role, authTenantId, tenantId, navigate]);

  useEffect(() => {
    if (!tenantId) {
      return;
    }
    let active = true;
    const load = async () => {
      try {
        const [handoffList, usersList] = await Promise.all([
          api.listChatHandoffs(tenantId),
          api.listChatUsers(tenantId),
        ]);
        if (!active) return;
        setHandoffs((handoffList as ChatConversation[]) || []);
        setChatUsers((usersList as ChatUserSummary[]) || []);
        setError(null);
      } catch (err: any) {
        if (active) {
          setError(err.message || t("Error cargando solicitudes de handoff"));
        }
      }
    };
    load();
    const interval = window.setInterval(load, HANDOFF_POLL_MS);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [tenantId, t]);

  useEffect(() => {
    if (!tenantId || !activeConversationId) {
      setMessages([]);
      return;
    }
    let active = true;
    const loadMessages = async () => {
      try {
        const list = await api.listChatMessages(tenantId, activeConversationId);
        if (!active) return;
        setMessages((list as ChatMessage[]) || []);
        setError(null);
      } catch (err: any) {
        if (active) {
          setError(err.message || t("Error cargando mensajes"));
        }
      }
    };
    loadMessages();
    const interval = window.setInterval(loadMessages, MESSAGE_POLL_MS);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [tenantId, activeConversationId, t]);

  const activeConversation = useMemo(
    () => handoffs.find((item) => item.id === activeConversationId) || null,
    [handoffs, activeConversationId],
  );

  const handleAccept = async (conversationId: string) => {
    if (!tenantId) return;
    setBusy(true);
    try {
      await api.acceptChatHandoff(tenantId, conversationId);
      const refreshed = await api.listChatHandoffs(tenantId);
      setHandoffs((refreshed as ChatConversation[]) || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || t("Error aceptando handoff"));
    } finally {
      setBusy(false);
    }
  };

  const handleResolve = async (conversationId: string) => {
    if (!tenantId) return;
    setBusy(true);
    try {
      await api.resolveChatHandoff(tenantId, conversationId);
      const refreshed = await api.listChatHandoffs(tenantId);
      setHandoffs((refreshed as ChatConversation[]) || []);
      setError(null);
      if (activeConversationId === conversationId) {
        setActiveConversationId(null);
      }
    } catch (err: any) {
      setError(err.message || t("Error resolviendo handoff"));
    } finally {
      setBusy(false);
    }
  };

  const handleSendMessage = async () => {
    if (!tenantId || !activeConversationId || !messageDraft.trim()) {
      return;
    }
    setBusy(true);
    try {
      await api.addHumanChatMessage(tenantId, activeConversationId, {
        content: messageDraft.trim(),
      });
      setMessageDraft("");
      const list = await api.listChatMessages(tenantId, activeConversationId);
      setMessages((list as ChatMessage[]) || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || t("Error enviando mensaje"));
    } finally {
      setBusy(false);
    }
  };

  const parseAttachments = (raw: ChatMessage["attachments"]): ChatAttachment[] => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw as ChatAttachment[];
    if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? (parsed as ChatAttachment[]) : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  return (
    <PageWithDocs slug="tenant-services">
      {error && <div className="error-banner">{error}</div>}
      <div className="card full-width">
        <div className="card-header">
          <div>
            <div className="eyebrow">{t("Handoff humano")}</div>
            <h2>{t("Atención humana")}</h2>
            <p className="muted">
              {t(
                "Solicitudes activas para que un agente responda al usuario en lugar del LLM.",
              )}
            </p>
          </div>
        </div>
        <DataTable
          columns={[
            {
              key: "title",
              label: t("Conversación"),
              sortable: true,
              render: (conversation: ChatConversation) =>
                conversation.title || t("Sin título"),
            },
            {
              key: "user",
              label: t("Usuario"),
              sortable: true,
              render: (conversation: ChatConversation) =>
                chatUsers.find((user) => user.id === conversation.userId)?.email ||
                conversation.userId,
            },
            {
              key: "status",
              label: t("Estado"),
              sortable: true,
              render: (conversation: ChatConversation) =>
                conversation.handoffStatus || "—",
            },
            {
              key: "requested",
              label: t("Solicitado"),
              sortable: true,
              render: (conversation: ChatConversation) =>
                conversation.handoffRequestedAt
                  ? new Date(conversation.handoffRequestedAt).toLocaleString()
                  : "—",
            },
            {
              key: "actions",
              label: t("Acciones"),
              render: (conversation: ChatConversation) => (
                <div className="row-actions">
                  <button
                    className="link"
                    onClick={() => setActiveConversationId(conversation.id)}
                    disabled={busy}
                  >
                    {t("Ver")}
                  </button>
                  {conversation.handoffStatus === "requested" && (
                    <button
                      className="link"
                      onClick={() => handleAccept(conversation.id)}
                      disabled={busy}
                    >
                      {t("Aceptar")}
                    </button>
                  )}
                  <button
                    className="link danger"
                    onClick={() => handleResolve(conversation.id)}
                    disabled={busy}
                  >
                    {t("Resolver")}
                  </button>
                </div>
              ),
            },
          ]}
          data={handoffs}
          getRowId={(conversation) => conversation.id}
          pageSize={6}
          filterKeys={["title", "userId", "handoffStatus"]}
        />
        {handoffs.length === 0 && (
          <div className="muted">{t("Sin solicitudes pendientes.")}</div>
        )}
      </div>

      <div className="card full-width">
        <div className="card-header">
          <div>
            <div className="eyebrow">{t("Conversación activa")}</div>
            <h2>{activeConversation?.title || t("Selecciona una conversación")}</h2>
            {activeConversation?.handoffReason && (
              <p className="muted">{activeConversation.handoffReason}</p>
            )}
          </div>
        </div>
        {activeConversation ? (
          <>
            <div className="mini-list conversation-messages">
              {messages.map((message) => {
                const attachments = parseAttachments(message.attachments);
                return (
                  <div className="mini-row" key={message.id}>
                    <span className="muted">{message.role}</span>
                    <span>
                      {message.content}
                      {attachments.length > 0 && (
                        <div className="muted">
                          {attachments.map((attachment, index) => (
                            <div key={`${message.id}-att-${index}`}>
                              {attachment.name || t("Adjunto")}: {attachment.url}
                            </div>
                          ))}
                        </div>
                      )}
                    </span>
                    <span>{new Date(message.createdAt).toLocaleString()}</span>
                  </div>
                );
              })}
              {messages.length === 0 && (
                <div className="muted">{t("Sin mensajes.")}</div>
              )}
            </div>
            <div className="form-grid" style={{ marginTop: 16 }}>
              <label>
                {t("Responder como humano")}
                <textarea
                  className="form-control"
                  rows={3}
                  value={messageDraft}
                  onChange={(event) => setMessageDraft(event.target.value)}
                  placeholder={t("Escribe la respuesta...")}
                />
              </label>
              <div className="form-actions">
                <button
                  className="btn primary"
                  onClick={handleSendMessage}
                  disabled={busy || !messageDraft.trim()}
                >
                  {t("Enviar")}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="muted">{t("Selecciona una conversación para responder.")}</div>
        )}
      </div>
    </PageWithDocs>
  );
}
