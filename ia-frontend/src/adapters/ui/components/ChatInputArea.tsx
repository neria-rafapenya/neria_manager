// src/adapters/ui/react/chat/ChatInputArea.tsx
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import { useTranslation } from "react-i18next";
import type { ChatAttachment } from "../../../interfaces";
import { IconClip, IconSend } from "./icons";

export interface ChatInputAreaProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  attachments: ChatAttachment[];
  onOpenAttachmentsModal: () => void;
  onRemoveAttachment: (key: string) => void;
  isUploadingAttachments: boolean;
}

const MIN_HEIGHT = 38; // altura mínima
const MAX_HEIGHT = 180; // tope en px

// radios para los 3 tramos
const RADIUS_DEFAULT = 999; // pill redonda
const RADIUS_MEDIUM = 40; // a partir de 50px
const RADIUS_SMALL = 24; // a partir de 80px

export const ChatInputArea = ({
  value,
  onChange,
  onSend,
  disabled,
  attachments,
  onOpenAttachmentsModal,
  onRemoveAttachment,
  isUploadingAttachments,
}: ChatInputAreaProps) => {
  const { t } = useTranslation("common");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const [textareaHeight, setTextareaHeight] = useState<number>(MIN_HEIGHT);

  const autoResize = (el: HTMLTextAreaElement | null) => {
    if (!el) return;

    // reset para medir correctamente
    el.style.height = "auto";

    const scroll = el.scrollHeight;
    const next = Math.min(scroll, MAX_HEIGHT);
    const finalHeight = Math.max(next, MIN_HEIGHT);

    el.style.height = `${finalHeight}px`;
    el.style.overflowY = scroll > MAX_HEIGHT ? "auto" : "hidden";

    setTextareaHeight(finalHeight);
  };

  const handleTextareaChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const el = event.target;
    onChange(el.value);
    autoResize(el);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      // Enter normal: enviar
      event.preventDefault();
      if (!disabled) {
        onSend();
      }
    }
    // Shift+Enter: salto de línea → el change disparará autoResize
  };

  const handleClickSend = () => {
    if (!disabled) {
      onSend();
    }
  };

  const showAttachmentsRow = attachments.length > 0;

  // Al montar
  useEffect(() => {
    autoResize(textareaRef.current);
  }, []);

  // Cuando cambia el valor desde fuera (por ejemplo, se limpia tras enviar)
  useEffect(() => {
    autoResize(textareaRef.current);
  }, [value]);

  // --- lógica de border-radius según altura ---
  let currentRadius = RADIUS_DEFAULT;

  if (textareaHeight >= 80) {
    currentRadius = RADIUS_SMALL;
  } else if (textareaHeight >= 50) {
    currentRadius = RADIUS_MEDIUM;
  }
  // -------------------------------------------

  return (
    <div
      className="ia-chatbot-input-wrapper"
      style={{ borderRadius: currentRadius }}
    >
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Chips de adjuntos pendientes */}
        {showAttachmentsRow && (
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
                  onClick={() => onRemoveAttachment(att.key ?? att.url)}
                  aria-label={t("chat_input_remove_attachment_aria", {
                    filename: att.filename,
                  })}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Caja de texto */}
        <textarea
          ref={textareaRef}
          className="ia-chatbot-textarea"
          placeholder={t("chat_input_placeholder")}
          value={value}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          style={{ borderRadius: currentRadius }}
        />
      </div>

      {/* Botón para abrir modal de adjuntos */}
      <button
        type="button"
        className="ia-chatbot-attach-button"
        onClick={onOpenAttachmentsModal}
        disabled={true} // lo tienes forzado a true
        title={t("chat_input_attach_title")}
      >
        <IconClip size={18} color={disabled ? "#999999" : "#ffffff"} />
        {isUploadingAttachments && (
          <span className="ia-chatbot-attach-badge">...</span>
        )}
      </button>

      {/* Botón enviar */}
      <button
        type="button"
        className="ia-chatbot-send-button"
        onClick={handleClickSend}
        disabled={disabled}
      >
        <IconSend size={18} color={disabled ? "#ffffff" : "#008fc8"} />
      </button>
    </div>
  );
};
