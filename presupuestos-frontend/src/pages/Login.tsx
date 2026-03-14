import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { useTypewriter } from "../hooks/useTypewriter";
import { useNavigate } from "react-router-dom";
import { consumeSessionExpired } from "../services/session";
import { LogoNeriaQuotes } from "../components/icons/LogoNeriaQuotes";

export default function Login() {
  const { login, register, session } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [tenantName, setTenantName] = useState("");
  const [tenantSector, setTenantSector] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      if (mode === "login") {
        await login({ email, password });
      } else {
        await register({ tenantName, tenantSector, email, password });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  const heroMessages = [
    "Crea los presupuestos para tus clientes de forma automática usando la Inteligencia Artificial.",
    "Agiliza las tareas de documentación.",
    "Convierte solicitudes en presupuestos en segundos.",
  ];
  const [heroIndex, setHeroIndex] = useState(0);
  const heroMessage = heroMessages[heroIndex] ?? heroMessages[0];
  const heroText = useTypewriter(heroMessage, 55, heroIndex);

  useEffect(() => {
    if (heroText !== heroMessage) return;
    const timer = setTimeout(() => {
      setHeroIndex((prev) => (prev + 1) % heroMessages.length);
    }, 3500);
    return () => clearTimeout(timer);
  }, [heroText, heroMessage, heroMessages.length]);

  useEffect(() => {
    if (consumeSessionExpired()) {
      setNotice("Sesión caducada, vuelve a iniciar sesión.");
    }
    if (!session) return;
    if (session.user.mustChangePassword) {
      navigate("/change-password", { replace: true });
      return;
    }
    if (session.user.role === "ADMIN") {
      navigate("/dashboard", { replace: true });
    } else {
      navigate("/request", { replace: true });
    }
  }, [session, navigate]);

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-md-6 video-bg">
          <div className="overlay"></div>

          <div className="video-content">{heroText}</div>
        </div>

        <div className="col-md-6 bg-dark text-light vh-100 p-5">
          <h1 className="titular-login">
            <LogoNeriaQuotes width={280} />
          </h1>
          <div style={{ height: "60vh" }} className="d-flex align-items-center">
            <div className="card w-50 p-3 mx-auto">
              <p>
                {mode === "login"
                  ? "Acceso para usuarios"
                  : "Registro para solicitar presupuesto"}
              </p>

              <small className="small-text mb-4">
                {mode === "login"
                  ? ""
                  : "Rellena los campos para poder entrar a crear tu presupuesto."}
              </small>

              <form onSubmit={handleSubmit} className="auth-form">
                <AnimatePresence initial={false}>
                  {mode === "register" && (
                    <motion.div
                      key="register-fields"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      style={{ overflow: "hidden" }}
                    >
                      <label htmlFor="tenantName" className="mb-3">
                        <span>Empresa</span>
                        <input
                          type="text"
                          placeholder="Nombre de tu empresa"
                          id="tenantName"
                          className="form-control light"
                          value={tenantName}
                          onChange={(e) => setTenantName(e.target.value)}
                          required
                        />
                      </label>

                      <label htmlFor="tenantSector">
                        <span>Sector (opcional)</span>
                        <input
                          type="text"
                          placeholder="¿Cuál es tu sector?"
                          id="tenantSector"
                          className="form-control light"
                          value={tenantSector}
                          onChange={(e) => setTenantSector(e.target.value)}
                        />
                      </label>
                    </motion.div>
                  )}
                </AnimatePresence>

                <label htmlFor="loginEmail">
                  <span>E-mail</span>
                  <input
                    type="email"
                    placeholder="Escribe tu E-mail"
                    id="loginEmail"
                    className="form-control light mb-3"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </label>

                <label htmlFor="loginPassword">
                  <span>Password</span>
                  <input
                    placeholder="Escribe tu password"
                    type="password"
                    id="loginPassword"
                    className="form-control light"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </label>

                {notice && <div className="auth-error">{notice}</div>}
                {error && <div className="auth-error">{error}</div>}

                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={loading}
                >
                  {loading
                    ? "Cargando..."
                    : mode === "login"
                      ? "Entrar"
                      : "Registrarme"}
                </button>
              </form>
            </div>
          </div>

          <div className="text-center p-3 mx-auto auth-toggle">
            {mode === "login" ? (
              <button onClick={() => setMode("register")}>Registrarme</button>
            ) : (
              <button onClick={() => setMode("login")}>
                Acceder con tu cuenta
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
