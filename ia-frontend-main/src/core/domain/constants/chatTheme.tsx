// src/core/domain/constants/chatTheme.tsx
import type { ReactNode } from "react";
import LogoNeria from "../../../adapters/ui/components/LogoNeria";

export interface ChatTheme {
  panel: {
    width: number | string;
    height: number | string;
    borderRadius: number;
    shadow: string;
  };
  colors: {
    headerBgFrom: string;
    headerBgTo: string;
    headerText: string;

    bodyBg: string;
    toolbarBg: string;
    inputBg: string;

    userBubbleBg: string;
    userBubbleText: string;

    botBubbleBg: string;
    botBubbleText: string;
  };
  header: {
    /** Texto por defecto (fallback) */
    title: string;
    subtitle: string;
    badgeText?: string;

    /** Claves i18n opcionales */
    titleKey?: string;
    subtitleKey?: string;
    badgeTextKey?: string;

    /** Emoji, texto corto o componente React a modo de “logo” */
    logoEmoji?: ReactNode;
  };
  widget: {
    /** Emoji/icono de la burbuja flotante */
    bubbleEmoji?: ReactNode;
  };
}

export const DEFAULT_CHAT_THEME: ChatTheme = {
  panel: {
    width: 420,
    height: 720,
    borderRadius: 16,
    shadow: "0 18px 45px rgba(15, 23, 42, 0.45)",
  },
  colors: {
    headerBgFrom: "rgba(37, 99, 235, 0.96)",
    headerBgTo: "rgba(56, 189, 248, 0.96)",
    headerText: "#ffffff",

    bodyBg: "#f9fafb",
    toolbarBg: "#f3f4f6",
    inputBg: "#ffffff",

    userBubbleBg: "#2563eb",
    userBubbleText: "#ffffff",

    botBubbleBg: "#ffffff",
    botBubbleText: "#111827",
  },
  header: {
    // Fallbacks
    title: "Neria",
    subtitle: "Asistente inteligente\npara tu web",
    badgeText: "Beta",

    // Claves i18n (namespace "common")
    titleKey: "chat_title",
    subtitleKey: "chat_subtitle",
    badgeTextKey: "chat_badge_text",

    // ahora puede ser un componente React
    logoEmoji: <LogoNeria size={26} />,
  },
  widget: {
    bubbleEmoji: <LogoNeria size={36} />,
  },
};

// Permite que el integrador defina window.IA_CHAT_WIDGET_THEME
declare global {
  interface Window {
    IA_CHAT_WIDGET_THEME?: Partial<ChatTheme>;
  }
}

const mergeTheme = (
  base: ChatTheme,
  overrides?: Partial<ChatTheme>
): ChatTheme => {
  if (!overrides) return base;

  return {
    ...base,
    ...overrides,
    panel: {
      ...base.panel,
      ...(overrides.panel ?? {}),
    },
    colors: {
      ...base.colors,
      ...(overrides.colors ?? {}),
    },
    header: {
      ...base.header,
      ...(overrides.header ?? {}),
    },
    widget: {
      ...base.widget,
      ...(overrides.widget ?? {}),
    },
  };
};

export const getChatTheme = (): ChatTheme => {
  if (typeof window === "undefined") {
    return DEFAULT_CHAT_THEME;
  }
  return mergeTheme(DEFAULT_CHAT_THEME, window.IA_CHAT_WIDGET_THEME);
};
