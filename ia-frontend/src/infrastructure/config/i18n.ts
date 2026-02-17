// src/infrastructure/config/i18n.ts
export interface LanguageOption {
  code: string;
  label: string;
}

const RAW_LANGS = import.meta.env.VITE_I18N_LANGS || "es";

const LANG_LABELS: Record<string, string> = {
  es: "Español",
  ca: "Català",
  en: "English",
  gl: "Galego",
  fr: "Français",
};

export const AVAILABLE_LANGUAGES: LanguageOption[] = RAW_LANGS.split(",")
  .map((l: string) => l.trim())
  .filter(Boolean)
  .map((code: string) => ({
    code,
    label: LANG_LABELS[code] ?? code.toUpperCase(),
  }));

export const DEFAULT_LANGUAGE: string =
  import.meta.env.VITE_I18N_DEFAULT_LANG ||
  AVAILABLE_LANGUAGES[0]?.code ||
  "es";
