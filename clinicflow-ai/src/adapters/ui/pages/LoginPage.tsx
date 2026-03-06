import { useState } from "react";
import { useAuthContext } from "../../../infrastructure/contexts/AuthContext";
import { RegisterModal } from "../components/shared/RegisterModal";
import { IconGoogle, IconFacebook } from "../components/shared/icons";

export const LoginPage = () => {
  const { login, register, loginWithProvider, loading, error } =
    useAuthContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  const handleSubmit = async (event?: React.FormEvent | React.MouseEvent) => {
    event?.preventDefault();
    await login({ email, password });
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="brand-mark">CF</div>
          <div>
            <h1>ClinicFlow AI</h1>
            <p className="muted">Accede al panel operativo de la clínica.</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          <label className="login-field">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="recepcion@clinicadental.com"
              required
            />
          </label>
          <label className="login-field">
            Contraseña
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              required
            />
          </label>
          {error ? <p className="login-error">{error}</p> : null}
          <button
            className="btn btn-primary btn-normal"
            type="submit"
            disabled={loading}
            onClick={handleSubmit}
          >
            {loading ? "Conectando..." : "Entrar"}
          </button>
          <div className="d-flex gap-2">
            <button
              className="btn btn-google"
              type="button"
              onClick={() => loginWithProvider("google")}
            >
              <IconGoogle />
              Continuar con Google
            </button>
            <button
              className="btn btn-facebook"
              type="button"
              onClick={() => loginWithProvider("facebook")}
            >
              <IconFacebook />
              Continuar con Facebook
            </button>
          </div>
          <button
            className="btn secondary"
            type="button"
            onClick={() => setIsRegisterOpen(true)}
          >
            Crear una cuenta
          </button>
          <p className="login-hint">
            Este acceso usa los usuarios asignados al servicio ClinicFlow.
          </p>
        </form>
      </div>

      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onRegister={register}
        onSocialLogin={loginWithProvider}
      />
    </div>
  );
};
