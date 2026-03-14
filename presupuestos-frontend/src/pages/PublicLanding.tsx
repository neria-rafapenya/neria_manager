import { Link } from "react-router-dom";

export default function PublicLanding() {
  return (
    <div className="landing">
      <div className="landing-hero">
        <h1>Presupuestos automáticos por email</h1>
        <p>
          Plataforma SaaS para generar presupuestos en minutos. Si ya tienes cuenta, inicia sesión.
          Si no, regístrate para solicitar tu primer presupuesto.
        </p>
        <div className="landing-actions">
          <Link to="/auth" className="landing-button">
            Iniciar sesión / Registrarse
          </Link>
        </div>
      </div>
      <div className="landing-panel">
        <h2>¿Cómo funciona?</h2>
        <ol>
          <li>Registras tu cuenta o inicias sesión.</li>
          <li>Solicitas tu presupuesto desde el área de usuario.</li>
          <li>Recibes el PDF con el detalle completo.</li>
        </ol>
      </div>
    </div>
  );
}
