// src/adapters/ui/react/chat/MessageBot.tsx
import { useState } from "react";
import type { ChatMessage } from "../../../interfaces";
import { useTranslation } from "react-i18next";
import { useChatContext } from "../../../infrastructure/contexts";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { CarCard } from "./CarCard";

export interface MessageBotProps {
  message: ChatMessage;
  isStreaming: boolean;
}

interface ProductCardMeta {
  type: "product-card";
  product: {
    id: string;
    name?: string | null;
    brand?: string | null;
    model?: string | null;
    year?: number | null;
    price?: number | string | null;
    mileage?: number | null;
    category?: string | null;
    categorySlug?: string | null;
    fuelType?: string | null;
    gearbox?: string | null;
    seats?: number | null;
    doors?: number | null;
    color?: string | null;
    description?: string | null;
    mainImage?: string | null;
    productLink?: string | null;
  };
}

// [[PRODUCT_CARD_META]]{...json...}[[/PRODUCT_CARD_META]]
const PRODUCT_META_REGEX =
  /\[\[PRODUCT_CARD_META\]\](.+?)\[\[\/PRODUCT_CARD_META\]\]/s;

export const MessageBot = ({ message, isStreaming }: MessageBotProps) => {
  const { t } = useTranslation("common");
  const { serviceInfo, createJiraIssue, selectedConversationId } =
    useChatContext();
  const [jiraBusy, setJiraBusy] = useState(false);
  const [jiraResult, setJiraResult] = useState<{
    issueKey?: string;
    issueUrl?: string;
  } | null>(null);
  const [jiraError, setJiraError] = useState<string | null>(null);

  const rawContent = message.content ?? "";
  const isEmpty = !rawContent || rawContent.trim().length === 0;

  // --- extraemos meta de producto (si existe) ---
  let productMeta: ProductCardMeta | null = null;
  let markdownContent = rawContent;

  const match = PRODUCT_META_REGEX.exec(rawContent);
  if (match) {
    try {
      const parsed = JSON.parse(match[1]);
      if (parsed && parsed.type === "product-card") {
        productMeta = parsed as ProductCardMeta;
      }
    } catch {
      // si el JSON viene a medias mientras stream, simplemente ignoramos
      productMeta = null;
    }
    // eliminamos SIEMPRE el bloque meta del contenido visible
    markdownContent = rawContent.replace(PRODUCT_META_REGEX, "").trim();
  }

  const hasProductCard = !!productMeta;

  const canCreateJira =
    Boolean(serviceInfo.jiraEnabled && serviceInfo.jiraConfigured) &&
    !isStreaming &&
    !isEmpty;
  const jiraSource = markdownContent || rawContent;

  const handleCreateJira = async () => {
    if (!canCreateJira || jiraBusy) return;
    const confirmed = window.confirm(t("jira_confirm_create"));
    if (!confirmed) return;
    const conversationId = message.conversationId || selectedConversationId;
    if (!conversationId) {
      setJiraError(t("jira_no_conversation"));
      return;
    }
    setJiraBusy(true);
    setJiraError(null);
    try {
      const result = await createJiraIssue(jiraSource);
      setJiraResult({
        issueKey: result?.issueKey,
        issueUrl: result?.issueUrl,
      });
    } catch (err: any) {
      setJiraError(err?.message || t("jira_issue_error"));
    } finally {
      setJiraBusy(false);
    }
  };

  return (
    <div className="ia-chatbot-message-row assistant">
      <div className="ia-chatbot-message-bubble assistant">
        {isEmpty && isStreaming ? (
          <span className="iachat-loading-dots">
            <span className="iachat-loading-dot" />
            <span className="iachat-loading-dot" />
            <span className="iachat-loading-dot" />
          </span>
        ) : hasProductCard ? (
          // 🔹 Mensaje de producto → SOLO card
          <CarCard product={productMeta!.product} />
        ) : (
          // 🔹 Mensaje normal → markdown de siempre
          markdownContent && (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              skipHtml={true}
              components={{
                p: ({ children }) => (
                  <p className="iachat-text-paragraph">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="iachat-spec-list">{children}</ul>
                ),
                li: ({ children }) => (
                  <li className="iachat-spec-list-item">{children}</li>
                ),
                img: ({ node, ...props }) => (
                  <img
                    {...props}
                    className={props.className ?? "iachat-product-image"}
                    loading="lazy"
                  />
                ),
                strong: ({ children }) => (
                  <strong className="iachat-strong">{children}</strong>
                ),
                a: ({ node, ...props }) => (
                  <a
                    {...props}
                    target={props.target ?? "_blank"}
                    rel={props.rel ?? "noopener noreferrer"}
                  />
                ),
              }}
            >
              {markdownContent}
            </ReactMarkdown>
          )
        )}
        {canCreateJira && (
          <div className="ia-chatbot-message-actions">
            <button
              type="button"
              className="ia-chatbot-jira-button"
              onClick={handleCreateJira}
              disabled={jiraBusy}
            >
              {jiraBusy ? t("jira_creating") : t("jira_create_button")}
            </button>
          </div>
        )}
        {jiraResult?.issueUrl && (
          <div className="ia-chatbot-jira-result">
            {t("jira_issue_created")}{" "}
            <a href={jiraResult.issueUrl} target="_blank" rel="noreferrer">
              {jiraResult.issueKey || jiraResult.issueUrl}
            </a>
          </div>
        )}
        {jiraError && <div className="ia-chatbot-jira-error">{jiraError}</div>}
      </div>
    </div>
  );
};
