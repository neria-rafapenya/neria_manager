import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import i18n from "../../../infrastructure/i18n";
import {
  getInitialLanguage,
  persistLanguage,
  LANGUAGE_OPTIONS,
} from "../../../infrastructure/i18n/langs";

export interface SelfAssessmentLayoutProps {
  children: ReactNode;
  onLogout?: () => void;
  showLogout?: boolean;
}

const SelfAssessmentLayout = ({
  children,
  onLogout,
  showLogout,
}: SelfAssessmentLayoutProps) => {
  const { t } = useTranslation("common");
  const [language, setLanguage] = useState<string>(() => getInitialLanguage());

  useEffect(() => {
    void i18n.changeLanguage(language);
    persistLanguage(language);
  }, [language]);

  return (
    <div className="assessment-root">
      <header className="assessment-header">
        <div className="assessment-brand">
          <div className="assessment-logo">AI</div>
          <div>
            <h1>{t("assessment_header_title")}</h1>
            <p>{t("assessment_header_subtitle")}</p>
          </div>
        </div>
        <div className="assessment-actions">
          {LANGUAGE_OPTIONS.length > 1 && (
            <select
              className="assessment-select"
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
            <button className="assess-btn ghost" type="button" onClick={onLogout}>
              {t("assessment_logout")}
            </button>
          )}
        </div>
      </header>
      <main className="assessment-main">{children}</main>
    </div>
  );
};

export default SelfAssessmentLayout;
