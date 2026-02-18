// src/adapters/ui/react/chat/MessageHuman.tsx
import { useTranslation } from "react-i18next";
import type { ChatMessage } from "../../../interfaces";

export interface MessageHumanProps {
  message: ChatMessage;
}

export const MessageHuman = ({ message }: MessageHumanProps) => {
  const { t } = useTranslation("common");
  const hasAttachments = message.attachments && message.attachments.length > 0;

  return (
    <div className="ia-chatbot-message-row user">
      <div className="ia-chatbot-message-bubble user">
        <div>{message.content}</div>

        {hasAttachments && (
          <div className="ia-chatbot-message-attachments">
            <div className="ia-chatbot-attachments-list">
              {message.attachments!.flatMap((att) => {
                const links = [];
                if (att.url) {
                  links.push({
                    key: `${att.fileId ?? att.url}-file`,
                    url: att.url,
                    label: t("chat_attachment_file"),
                    name: att.filename,
                  });
                }
                if (att.resultFileUrl) {
                  links.push({
                    key: `${att.fileId ?? att.resultFileUrl}-summary`,
                    url: att.resultFileUrl,
                    label: t("chat_attachment_summary"),
                    name: att.filename,
                  });
                }
                return links.map((link) => (
                  <a
                    key={link.key}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ia-chatbot-attachment-pill"
                  >
                    <span className="ia-chatbot-attachment-name">
                      {link.label}: {link.name}
                    </span>
                  </a>
                ));
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
