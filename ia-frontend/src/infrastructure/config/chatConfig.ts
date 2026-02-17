// src/infrastructure/config/chatConfig.ts
export type ChatAuthMode = "local" | "none";

const rawMode = import.meta.env.VITE_CHAT_AUTH_MODE as ChatAuthMode | undefined;

export const CHAT_AUTH_MODE: ChatAuthMode =
  rawMode === "none" ? "none" : "local";

export const isAuthModeLocal = CHAT_AUTH_MODE === "local";
export const isAuthModeNone = CHAT_AUTH_MODE === "none";
