import { NavLink } from "react-router-dom";
import { useAuthContext } from "../../../infrastructure/contexts/AuthContext";
import { IconExit } from "../components/shared/icons";
import { getRolePermissions, normalizeClinicRole } from "../../../core/domain/roles";

const navItems = [
  { label: "Dashboard", to: "/", permission: "canViewDashboard" },
  { label: "Conversaciones", to: "/conversaciones", permission: "canViewConversations" },
  { label: "Agenda", to: "/agenda", permission: "canViewAgenda" },
  { label: "Pacientes", to: "/pacientes", permission: "canViewPatients" },
  { label: "Protocolos", to: "/protocolos", permission: "canViewProtocols" },
  { label: "Triaje", to: "/triaje", permission: "canViewTriage" },
  { label: "Informes", to: "/informes", permission: "canViewReports" },
  { label: "Métricas", to: "/metricas", permission: "canViewMetrics" },
  { label: "Admin", to: "/admin", permission: "canViewAdmin" },
] as const;

const patientNavItems = [{ label: "Mi área", to: "/paciente" }];

type PermissionKey = (typeof navItems)[number]["permission"];

export const Topbar = () => {
  const { user, logout } = useAuthContext();
  const permissions = getRolePermissions(normalizeClinicRole(user?.role));
  const activeItems = permissions.isPatient
    ? patientNavItems
    : navItems.filter((item) => permissions[item.permission as PermissionKey]);

  return (
    <nav className="navbar navbar-light bg-white border-bottom topbar">
      <div className="container-fluid">
        {/* BRAND */}
        <div className="navbar-brand d-flex align-items-center gap-3 m-0">
          <div className="brand-mark">CF</div>
          <div>
            <p className="topbar-title mb-0">Neria Clinic</p>
          </div>
        </div>

        {/* TOGGLER MOBILE */}
        <button
          className="navbar-toggler d-xl-none"
          type="button"
          data-bs-toggle="offcanvas"
          data-bs-target="#topbarMenu"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* DESKTOP NAV */}
        <div className="d-none d-xl-flex flex-grow-1 justify-content-center">
          <ul className="navbar-nav flex-row gap-4 align-items-center">
            {activeItems.map((item) => (
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

        {/* USER */}
        <div className="d-none d-xl-flex align-items-center gap-2">
          <span className="topbar-user-label">{user?.email ?? ""}</span>

          <button
            className="btn-ghost p-0 m-0 ms-2"
            onClick={logout}
            type="button"
          >
            <IconExit className="icon-style" />
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
            {activeItems.map((item) => (
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
