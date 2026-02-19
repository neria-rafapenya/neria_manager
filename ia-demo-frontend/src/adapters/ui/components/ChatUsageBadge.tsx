// src/infrastructure/components/ChatUsageBadge.tsx
import type { FC } from "react";
import { useChatContext } from "../../../infrastructure/contexts";

export const ChatUsageBadge: FC = () => {
  const { usageMode, usageRemainingMs } = useChatContext();

  if (usageMode === "idle") return null;

  const remainingMinutes =
    usageRemainingMs != null
      ? Math.max(1, Math.ceil(usageRemainingMs / 60000))
      : null;

  let label = "";
  if (usageMode === "active") {
    label = `Tiempo restante: ${remainingMinutes} min`;
  } else if (usageMode === "cooldown") {
    label = `Disponible en: ${remainingMinutes} min`;
  }

  const className =
    "ia-chatbot-usage-badge " +
    (usageMode === "cooldown"
      ? "ia-chatbot-usage-badge--cooldown"
      : "ia-chatbot-usage-badge--active");

  return (
    <div className={className} aria-live="polite">
      <span className="ia-chatbot-usage-badge__dot" />
      <span className="ia-chatbot-usage-badge__text">{label}</span>
    </div>
  );
};
