import { NavLink } from "react-router-dom";

const items = [
  { label: "Inbox", to: "/claims" },
  { label: "Expedientes", to: "/claims" },
  { label: "Metricas", to: "/claims" },
  { label: "Configuracion", to: "/claims" },
];

export function SideNav() {
  return (
    <aside className="side-nav">
      <div className="side-nav-card">
        <p className="side-nav-title">Panel empresa</p>
        <nav className="nav flex-column">
          {items.map((item) => (
            <NavLink key={item.label} to={item.to} className="nav-link">
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="side-nav-card highlight">
        <p className="side-nav-title">Estado del dia</p>
        <div className="side-metric">
          <span>Expedientes completos</span>
          <strong>68%</strong>
        </div>
        <div className="side-metric">
          <span>Tiempo medio apertura</span>
          <strong>18 min</strong>
        </div>
      </div>
    </aside>
  );
}
