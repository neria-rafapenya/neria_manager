// src/infrastructure/i18n/langs.ts
export interface LanguageOption {
  code: string;
  label: string;
}

const rawLangs = import.meta.env.VITE_I18N_LANGS ?? "es";
// ej: "es,ca,en" → ["es","ca","en"]
const codes = rawLangs
  .split(",")
  .map((c: string) => c.trim())
  .filter(Boolean);

// Mapa de etiquetas legibles (puedes ampliarlo)
const LANGUAGE_LABELS: Record<string, string> = {
  es: "Español",
  ca: "Català",
  en: "English",
};

export const LANGUAGE_OPTIONS: LanguageOption[] = codes.map(
  (code: string | number) => ({
    code,
    label: LANGUAGE_LABELS[code] ?? code,
  })
);

// Idioma por defecto (desde .env o el primero disponible)
const envDefault = import.meta.env.VITE_I18N_DEFAULT_LANG ?? "es";

export const DEFAULT_LANG: string =
  LANGUAGE_OPTIONS.find((l) => l.code === envDefault)?.code ||
  LANGUAGE_OPTIONS[0]?.code ||
  "es";

// --- Persistencia en localStorage ---

export const LANGUAGE_STORAGE_KEY = "ia_chat_lang";

export const getStoredLanguage = (): string | null => {
  if (typeof window === "undefined") return null;

  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (!stored) return null;

    // Solo aceptamos idiomas que estén en VITE_I18N_LANGS
    const exists = LANGUAGE_OPTIONS.some((l) => l.code === stored);
    return exists ? stored : null;
  } catch {
    return null;
  }
};

export const persistLanguage = (lang: string): void => {
  if (typeof window === "undefined") return;

  const exists = LANGUAGE_OPTIONS.some((l) => l.code === lang);
  if (!exists) return;

  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  } catch {
    // ignoramos errores de localStorage (modo privado, etc.)
  }
};

/**
 * Devuelve el idioma inicial:
 * 1) guardado en localStorage (si es válido)
 * 2) o DEFAULT_LANG
 */
export const getInitialLanguage = (): string => {
  return getStoredLanguage() ?? DEFAULT_LANG;
};
