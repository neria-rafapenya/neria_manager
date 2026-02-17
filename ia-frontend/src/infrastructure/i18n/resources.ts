import type { Resource } from "i18next";

// Importamos los JSON de cada idioma
import esCommon from "./locales/es/common.json";
import caCommon from "./locales/ca/common.json";
import enCommon from "./locales/en/common.json";

// Mapa completo de recursos disponibles en el bundle
const ALL_RESOURCES = {
  es: {
    common: esCommon,
  },
  ca: {
    common: caCommon,
  },
  en: {
    common: enCommon,
  },
} as const;

type SupportedLang = keyof typeof ALL_RESOURCES; // "es" | "ca" | "en"

const parseEnabledLangs = (): SupportedLang[] => {
  const raw = import.meta.env.VITE_I18N_LANGS || "es";

  const tokens = raw
    .split(",")
    .map((l: string) => l.trim().toLowerCase())
    .filter(Boolean);

  // Solo aceptamos idiomas que realmente existan en ALL_RESOURCES
  const enabled = tokens.filter((code: string): code is SupportedLang =>
    (Object.keys(ALL_RESOURCES) as SupportedLang[]).includes(
      code as SupportedLang
    )
  );

  // Fallback por seguridad
  if (enabled.length === 0) {
    return ["es"];
  }

  return enabled;
};

const enabledLangs = parseEnabledLangs();

/**
 * Idioma por defecto, también condicionado por .env:
 * - VITE_I18N_DEFAULT_LANG debe estar dentro de enabledLangs
 * - si no, usamos el primero de enabledLangs
 */
const resolveDefaultLang = (): SupportedLang => {
  const envDefault = (import.meta.env.VITE_I18N_DEFAULT_LANG || "")
    .trim()
    .toLowerCase();

  if (envDefault && (enabledLangs as string[]).includes(envDefault)) {
    return envDefault as SupportedLang;
  }

  return enabledLangs[0];
};

export const DEFAULT_LANG: SupportedLang = resolveDefaultLang();

/**
 * resources final que se pasa a i18next,
 * solo con los idiomas activados en .env
 */
export const resources: Resource = enabledLangs.reduce((acc, lang) => {
  acc[lang] = ALL_RESOURCES[lang];
  return acc;
}, {} as Resource);
