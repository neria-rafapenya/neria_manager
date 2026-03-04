import { Outlet, useLocation } from "react-router-dom";
import { Topbar } from "./Topbar";
import { useState, useEffect } from "react";

const routeTitles: Record<string, string> = {
  "/": "Dashboard clínico",
  "/paciente": "Área del paciente",
  "/conversaciones": "Bandeja omnicanal",
  "/agenda": "Agenda inteligente",
  "/pacientes": "Pacientes",
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
  console.log(title);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = document.documentElement.scrollTop;
      setScrolled(scrollTop > 20);
    };

    document.addEventListener("scroll", handleScroll);

    return () => {
      document.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div className="container-fluid app-shell">
      <header className={`row app-header ${scrolled ? "is-scrolled" : ""}`}>
        <div className="col-12">
          <Topbar />
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
