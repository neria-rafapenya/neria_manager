import { Link, NavLink } from "react-router-dom";
import { UserNavItem } from "./types";
import { LogoNeriaQuotes } from "../components/icons/LogoNeriaQuotes";

interface HeaderProps {
  navItems: UserNavItem[];
  email: string;
  onLogout: () => void;
}

export default function Header({ navItems, email, onLogout }: HeaderProps) {
  return (
    <header className="sticky-top ps-4 pe-4">
      <nav
        className="navbar navbar-expand-lg navbar-light"
        style={{ background: "#f4f3ec" }}
      >
        <div className="container-fluid">
          <Link className="navbar-brand text-dark" to="/">
            <LogoNeriaQuotes width={180} />
          </Link>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#userNavbar"
            aria-controls="userNavbar"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div
            className="collapse navbar-collapse position-lg-relative"
            id="userNavbar"
          >
            <ul className="navbar-nav mx-lg-auto mb-2 mb-lg-0 w-100 justify-content-center">
              {navItems.map((item) => (
                <li className="nav-item" key={item.path}>
                  <NavLink className="nav-link text-dark" to={item.path}>
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
            <div className="d-flex align-items-center gap-3 text-dark position-lg-absolute end-lg-0">
              <span className="small">{email}</span>
              <button
                className="btn btn-outline-dark btn-sm"
                onClick={onLogout}
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
