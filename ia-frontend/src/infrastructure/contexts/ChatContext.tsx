// src/infrastructure/contexts/ChatContext.tsx
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  ConversationService,
  ChatService,
} from "../../core/application/services";
import type {
  Conversation,
  ChatMessage,
  ChatAttachment,
  ServiceEndpoint,
} from "../../interfaces";
import { ConversationRepository, ChatRepository } from "../repositories";
import { isAuthModeNone } from "../config/chatConfig";
import {
  getApiUrl,
  getServiceCode,
  getServiceId,
  getTenantId,
  getProviderId,
  getModel,
} from "../config/env";
import { API_ENDPOINTS } from "../../core/domain/constants/apiEndpoints";
import { fetchWithAuth } from "../api/api";

const conversationRepository = new ConversationRepository();
const chatRepository = new ChatRepository();

const conversationService = new ConversationService(conversationRepository);
const chatService = new ChatService(chatRepository);

const IS_EPHEMERAL = isAuthModeNone;
// Nuevo: flag de restricción por entorno
const IS_RESTRICTED = import.meta.env.VITE_CHATBOT_RESTRICTED === "true";

type UsageMode = "idle" | "active" | "cooldown";

interface ChatContextValue {
  conversations: Conversation[];
  selectedConversationId: string | null;
  messages: ChatMessage[];
  loadingConversations: boolean;
  loadingMessages: boolean;
  isStreaming: boolean;
  error: string;
  serviceEndpoints: ServiceEndpoint[];
  serviceInfo: {
    tenantId: string;
    serviceCode: string;
    serviceId: string;
    providerId: string;
    model: string;
    apiUrl: string;
    serviceName?: string;
  };

  usageMode: UsageMode;
  usageRemainingMs: number | null;

  reloadConversations: () => Promise<void>;
  selectConversation: (idOrNew: string | null) => Promise<void>;
  sendMessage: (text: string, attachments?: ChatAttachment[]) => Promise<void>;
  createConversation: (title: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

export const useChatContext = (): ChatContextValue => {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error("useChatContext debe usarse dentro de ChatProvider");
  }
  return ctx;
};

export interface ChatProviderProps {
  children: ReactNode;
}

const SELECTED_CONVERSATION_STORAGE_KEY = "ia_chat_selected_conversation_id";

// Limitador de uso
const USAGE_STORAGE_KEY = "ia_chat_usage_state";
const USAGE_WINDOW_MS = 5 * 60 * 1000; // 5 minutos
const COOLDOWN_MS = 30 * 60 * 1000; // 30 minutos

interface UsageState {
  windowStart: number | null;
  cooldownUntil: number | null;
}

const loadUsageState = (): UsageState => {
  if (typeof window === "undefined") {
    return { windowStart: null, cooldownUntil: null };
  }

  try {
    const raw = window.localStorage.getItem(USAGE_STORAGE_KEY);
    if (!raw) {
      return { windowStart: null, cooldownUntil: null };
    }
    const parsed = JSON.parse(raw) as UsageState;
    return {
      windowStart:
        parsed && typeof parsed.windowStart === "number"
          ? parsed.windowStart
          : null,
      cooldownUntil:
        parsed && typeof parsed.cooldownUntil === "number"
          ? parsed.cooldownUntil
          : null,
    };
  } catch {
    return { windowStart: null, cooldownUntil: null };
  }
};

const saveUsageState = (state: UsageState) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(state));
};

interface UsageEvaluation {
  allowed: boolean;
  updatedState: UsageState;
  remainingMs?: number;
}

const evaluateUsage = (now: number, prevState: UsageState): UsageEvaluation => {
  let state = { ...prevState };

  // Si el cooldown ha expirado, reseteamos
  if (state.cooldownUntil && now >= state.cooldownUntil) {
    state = { windowStart: null, cooldownUntil: null };
  }

  // Cooldown activo
  if (state.cooldownUntil && now < state.cooldownUntil) {
    return {
      allowed: false,
      updatedState: state,
      remainingMs: state.cooldownUntil - now,
    };
  }

  // Ventana de uso activa
  if (state.windowStart) {
    const elapsed = now - state.windowStart;

    if (elapsed <= USAGE_WINDOW_MS) {
      const remainingMs = state.windowStart + USAGE_WINDOW_MS - now;
      return {
        allowed: true,
        updatedState: state,
        remainingMs,
      };
    }

    // Ventana agotada → iniciamos cooldown
    const cooldownUntil = now + COOLDOWN_MS;
    const newState: UsageState = {
      windowStart: null,
      cooldownUntil,
    };

    return {
      allowed: false,
      updatedState: newState,
      remainingMs: cooldownUntil - now,
    };
  }

  // Sin ventana ni cooldown → iniciamos ventana
  const newState: UsageState = {
    windowStart: now,
    cooldownUntil: null,
  };

  return {
    allowed: true,
    updatedState: newState,
    remainingMs: USAGE_WINDOW_MS,
  };
};

