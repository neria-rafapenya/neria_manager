import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import i18n from "../../../infrastructure/i18n";
import {
  getInitialLanguage,
  persistLanguage,
  LANGUAGE_OPTIONS,
} from "../../../infrastructure/i18n/langs";

export interface FinancialSimulatorLayoutProps {
  children: ReactNode;
  onLogout?: () => void;
  showLogout?: boolean;
}

const FinancialSimulatorLayout = ({
  children,
  onLogout,
  showLogout,
}: FinancialSimulatorLayoutProps) => {
  const { t } = useTranslation("common");
  const [language, setLanguage] = useState<string>(() => getInitialLanguage());

  useEffect(() => {
    void i18n.changeLanguage(language);
    persistLanguage(language);
  }, [language]);

  return (
    <div className="financial-root">
      <header className="financial-header">
        <div className="financial-brand">
          <div className="financial-logo">AI</div>
          <div>
            <h1>{t("financial_header_title")}</h1>
            <p>{t("financial_header_subtitle")}</p>
          </div>
        </div>
        <div className="financial-actions">
          {LANGUAGE_OPTIONS.length > 1 && (
            <select
              className="financial-select"
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              aria-label={t("financial_language")}
            >
              {LANGUAGE_OPTIONS.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
          {showLogout && (
            <button className="fin-btn ghost" type="button" onClick={onLogout}>
              {t("financial_logout")}
            </button>
          )}
        </div>
      </header>
      <main className="financial-main">{children}</main>
    </div>
  );
};

export default FinancialSimulatorLayout;
