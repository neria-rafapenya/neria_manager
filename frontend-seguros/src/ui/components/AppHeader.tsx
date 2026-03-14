import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../app/AuthProvider";
import { useMemo, useState } from "react";

export function AppHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  const displayName = useMemo(() => {
    if (!user?.email) return "Usuario";
    const name = user.email.split("@")[0] ?? user.email;
    return name.replace(".", " ");
  }, [user?.email]);

  const initial = (displayName[0] ?? "U").toUpperCase();

  const navItems = useMemo(() => {
    if (user?.role === "user") {
      return [
        { to: "/portal", label: "Portal" },
        { to: "/claims/new", label: "Abrir siniestro" },
      ];
    }
    return [
      { to: "/claims", label: "Dashboard" },
      { to: "/claims/new", label: "Nuevo siniestro" },
    ];
  }, [user?.role]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="app-header">
      <nav className="navbar navbar-expand-lg navbar-dark">
        <div className="container-fluid">
          <NavLink className="navbar-brand" to="/">
            <span className="brand-dot">CF</span>
            <span>ClaimsFlow AI</span>
          </NavLink>
          <button
            className="navbar-toggler"
            type="button"
            aria-controls="appNavbar"
            aria-expanded={expanded}
            aria-label="Toggle navigation"
            onClick={() => setExpanded((prev) => !prev)}
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className={`collapse navbar-collapse ${expanded ? "show" : ""}`} id="appNavbar">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              {navItems.map((item) => (
                <li className="nav-item" key={item.to}>
                  <NavLink className="nav-link" to={item.to} onClick={() => setExpanded(false)}>
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
            <div className="d-flex align-items-center gap-2">
              <div className="user-avatar" title={displayName}>
                {initial}
              </div>
              <div className="user-meta d-none d-md-flex">
                <span className="user-name">{displayName}</span>
                <span className="user-role">{user?.role ?? "user"}</span>
              </div>
              <button className="btn btn-outline-light btn-sm" onClick={handleLogout} type="button">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}

