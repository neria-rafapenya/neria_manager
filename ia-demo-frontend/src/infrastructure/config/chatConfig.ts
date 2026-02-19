// src/infrastructure/config/chatConfig.ts
import { getRuntimeConfig } from "./runtimeConfig";

export type ChatAuthMode = "local" | "none";

const sanitize = (value: string): string => {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith("\"") && trimmed.endsWith("\"")) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
};

const readEnvMode = (): ChatAuthMode | undefined => {
  const raw = (import.meta.env.VITE_CHAT_AUTH_MODE as string | undefined) ?? "";
  const value = sanitize(raw).toLowerCase();
  if (value === "none" || value === "local") {
    return value as ChatAuthMode;
  }
  return undefined;
};

export const getChatAuthMode = (): ChatAuthMode => {
  const runtime = getRuntimeConfig()?.chatAuthMode;
  if (runtime === "none" || runtime === "local") {
    return runtime;
  }
  return readEnvMode() === "none" ? "none" : "local";
};

export const isAuthModeLocal = (): boolean => getChatAuthMode() === "local";
export const isAuthModeNone = (): boolean => getChatAuthMode() === "none";
