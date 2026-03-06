import { useEffect, useMemo, useState } from "react";
import { patientApi } from "../../../infrastructure/api/clinicflowApi";
import { IconHumanChat, IconPlus, IconSend } from "./shared/icons";

type Message = {
  role: "user" | "assistant";
  content: string;
};

interface ChatBotFAQsProps {
  interactions?: unknown[];
  onRefreshInteractions?: () => Promise<void>;
}

type FaqThread = {
  id: string;
  title: string;
  createdAt: string;
  messages: Message[];
};

type FaqHandoff = {
  id: string;
  status?: string | null;
  requestedAt?: string | null;
  respondedAt?: string | null;
  responseText?: string | null;
};

export const ChatBotFAQs = (_props: ChatBotFAQsProps = {}) => {
  const [question, setQuestion] = useState("");
  const [threads, setThreads] = useState<FaqThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [handoffs, setHandoffs] = useState<FaqHandoff[]>([]);
  const [loading, setLoading] = useState(false);
  const [handoffLoading, setHandoffLoading] = useState(false);
  const [handoffNotice, setHandoffNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const STORAGE_KEY = "clinicflow_faq_threads";
  const ACTIVE_KEY = "clinicflow_faq_active_thread";

  const loadThreads = (): FaqThread[] => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as FaqThread[]) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const persistThreads = (items: FaqThread[], activeId?: string | null) => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    if (activeId) {
      window.localStorage.setItem(ACTIVE_KEY, activeId);
    }
  };

  const createThread = (): FaqThread => {
    const createdAt = new Date().toISOString();
    return {
      id: crypto.randomUUID(),
      title: `Consulta ${new Date().toLocaleDateString("es-ES")}`,
      createdAt,
      messages: [],
    };
  };

  const activeThread = useMemo(
    () => threads.find((t) => t.id === activeThreadId) || null,
    [threads, activeThreadId],
  );

  const messages = activeThread?.messages ?? [];

  useEffect(() => {
    const initialThreads = loadThreads();
    let nextThreads = initialThreads;
    if (!nextThreads.length) {
      nextThreads = [createThread()];
    }
    const storedActive = window.localStorage.getItem(ACTIVE_KEY);
    const nextActive =
      storedActive && nextThreads.find((t) => t.id === storedActive)
        ? storedActive
        : nextThreads[0].id;
    setThreads(nextThreads);
    setActiveThreadId(nextActive);

    const loadMeta = async () => {
      try {
        const handoffItems = await patientApi.listFaqHandoffs();
        setHandoffs(Array.isArray(handoffItems) ? handoffItems : []);
      } catch {
        // Ignore metadata errors silently
      }
    };
    loadMeta();
  }, []);

  useEffect(() => {
    if (threads.length === 0) return;
    persistThreads(threads, activeThreadId);
  }, [threads, activeThreadId]);

  const history = useMemo(
    () =>
      messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    [messages],
  );

  const updateThreadMessages = (nextMessages: Message[]) => {
    setThreads((prev) =>
      prev.map((thread) => {
        if (thread.id !== activeThreadId) return thread;
        const nextTitle =
          thread.title && thread.messages.length > 0
            ? thread.title
            : nextMessages
                .find((m) => m.role === "user")
                ?.content.slice(0, 40) || thread.title;
        return {
          ...thread,
          title: nextTitle,
          messages: nextMessages,
        };
      }),
    );
  };

  const ensureActiveThread = () => {
    if (activeThreadId) return activeThreadId;
    const fresh = createThread();
    setThreads((prev) => [fresh, ...prev]);
    setActiveThreadId(fresh.id);
    return fresh.id;
  };

  const handleAsk = async () => {
    if (!question.trim()) return;
    setError(null);
    ensureActiveThread();
    const content = question.trim();
    setQuestion("");
    const nextMessages: Message[] = [...messages, { role: "user", content }];
    updateThreadMessages(nextMessages);
    setLoading(true);
    try {
      const response = await patientApi.chatFaq(content, history);
      if (response?.reply) {
        updateThreadMessages([
          ...nextMessages,
          { role: "assistant", content: response.reply },
        ]);
      }
    } catch (err: any) {
      setError(err?.message || "No se pudo enviar la consulta.");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestHandoff = async () => {
    if (!messages.length) return;
    setHandoffNotice(null);
    setHandoffLoading(true);
    try {
      await patientApi.requestFaqHandoff(history);
      setHandoffNotice("Solicitud enviada. Te responderá un profesional.");
      const handoffItems = await patientApi.listFaqHandoffs();
      setHandoffs(Array.isArray(handoffItems) ? handoffItems : []);
    } catch (err: any) {
      setHandoffNotice(err?.message || "No se pudo solicitar ayuda humana.");
    } finally {
      setHandoffLoading(false);
    }
  };

  const handleCreateThread = () => {
    const fresh = createThread();
    setThreads((prev) => [fresh, ...prev]);
    setActiveThreadId(fresh.id);
    setQuestion("");
  };

  const sortedThreads = useMemo(
    () =>
      [...threads].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [threads],
  );

  const formatDate = (value?: string | null) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="card">
      <h3>Chat de dudas</h3>
      <p className="muted">
        Resolvemos dudas generales y te contactaremos si hace falta.
      </p>
      <p className="muted" style={{ fontSize: "11px", marginTop: "4px" }}>
        Tus conversaciones no se guardan en detalle en el servidor.
      </p>

      <div className="form-field">
        <label>Consultas</label>
        <div className="d-flex gap-2">
          <select
            className="form-select"
            value={activeThreadId || ""}
            onChange={(event) => setActiveThreadId(event.target.value)}
          >
            {sortedThreads.map((thread, index) => (
              <option key={thread.id} value={thread.id}>
                {thread.title || "Consulta"} · {formatDate(thread.createdAt)} ·{" "}
                #{sortedThreads.length - index}
              </option>
            ))}
          </select>
          <button
            className="btn btn-ghost btn-small"
            onClick={handleCreateThread}
          >
            <IconPlus size={22} />
          </button>
        </div>
      </div>

      <div className="chat-thread">
        {messages.map((msg, idx) => (
          <div key={`${msg.role}-${idx}`} className={`chat-msg ${msg.role}`}>
            <span>{msg.content}</span>
          </div>
        ))}
        {loading ? (
          <div className="chat-msg assistant">
            <span>Escribiendo…</span>
          </div>
        ) : null}
      </div>

      <div className="form-field" style={{ marginTop: "12px" }}>
        <label>Tu consulta</label>
        <div className="d-flex gap-2 align-items-start">
          <textarea
            rows={3}
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.ctrlKey) {
                event.preventDefault();
                void handleAsk();
              }
            }}
            style={{ flex: 1, minWidth: 0 }}
          />
          <button
            className="btn btn-secondary btn-icon-round"
            onClick={handleRequestHandoff}
            disabled={handoffLoading || messages.length === 0}
          >
            {handoffLoading ? "…" : <IconHumanChat size={24} />}
          </button>
          <button
            className="btn btn-send-colored btn-icon-round"
            onClick={handleAsk}
            disabled={!question.trim() || loading}
          >
            <IconSend size={20} />
          </button>
        </div>
      </div>
      {error ? <p className="muted">{error}</p> : null}
      {handoffNotice ? <p className="muted">{handoffNotice}</p> : null}

      {handoffs.length ? (
        <div className="list" style={{ marginTop: "12px" }}>
          {handoffs.slice(0, 2).map((handoff) => (
            <div key={handoff.id} className="list-row">
              <div>
                <p className="list-title">
                  {handoff.status === "answered"
                    ? "Respuesta disponible"
                    : "Solicitud en curso"}
                </p>
                <p className="muted">{formatDate(handoff.requestedAt)}</p>
                {handoff.responseText ? (
                  <p className="muted">{handoff.responseText}</p>
                ) : null}
              </div>
              <div className="list-meta">
                <span>{handoff.status || "open"}</span>
              </div>
            </div>
          ))}
        </div>
      ) : null}
      <p className="muted" style={{ fontSize: "11px", marginTop: "8px" }}>
        Esta información es orientativa y no sustituye la consulta médica.
      </p>
    </div>
  );
};
