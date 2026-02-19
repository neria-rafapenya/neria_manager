// src/adapters/ui/react/chat/MessageHuman.tsx
import type { ChatMessage } from "../../../interfaces";
// import { IconClip } from "./icons";

export interface MessageHumanProps {
  message: ChatMessage;
}

export const MessageHuman = ({ message }: MessageHumanProps) => {
  // const hasAttachments = message.attachments && message.attachments.length > 0;

  return (
    <div className="ia-chatbot-message-row user">
      <div className="ia-chatbot-message-bubble user">
        <div>{message.content}</div>

        {/* {hasAttachments && (
          <div className="ia-chatbot-message-attachments">
            {message.attachments!.map((att) => (
              <a
                key={att.key ?? att.url}
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                className="ia-chatbot-message-attachment-link"
              >
                <IconClip /> {att.filename}
              </a>
            ))}
          </div>
        )} */}
      </div>
    </div>
  );
};
