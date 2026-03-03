import { useState } from "react";
import { useAuthContext } from "../../../infrastructure/contexts/AuthContext";

export const LoginPage = () => {
  const { login, loading, error } = useAuthContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
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
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Conectando..." : "Entrar"}
          </button>
          <p className="login-hint">
            Este acceso usa los usuarios asignados al servicio ClinicFlow.
          </p>
        </form>
      </div>
    </div>
  );
};
