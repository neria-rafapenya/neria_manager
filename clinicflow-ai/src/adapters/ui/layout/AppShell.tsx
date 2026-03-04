import { Outlet, useLocation } from "react-router-dom";
import { Topbar } from "./Topbar";

const routeTitles: Record<string, string> = {
  "/": "Dashboard clínico",
  "/conversaciones": "Bandeja omnicanal",
  "/agenda": "Agenda inteligente",
  "/protocolos": "Protocolos y FAQ",
  "/triaje": "Triaje asistido",
  "/informes": "Generador de informes",
  "/metricas": "Métricas operativas",
  "/admin": "Administración",
};

export const AppShell = () => {
  const location = useLocation();
  const root = location.pathname.split("/").slice(0, 2).join("/") || "/";
  const title = routeTitles[root] || "ClinicFlow AI";

  return (
    <div className="container-fluid app-shell">
      <header className="row app-header">
        <div className="col-12">
          <Topbar title={title} />
        </div>
      </header>
      <main className="row">
        <div className="col-12 app-content">
          <div className="container">
            <Outlet />
          </div>
        </div>
      </main>
      <footer className="row app-footer">
        <div className="col-12 d-flex flex-wrap align-items-center justify-content-between gap-2">
          <span>ClinicFlow AI · Operación clínica conectada</span>
          <span>Soporte: soporte@clinicflow.ai</span>
        </div>
      </footer>
    </div>
  );
};
