import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import i18n from "../../../infrastructure/i18n";
import {
  getInitialLanguage,
  persistLanguage,
  LANGUAGE_OPTIONS,
} from "../../../infrastructure/i18n/langs";

export interface TaxAssistantLayoutProps {
  children: ReactNode;
  onLogout?: () => void;
  showLogout?: boolean;
}

const TaxAssistantLayout = ({ children, onLogout, showLogout }: TaxAssistantLayoutProps) => {
  const { t } = useTranslation("common");
  const [language, setLanguage] = useState<string>(() => getInitialLanguage());

  useEffect(() => {
    void i18n.changeLanguage(language);
    persistLanguage(language);
  }, [language]);

  return (
    <div className="tax-root">
      <header className="tax-header">
        <div className="tax-brand">
          <div className="tax-logo">AI</div>
          <div>
            <h1>Asistente de Renta IA</h1>
            <p>Guia paso a paso para la declaracion en Espana.</p>
          </div>
        </div>
        <div className="tax-actions">
          {LANGUAGE_OPTIONS.length > 1 && (
            <select
              className="tax-select"
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              aria-label={t("assessment_language")}
            >
              {LANGUAGE_OPTIONS.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
          {showLogout && (
            <button className="tax-btn ghost" type="button" onClick={onLogout}>
              {t("assessment_logout")}
            </button>
          )}
        </div>
      </header>
      <main className="tax-main">{children}</main>
    </div>
  );
};

export default TaxAssistantLayout;
