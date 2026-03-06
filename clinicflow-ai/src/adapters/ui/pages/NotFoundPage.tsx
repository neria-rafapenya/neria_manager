import { Link } from "react-router-dom";

export const NotFoundPage = () => {
  return (
    <div className="page">
      <div className="card empty-state">
        <p className="eyebrow">404</p>
        <h2>Ruta no disponible</h2>
        <p className="muted">Vuelve al panel para continuar.</p>
        <Link to="/" className="btn btn-primary btn-normal">
          Volver al dashboard
        </Link>
      </div>
    </div>
  );
};
