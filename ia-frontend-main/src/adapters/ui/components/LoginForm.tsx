// src/adapters/ui/react/auth/LoginForm.tsx
import { useState, type FormEvent } from "react";
import { useAuthContext } from "../../../infrastructure/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { getServiceCode, getServiceId } from "../../../infrastructure/config/env";

export const LoginForm = () => {
  const { login, loading, error } = useAuthContext();
  const { t } = useTranslation("common");

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await login({
      email,
      password,
      serviceCode: getServiceCode(),
      tenantServiceId: getServiceId(),
    });
  };

  return (
    <div className="iachat-login-container">
      <form className="iachat-login-form" onSubmit={handleSubmit}>
        <div className="iachat-login-header">
          {/* <div className="iachat-login-avatar">🤖</div> */}
          <div className="iachat-login-header-text">
            <h2 className="iachat-login-title">{t("login_title")}</h2>
            <p className="iachat-login-subtitle">{t("login_subtitle")}</p>
          </div>
        </div>

        <div className="iachat-login-field">
          {/* <label htmlFor="iachat-email" className="iachat-login-label">
            {t("login_email_label")}
          </label> */}
          <input
            id="iachat-email"
            className="iachat-login-input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("login_email_placeholder")}
            required
          />
        </div>

        <div className="iachat-login-field">
          {/* <label htmlFor="iachat-password" className="iachat-login-label">
            {t("login_password_label")}
          </label> */}
          <input
            id="iachat-password"
            className="iachat-login-input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("login_password_placeholder")}
            required
          />
        </div>

        {error && <p className="iachat-login-error">{error}</p>}

        <button
          className="iachat-login-button"
          type="submit"
          disabled={loading}
        >
          {loading ? t("login_loading") : t("login_button")}
        </button>

        <p className="iachat-login-hint">{t("login_hint")}</p>
      </form>
    </div>
  );
};
