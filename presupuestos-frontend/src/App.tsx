import { useEffect, useState } from "react";
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Quotes from "./pages/Quotes";
import Leads from "./pages/Leads";
import Pricing from "./pages/Pricing";
import Formulas from "./pages/Formulas";
import AiSettings from "./pages/AiSettings";
import AiProfiles from "./pages/AiProfiles";
import Materials from "./pages/Materials";
import EmailSettings from "./pages/EmailSettings";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Faqs from "./pages/Faqs";
import Customers from "./pages/Customers";
import Sectors from "./pages/Sectors";
import UserHome from "./pages/UserHome";
import UserQuoteRequest from "./pages/UserQuoteRequest";
import PublicLanding from "./pages/PublicLanding";
import ChangePassword from "./pages/ChangePassword";
import { useAuth } from "./contexts/AuthContext";
import Header from "./layout/Header";
import Footer from "./layout/Footer";
import Main from "./layout/Main";
import { LogoNeriaQuotes } from "./components/icons/LogoNeriaQuotes";

const adminNavItems = [
  { path: "/dashboard", label: "Dashboard" },
  { path: "/quotes", label: "Quotes" },
  { path: "/customers", label: "Customers" },
  { path: "/leads", label: "Leads" },
  { path: "/products", label: "Products" },
  { path: "/materials", label: "Materiales" },
  { path: "/formulas", label: "Formulas" },
  { path: "/sectors", label: "Sectors" },
  { path: "/pricing", label: "Pricing" },
  { path: "/ai-settings", label: "AI Settings" },
  { path: "/ai-profiles", label: "AI Profiles" },
  { path: "/email", label: "Email" },
  { path: "/settings", label: "Settings" },
  { path: "/faqs", label: "FAQs" },
];

const userNavItems = [
  { path: "/request", label: "Solicitar presupuesto" },
  { path: "/quotes", label: "Mis presupuestos" },
  { path: "/faqs", label: "FAQs" },
];

export default function App() {
  const { session, logout } = useAuth();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  if (!session) {
    return (
      <Routes>
        <Route path="/" element={<PublicLanding />} />
        <Route path="/auth" element={<Login />} />
        <Route path="*" element={<PublicLanding />} />
      </Routes>
    );
  }

  const isAdmin = session.user.role === "ADMIN";
  const navItems = isAdmin ? adminNavItems : userNavItems;

  const appTitle = isAdmin ? "Presupuestos Backoffice" : "Presupuestos";

  if (
    session.user.mustChangePassword &&
    location.pathname !== "/change-password"
  ) {
    return <Navigate to="/change-password" replace />;
  }

  if (isAdmin) {
    return (
      <div className="app-shell">
        <aside className="sidebar">
          <div className="sidebar-header">
            <div className="sidebar-logo">
              <LogoNeriaQuotes width={190} />
            </div>
            <button
              type="button"
              className="sidebar-toggle"
              aria-label="Abrir menú"
              aria-expanded={mobileNavOpen}
              onClick={() => setMobileNavOpen((prev) => !prev)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>

          <ul className={`nav-list mt-5 ${mobileNavOpen ? "nav-open" : ""}`}>
            {navItems.map((item) => (
              <li key={item.path} className="nav-item">
                <Link to={item.path} className="nav-link-full">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </aside>
        <main className="main">
          <div className="topbar">
            <div>Backoffice interno · Tenant: {session.tenant.name}</div>
            <div>
              {session.user.email}
              <button className="link-button" onClick={logout}>
                Salir
              </button>
            </div>
          </div>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/change-password" element={<ChangePassword />} />
            <Route path="/quotes" element={<Quotes />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/leads" element={<Leads />} />
            <Route path="/products" element={<Products />} />
            <Route path="/materials" element={<Materials />} />
            <Route path="/formulas" element={<Formulas />} />
            <Route path="/sectors" element={<Sectors />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/ai-settings" element={<AiSettings />} />
            <Route path="/ai-profiles" element={<AiProfiles />} />
            <Route path="/email" element={<EmailSettings />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/faqs" element={<Faqs />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    );
  }

  return (
    <div className="user-shell">
      <Header
        navItems={userNavItems}
        email={session.user.email}
        onLogout={logout}
      />
      <Main>
        <Routes>
          <Route path="/" element={<Navigate to="/request" replace />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/quotes" element={<Quotes />} />
          <Route path="/request" element={<UserQuoteRequest />} />
          <Route path="/faqs" element={<Faqs />} />
          <Route path="*" element={<Navigate to="/request" replace />} />
        </Routes>
      </Main>
      <Footer tenantName={session.tenant.name} />
    </div>
  );
}
