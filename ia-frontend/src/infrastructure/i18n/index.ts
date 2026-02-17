// src/infrastructure/i18n/index.ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { resources } from "./resources";
import { getInitialLanguage, DEFAULT_LANG } from "./langs";

const initialLang = getInitialLanguage();

i18n.use(initReactI18next).init({
  resources,
  lng: initialLang,
  fallbackLng: DEFAULT_LANG,
  interpolation: {
    escapeValue: false,
  },
  defaultNS: "common",
});

export default i18n;
export { initialLang };
