import { Link } from "react-router-dom";

export function TopNav() {
  return (
    <header className="top-nav">
      <div className="row align-items-center g-3">
        <div className="col-12 col-lg-4">
          <div className="brand">
            <span className="brand-badge">CF</span>
            <div>
              <h1>ClaimsFlow AI</h1>
              <p>Centro de control de siniestros</p>
            </div>
          </div>
        </div>
        <div className="col-12 col-lg-5">
          <div className="search-bar">
            <input
              type="search"
              placeholder="Buscar por numero de expediente, matricula, poliza"
              aria-label="Buscar"
            />
            <button type="button">Buscar</button>
          </div>
        </div>
        <div className="col-12 col-lg-3 d-flex justify-content-lg-end">
          <div className="nav-actions">
            <span className="agent-pill">Operador Senior</span>
            <Link className="btn btn-primary" to="/claims/new">
              Nuevo expediente
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
