import { useMemo } from "react";
import { NavLink } from "react-router-dom";
import { useAuthContext } from "../../../infrastructure/contexts/AuthContext";

interface TopbarProps {
  title: string;
}

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

export const Topbar = ({ title }: TopbarProps) => {
  const { user, logout } = useAuthContext();

  const dateLabel = useMemo(() => {
    return new Intl.DateTimeFormat("es-ES", {
      weekday: "long",
      month: "long",
      day: "numeric",
    }).format(new Date());
  }, []);

  return (
    <nav className="navbar navbar-light bg-white border-bottom topbar">
      <div className="container-fluid">
        {/* BRAND */}
        <div className="navbar-brand d-flex align-items-center gap-3 m-0">
          <div className="brand-mark">CF</div>
          <div>
            <p className="topbar-title mb-0">{title}</p>
            <p className="topbar-subtitle mb-0">{dateLabel}</p>
          </div>
        </div>

        {/* TOGGLER MOBILE */}
        <button
          className="navbar-toggler d-xl-none"
          type="button"
          data-bs-toggle="offcanvas"
          data-bs-target="#topbarMenu"
          aria-controls="topbarMenu"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* DESKTOP NAV */}
        <div className="d-none d-xl-flex flex-grow-1 justify-content-center">
          <ul className="navbar-nav flex-row gap-4 align-items-center">
            {navItems.map((item) => (
              <li key={item.to} className="nav-item">
                <NavLink
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    `nav-link${isActive ? " active" : ""}`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        {/* USER RIGHT */}
        <div className="d-none d-xl-flex align-items-center gap-2">
          <span className="topbar-user-label">{user?.email ?? ""}</span>

          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={logout}
            type="button"
          >
            Salir
          </button>
        </div>
      </div>
      {/* MOBILE MENU */}
      <div className="offcanvas offcanvas-start" tabIndex={-1} id="topbarMenu">
        <div className="offcanvas-header">
          <div>
            <h5 className="offcanvas-title">ClinicFlow</h5>
            <div className="small text-muted">{user?.email ?? ""}</div>
          </div>

          <button
            type="button"
            className="btn-close"
            data-bs-dismiss="offcanvas"
          />
        </div>

        <div className="offcanvas-body d-flex flex-column">
          <ul className="navbar-nav">
            {navItems.map((item) => (
              <li key={item.to} className="nav-item">
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `nav-link${isActive ? " active" : ""}`
                  }
                  data-bs-dismiss="offcanvas"
                  end={item.to === "/"}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="flex-grow-1" />

          <div className="pt-3 border-top">
            <button
              className="btn btn-outline-secondary w-100"
              type="button"
              data-bs-dismiss="offcanvas"
              onClick={logout}
            >
              Salir
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
