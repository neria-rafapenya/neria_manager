import { NavLink } from "react-router-dom";

const navItems = [
  { label: "Dashboard", to: "/" },
  { label: "Conversaciones", to: "/conversaciones" },
  { label: "Agenda", to: "/agenda" },
  { label: "Protocolos", to: "/protocolos" },
  { label: "Triaje", to: "/triaje" },
  { label: "Informes", to: "/informes" },
  { label: "Métricas", to: "/metricas" },
  { label: "Admin", to: "/admin" },
];

export const Sidebar = () => {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark">CF</div>
        <div>
          <p className="brand-title">ClinicFlow AI</p>
          <p className="brand-subtitle">Asistente clínico omnicanal</p>
        </div>
      </div>

      <div className="sidebar-metrics">
        <div>
          <p className="sidebar-metric-label">Automatizado</p>
          <p className="sidebar-metric-value">74%</p>
        </div>
        <div>
          <p className="sidebar-metric-label">Citas creadas</p>
          <p className="sidebar-metric-value">128</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              isActive ? "sidebar-link active" : "sidebar-link"
            }
          >
            <span>{item.label}</span>
            <span className="sidebar-dot" />
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-card">
          <p className="sidebar-card-title">Lista de espera</p>
          <p className="sidebar-card-value">14 pacientes</p>
          <p className="sidebar-card-meta">Último hueco liberado hace 8 min</p>
        </div>
      </div>
    </aside>
  );
};
