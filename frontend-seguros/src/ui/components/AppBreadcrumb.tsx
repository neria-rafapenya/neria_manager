import { Link, useLocation } from "react-router-dom";

const LABELS: Record<string, string> = {
  claims: "Siniestros",
  portal: "Portal",
  new: "Nuevo",
};

export function AppBreadcrumb() {
  const location = useLocation();
  const segments = location.pathname.split("/").filter(Boolean);

  const crumbs: Array<{ label: string; to?: string }> = [{ label: "Inicio", to: "/" }];

  if (segments.length === 0) {
    return null;
  }

  if (segments[0] === "claims") {
    crumbs.push({ label: LABELS.claims, to: "/claims" });
    if (segments[1] && segments[1] !== "new") {
      const shortId = segments[1].slice(0, 8);
      crumbs.push({ label: `Expediente ${shortId}` });
    }
    if (segments[1] === "new") {
      crumbs.push({ label: LABELS.new });
    }
  }

  if (segments[0] === "portal") {
    crumbs.push({ label: LABELS.portal });
    if (segments[1] === "claims") {
      crumbs.push({ label: LABELS.claims, to: "/portal" });
      if (segments[2]) {
        const shortId = segments[2].slice(0, 8);
        crumbs.push({ label: `Expediente ${shortId}` });
      }
    }
  }

  return (
    <nav className="app-breadcrumb" aria-label="breadcrumb">
      <ol className="breadcrumb">
        {crumbs.map((crumb, index) => (
          <li
            key={`${crumb.label}-${index}`}
            className={`breadcrumb-item ${index === crumbs.length - 1 ? "active" : ""}`}
          >
            {crumb.to && index !== crumbs.length - 1 ? (
              <Link to={crumb.to}>{crumb.label}</Link>
            ) : (
              <span>{crumb.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
