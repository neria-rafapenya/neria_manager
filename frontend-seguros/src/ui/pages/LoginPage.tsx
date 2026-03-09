import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../app/AuthProvider";
import { getDefaultPathForRole } from "../app/auth-helpers";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(getDefaultPathForRole(user?.role), { replace: true });
    }
  }, [isAuthenticated, navigate, user?.role]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const session = await login(email.trim(), password);
      const next =
        (location.state as { from?: string } | null)?.from ??
        getDefaultPathForRole(session.role);
      navigate(next, { replace: true });
    } catch (err) {
      setError("Credenciales invalidas o acceso no autorizado.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-card">
      <div className="login-brand">
        <span>CF</span>
        <div>
          <h2>ClaimsFlow AI</h2>
          <p>Acceso aseguradoras y corredurias</p>
        </div>
      </div>
      <form className="login-form" onSubmit={handleSubmit}>
        <label className="form-label">Correo corporativo</label>
        <input
          className="form-control"
          type="email"
          placeholder="nombre@aseguradora.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <label className="form-label">Contrasena</label>
        <input
          className="form-control"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        {error ? <p className="login-error">{error}</p> : null}
        <button type="submit" className="btn btn-primary w-100" disabled={isSubmitting}>
          {isSubmitting ? "Entrando..." : "Entrar"}
        </button>
        <p className="login-help">No tienes acceso? Contacta con soporte de ClaimsFlow.</p>
      </form>
    </div>
  );
}
