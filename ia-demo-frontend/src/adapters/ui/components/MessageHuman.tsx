// src/adapters/ui/react/chat/MessageHuman.tsx
import type { ChatMessage } from "../../../interfaces";
import { IconClip } from "./icons";

export interface MessageHumanProps {
  message: ChatMessage;
}

export const MessageHuman = ({ message }: MessageHumanProps) => {
  const attachments = Array.isArray(message.attachments)
    ? message.attachments
    : [];
  const hasAttachments = attachments.length > 0;

  const isImage = (filename: string, mimeType?: string | null) => {
    if (mimeType && mimeType.startsWith("image/")) return true;
    return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(filename);
  };

  const isPdf = (filename: string, mimeType?: string | null) => {
    if (mimeType === "application/pdf") return true;
    return /\.pdf$/i.test(filename);
  };

  return (
    <div className="ia-chatbot-message-row user">
      <div className="ia-chatbot-message-bubble user">
        <div>{message.content}</div>

        {hasAttachments && (
          <div className="ia-chatbot-message-attachments">
            {attachments.map((att) => {
              const filename = att.filename || att.name || att.key || "Adjunto";
              const url = att.url || att.resultFileUrl || "";
              const mimeType = att.mimeType || att.contentType || "";
              const showImage = url && isImage(filename, mimeType);
              const showPdf = url && isPdf(filename, mimeType);

              return (
                <div
                  key={att.key ?? att.url ?? filename}
                  className="ia-chatbot-message-attachment-card"
                >
                  <div className="ia-chatbot-message-attachment-header">
                    <IconClip />
                    <span>{filename}</span>
                  </div>

                  {url && showImage && (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ia-chatbot-message-attachment-preview"
                    >
                      <img src={url} alt={filename} loading="lazy" />
                    </a>
                  )}

                  {url && showPdf && (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ia-chatbot-message-attachment-preview"
                    >
                      <iframe title={filename} src={url} loading="lazy" />
                    </a>
                  )}

                  {url && !showImage && !showPdf && (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ia-chatbot-message-attachment-link"
                    >
                      Descargar / abrir
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