interface UsageView {
  mode: UsageMode;
  remainingMs: number | null;
}

const computeUsageView = (now: number, state: UsageState): UsageView => {
  if (state.cooldownUntil && now < state.cooldownUntil) {
    return {
      mode: "cooldown",
      remainingMs: state.cooldownUntil - now,
    };
  }

  if (state.windowStart) {
    const elapsed = now - state.windowStart;
    if (elapsed <= USAGE_WINDOW_MS) {
      return {
        mode: "active",
        remainingMs: state.windowStart + USAGE_WINDOW_MS - now,
      };
    }
  }

  return {
    mode: "idle",
    remainingMs: null,
  };
};

export const ChatProvider = ({ children }: ChatProviderProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingConversations, setLoadingConversations] =
    useState<boolean>(false);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [serviceEndpoints, setServiceEndpoints] = useState<ServiceEndpoint[]>(
    []
  );
  const [serviceInfo, setServiceInfo] = useState({
    tenantId: getTenantId(),
    serviceCode: getServiceCode(),
    serviceId: getServiceId(),
    providerId: getProviderId(),
    model: getModel(),
    apiUrl: getApiUrl(),
    serviceName: "",
  });

  const [usageMode, setUsageMode] = useState<UsageMode>("idle");
  const [usageRemainingMs, setUsageRemainingMs] = useState<number | null>(null);

  const reloadConversations = async () => {
    if (IS_EPHEMERAL) {
      return;
    }

    setLoadingConversations(true);
    setError("");
    try {
      const data = await conversationService.getConversations();

      // 🔐 Normalizar siempre a array
      const safeConversations = Array.isArray(data) ? data : [];
      if (!Array.isArray(data)) {
        console.error(
          "[ChatContext] getConversations() ha devuelto algo que no es un array:",
          data
        );
      }

      setConversations(safeConversations);
    } catch (e) {
      console.error(e);
      setError("No se han podido cargar las conversaciones.");
    } finally {
      setLoadingConversations(false);
    }
  };

  const loadServiceInfo = async () => {
    if (IS_EPHEMERAL) {
      return;
    }
    const serviceCode = getServiceCode();
    if (!serviceCode) {
      return;
    }
    try {
      const services = await fetchWithAuth<any[]>(API_ENDPOINTS.SERVICES);
      const matched = services.find((item) => item.serviceCode === serviceCode);
      setServiceInfo((prev) => ({
        ...prev,
        serviceName: matched?.name || matched?.serviceCode || prev.serviceCode,
      }));
    } catch {
      // ignore
    }
    try {
      const endpoints = await fetchWithAuth<ServiceEndpoint[]>(
        API_ENDPOINTS.SERVICE_ENDPOINTS(serviceCode)
      );
      setServiceEndpoints(endpoints);
    } catch {
      setServiceEndpoints([]);
    }
  };

  // Inicialización: cargar conversaciones y seleccionar la adecuada
  useEffect(() => {
    const init = async () => {
      if (IS_EPHEMERAL) {
        setConversations([]);
        setSelectedConversationId(null);
        setMessages([]);
        return;
      }

      try {
        const storedId =
          typeof window !== "undefined"
            ? window.localStorage.getItem(SELECTED_CONVERSATION_STORAGE_KEY)
            : null;

        setLoadingConversations(true);
        const data = await conversationService.getConversations();

        // 🔐 Normalizar a array siempre
        const safeConversations = Array.isArray(data) ? data : [];
        if (!Array.isArray(data)) {
          console.error(
            "[ChatContext] init: getConversations() ha devuelto algo que no es un array:",
            data
          );
        }

        setConversations(safeConversations);
        setLoadingConversations(false);

        // 🔐 Si no hay conversaciones, no intentes leer .id
        if (!safeConversations || safeConversations.length === 0) {
          console.warn(
            "[ChatContext] init: no hay conversaciones disponibles tras el login"
          );
          setSelectedConversationId(null);
          setMessages([]);
          return;
        }

        // 1) Intentamos usar la conversación almacenada
        let conversationIdToLoad: string | null = null;

        if (storedId && safeConversations.some((c) => c && c.id === storedId)) {
          conversationIdToLoad = storedId;
        } else {
          // 2) Si no existe o no coincide, usamos la última conversación
          const last = safeConversations[safeConversations.length - 1];
          if (last && last.id) {
            conversationIdToLoad = last.id;
          } else {
            console.warn(
              "[ChatContext] init: la última conversación no tiene id válido",
              last
            );
            setSelectedConversationId(null);
            setMessages([]);
            return;
          }
        }

        if (!conversationIdToLoad) {
          setSelectedConversationId(null);
          setMessages([]);
          return;
        }

        setSelectedConversationId(conversationIdToLoad);
        setLoadingMessages(true);
        try {
          const detail = await conversationService.getConversationWithMessages(
            conversationIdToLoad
          );

          const sortedMessages = Array.isArray(detail.messages)
            ? [...detail.messages].sort(
                (a, b) =>
                  new Date(a.createdAt).getTime() -
                  new Date(b.createdAt).getTime()
              )
            : [];

          setMessages(sortedMessages);
        } catch (e) {
          console.error(
            "[ChatContext] No se ha podido cargar la conversación inicial",
            e
          );
          setSelectedConversationId(null);
          setMessages([]);
        } finally {
          setLoadingMessages(false);
        }
      } catch (e) {
        console.error(e);
        setError("No se han podido cargar las conversaciones.");
        setLoadingConversations(false);
        setSelectedConversationId(null);
        setMessages([]);
      }
    };

    void init();
  }, []);

  // Actualizar contador de uso cada 30s (solo si está restringido)
  useEffect(() => {
    if (!IS_RESTRICTED) {
      // Modo libre: nos aseguramos de que el estado quede "limpio"
      setUsageMode("idle");
      setUsageRemainingMs(null);

      if (typeof window !== "undefined") {
        try {
          window.localStorage.removeItem(USAGE_STORAGE_KEY);
        } catch {
          // ignoramos errores de storage
        }
      }

      return;
    }

    if (typeof window === "undefined") return;

    const update = () => {
      const state = loadUsageState();
      const { mode, remainingMs } = computeUsageView(Date.now(), state);
      setUsageMode(mode);
      setUsageRemainingMs(remainingMs ?? null);
    };

    update();
    const id = window.setInterval(update, 30_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    void loadServiceInfo();
  }, []);

  // Persistir conversación seleccionada
  useEffect(() => {
    if (IS_EPHEMERAL) return;
    if (typeof window === "undefined") return;

    if (selectedConversationId) {
      window.localStorage.setItem(
        SELECTED_CONVERSATION_STORAGE_KEY,
        selectedConversationId
      );
    } else {
      window.localStorage.removeItem(SELECTED_CONVERSATION_STORAGE_KEY);
    }
  }, [selectedConversationId]);

  const selectConversation = async (idOrNew: string | null) => {
    setError("");

    if (IS_EPHEMERAL) {
      return;
    }

    if (!idOrNew) {
      setSelectedConversationId(null);
      setMessages([]);
      return;
    }

    setSelectedConversationId(idOrNew);
    setLoadingMessages(true);

    try {
      const detail = await conversationService.getConversationWithMessages(
        idOrNew
      );

      const sortedMessages = Array.isArray(detail.messages)
        ? [...detail.messages].sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          )
        : [];

      setMessages(sortedMessages);
    } catch (e) {
      console.error(e);
      setError("No se ha podido cargar la conversación seleccionada.");
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const sendMessage = async (
    text: string,
    attachments: ChatAttachment[] = []
  ) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    // --- LÓGICA DE USO SOLO SI ESTÁ RESTRINGIDO ---
    if (IS_RESTRICTED) {
      const now = Date.now();
      const currentUsageState = loadUsageState();
      const { allowed, updatedState, remainingMs } = evaluateUsage(
        now,
        currentUsageState
      );
      saveUsageState(updatedState);

      const view = computeUsageView(now, updatedState);
      setUsageMode(view.mode);
      setUsageRemainingMs(view.remainingMs ?? null);

      if (!allowed) {
        const remaining =
          remainingMs != null ? remainingMs : view.remainingMs ?? COOLDOWN_MS;
        const remainingMinutes = Math.max(1, Math.ceil(remaining / 60000));

        setError(
          `Has alcanzado el tiempo máximo de uso del asistente. ` +
            `Podrás volver a utilizarlo en aproximadamente ${remainingMinutes} minutos.`
        );
        return;
      }
    } else {
      // Modo libre: aseguramos estado "idle"
      setUsageMode("idle");
      setUsageRemainingMs(null);
    }

    const nowIso = new Date().toISOString();
    const currentConversationId = IS_EPHEMERAL
      ? undefined
      : selectedConversationId ?? undefined;

    const userMessage: ChatMessage = {
      id: `${nowIso}-user`,
      role: "user",
      content: trimmed,
      createdAt: nowIso,
      conversationId: currentConversationId,
      attachments,
    };

    const assistantId = `${nowIso}-assistant`;
    const assistantBase: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      createdAt: nowIso,
      conversationId: currentConversationId,
    };

    setMessages((prev) => [...prev, userMessage, assistantBase]);
    setError("");
    setIsStreaming(true);

    try {
      const result = await chatService.sendMessage(
        {
          conversationId: currentConversationId ?? null,
          message: trimmed,
          attachments,
        },
        (delta, newConversationId) => {
          const safeDelta = typeof delta === "string" ? delta : "";
          if (!safeDelta) return;

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantId
                ? {
                    ...msg,
                    content: (msg.content ?? "") + safeDelta,
                    conversationId: newConversationId ?? msg.conversationId,
                  }
                : msg
            )
          );

          if (
            !IS_EPHEMERAL &&
            newConversationId &&
            newConversationId !== selectedConversationId
          ) {
            setSelectedConversationId(newConversationId);
          }
        }
      );

      if (
        !IS_EPHEMERAL &&
        result.conversationId &&
        result.conversationId !== selectedConversationId
      ) {
        setSelectedConversationId(result.conversationId);
      }

      if (!IS_EPHEMERAL) {
        await reloadConversations();
      }
    } catch (e) {
      console.error(e);
      setError("Ha ocurrido un error al generar la respuesta.");
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId
            ? {
                ...msg,
                content:
                  msg.content ||
                  "Lo siento, no he podido generar una respuesta en este momento.",
              }
            : msg
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  const createConversation = async (title: string) => {
    if (IS_EPHEMERAL) {
      return;
    }

    const trimmed = title.trim();
    if (!trimmed) return;

    setError("");

    try {
      const newConversation = await conversationService.createConversation(
        trimmed
      );

      setConversations((prev) => [...prev, newConversation]);
      setSelectedConversationId(newConversation.id);
      setMessages([]);
    } catch (e) {
      console.error(e);
      setError("No se ha podido crear la conversación.");
    }
  };

  const deleteConversation = async (id: string) => {
    if (IS_EPHEMERAL) {
      return;
    }

    setError("");

    try {
      const previousList = conversations;
      const index = previousList.findIndex((c) => c.id === id);

      await conversationService.deleteConversation(id);

      const newList = previousList.filter((c) => c.id !== id);
      setConversations(newList);

      if (selectedConversationId === id) {
        if (newList.length > 0) {
          const newIndex = index > 0 ? index - 1 : 0;
          const newSelectedId = newList[newIndex].id;

          setSelectedConversationId(newSelectedId);
          setLoadingMessages(true);

          try {
            const detail =
              await conversationService.getConversationWithMessages(
                newSelectedId
              );

            const sortedMessages = Array.isArray(detail.messages)
              ? [...detail.messages].sort(
                  (a, b) =>
                    new Date(a.createdAt).getTime() -
                    new Date(b.createdAt).getTime()
                )
              : [];

            setMessages(sortedMessages);
          } finally {
            setLoadingMessages(false);
          }
        } else {
          setSelectedConversationId(null);
          setMessages([]);
        }
      }
    } catch (e) {
      console.error(e);
      setError("No se ha podido eliminar la conversación.");
    }
  };

  const value = useMemo<ChatContextValue>(
    () => ({
      conversations,
      selectedConversationId,
      messages,
      loadingConversations,
      loadingMessages,
      isStreaming,
      error,
      serviceEndpoints,
      serviceInfo,
      usageMode,
      usageRemainingMs,
      reloadConversations,
      selectConversation,
      sendMessage,
      createConversation,
      deleteConversation,
    }),
    [
      conversations,
      selectedConversationId,
      messages,
      loadingConversations,
      loadingMessages,
      isStreaming,
      error,
      serviceEndpoints,
      serviceInfo,
      usageMode,
      usageRemainingMs,
    ]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
