import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
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
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <Topbar title={title} />
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
