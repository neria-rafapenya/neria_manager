import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import i18n from "../../../infrastructure/i18n";
import {
  getInitialLanguage,
  persistLanguage,
  LANGUAGE_OPTIONS,
} from "../../../infrastructure/i18n/langs";

export interface EmailAutomationLayoutProps {
  children: ReactNode;
  onLogout?: () => void;
  showLogout?: boolean;
}

const EmailAutomationLayout = ({
  children,
  onLogout,
  showLogout,
}: EmailAutomationLayoutProps) => {
  const { t } = useTranslation("common");
  const [language, setLanguage] = useState<string>(() => getInitialLanguage());

  useEffect(() => {
    void i18n.changeLanguage(language);
    persistLanguage(language);
  }, [language]);

  return (
    <div className="email-automation-root">
      <header className="email-automation-header">
        <div className="email-automation-brand">
          <div className="email-automation-logo">AI</div>
          <div>
            <h1>{t("email_header_title")}</h1>
            <p>{t("email_header_subtitle")}</p>
          </div>
        </div>
        <div className="email-automation-actions">
          {LANGUAGE_OPTIONS.length > 1 && (
            <select
              className="email-automation-select"
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              aria-label={t("email_language")}
            >
              {LANGUAGE_OPTIONS.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
          {showLogout && (
            <button className="ea-btn ghost" type="button" onClick={onLogout}>
              {t("email_logout")}
            </button>
          )}
        </div>
      </header>
      <main className="email-automation-main">{children}</main>
    </div>
  );
};

export default EmailAutomationLayout;
