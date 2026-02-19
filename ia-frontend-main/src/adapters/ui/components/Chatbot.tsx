// src/adapters/ui/react/chat/Chatbot.tsx
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";

import { ConversationsList } from "./ConversationsList";
import { MessageHuman } from "./MessageHuman";
import { MessageBot } from "./MessageBot";
import { ChatInputArea } from "./ChatInputArea";
import { useChatContext } from "../../../infrastructure/contexts";
import { useUploadManager } from "../../../infrastructure/hooks/useUploadManager";
import type { ChatAttachment } from "../../../interfaces";

// Helper para leer el modo de auth desde entorno
const getAuthMode = (): string => {
  return import.meta.env.VITE_CHAT_AUTH_MODE ?? "";
};

export const Chatbot = () => {
  const { t } = useTranslation("common");

  const {
    conversations,
    selectedConversationId,
    messages,
    loadingConversations,
    isStreaming,
    error,
    serviceEndpoints,
    serviceInfo,
    selectConversation,
    sendMessage,
    createConversation,
    deleteConversation,
  } = useChatContext();

  const [input, setInput] = useState<string>("");

  // Gestión de adjuntos
  const {
    attachments,
    isUploading,
    error: uploadError,
    isModalOpen,
    openModal,
    closeModal,
    handleFilesSelected,
    removeAttachment,
    clearAttachments,
  } = useUploadManager();

  // Ancla para el scroll automático
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;
    if (isUploading) return; // bloqueamos enviar mientras sube

    setInput("");

    await sendMessage(text, attachments as ChatAttachment[]);

    // Una vez enviado el mensaje, limpiamos adjuntos pendientes
    clearAttachments();
  };

  // Scroll automático al final cuando cambian mensajes o streaming
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [messages, isStreaming]);

  const handleFileInputChange = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    await handleFilesSelected(files);
    // Permitir volver a seleccionar el mismo archivo
    event.target.value = "";
  };

  // Flag para mostrar u ocultar la lista de conversaciones
  const authMode = getAuthMode();
  const showConversationsList = authMode !== "none";

  return (
    <div className="ia-chatbot-content">
      {showConversationsList && (
        <ConversationsList
          conversations={conversations}
          selectedConversationId={selectedConversationId}
          loading={loadingConversations}
          onChange={selectConversation}
          onCreateConversation={createConversation}
          onDeleteConversation={deleteConversation}
          allowDelete={false}
        />
      )}

      <div className="ia-chatbot-service-info">
        <div className="ia-chatbot-service-line">
          <strong>Tenant:</strong> {serviceInfo.tenantId || "—"}
        </div>
        <div className="ia-chatbot-service-line">
          <strong>Servicio:</strong>{" "}
          {serviceInfo.serviceName || serviceInfo.serviceCode || "—"}
        </div>
        <div className="ia-chatbot-service-line">
          <strong>Service ID:</strong> {serviceInfo.serviceId || "—"}
        </div>
        {serviceEndpoints.length > 0 && (
          <div className="ia-chatbot-service-line">
            <strong>Endpoints:</strong>
            <ul className="ia-chatbot-endpoints">
              {serviceEndpoints.map((endpoint) => (
                <li key={endpoint.id}>
                  {endpoint.method}{" "}
                  {serviceInfo.apiUrl
                    ? `${serviceInfo.apiUrl.replace(/\/+$/, "")}${endpoint.path}`
                    : endpoint.path}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="ia-chatbot-messages">
        {messages.map((msg) =>
          msg.role === "user" ? (
            <MessageHuman key={msg.id} message={msg} />
          ) : (
            <MessageBot key={msg.id} message={msg} isStreaming={isStreaming} />
          )
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error general de chat */}
      {error && <div className="ia-chatbot-error">{error}</div>}

      {/* Error de subida si no está abierto el modal */}
      {uploadError && !isModalOpen && (
        <div className="ia-chatbot-error">{uploadError}</div>
      )}

      {/* Input + chips de adjuntos pendientes */}
      <ChatInputArea
        value={input}
        onChange={setInput}
        onSend={handleSend}
        disabled={isStreaming || isUploading}
        attachments={attachments}
        onOpenAttachmentsModal={openModal}
        onRemoveAttachment={removeAttachment}
        isUploadingAttachments={isUploading}
      />

      {/* Modal de adjuntos dentro del layout/panel */}
      {isModalOpen && (
        <div className="ia-chatbot-modal-backdrop">
          <div className="ia-chatbot-modal">
            <div className="ia-chatbot-modal-title">
              {t("chat_attachments_modal_title")}
            </div>

            <label className="ia-chatbot-modal-label">
              {t("chat_attachments_modal_desc_line1")}
              <br />
              {t("chat_attachments_modal_desc_line2")}
              <br />
              {t("chat_attachments_modal_desc_line3")}
            </label>

            <input
              type="file"
              multiple
              onChange={handleFileInputChange}
              className="ia-chatbot-modal-input"
            />

            {isUploading && (
              <div className="ia-chatbot-streaming">
                {t("chat_attachments_uploading")}
              </div>
            )}

            {uploadError && (
              <div className="ia-chatbot-error" style={{ marginTop: "0.5rem" }}>
                {uploadError}
              </div>
            )}

            {attachments.length > 0 && (
              <div style={{ marginTop: "0.75rem" }}>
                <div className="ia-chatbot-modal-label">
                  {t("chat_attachments_ready_label")}
                </div>
                <div className="ia-chatbot-attachments-row">
                  {attachments.map((att) => (
                    <div
                      key={att.key ?? att.url}
                      className="ia-chatbot-attachment-chip"
                    >
                      <span>📎 {att.filename}</span>
                      <button
                        type="button"
                        className="ia-chatbot-attachment-chip-remove"
                        onClick={() => removeAttachment(att.key ?? att.url)}
                        aria-label={t("chat_attachments_remove_aria", {
                          filename: att.filename,
                        })}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="ia-chatbot-modal-actions">
              <button
                type="button"
                className="ia-chatbot-button ia-chatbot-button-secondary"
                onClick={closeModal}
                disabled={isUploading}
              >
                {t("common_close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
