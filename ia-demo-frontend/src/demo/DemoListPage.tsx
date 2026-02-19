import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { loadDemos } from "./demoLoader";
import type { DemoConfig } from "./types";

export const DemoListPage = () => {
  const [demos, setDemos] = useState<DemoConfig[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDemos()
      .then(setDemos)
      .catch((err) => setError(err.message || "No se pudieron cargar demos"));
  }, []);

  return (
    <div className="demo-shell">
      <header className="demo-header">
        <div>
          <h1>Galeria de demos</h1>
          <p className="muted">
            Selecciona un servicio para abrir su demo en vivo.
          </p>
        </div>
      </header>

      {error && <div className="demo-error">{error}</div>}

      <div className="demo-grid">
        {demos.map((demo) => (
          <Link
            key={demo.code}
            to={`/demo/${demo.code}`}
            className="demo-card"
          >
            <div className="demo-card-title">{demo.name}</div>
            <div className="demo-card-code">{demo.code}</div>
            {demo.description && (
              <div className="demo-card-desc">{demo.description}</div>
            )}
            <div className="demo-card-mode">{demo.mode || "chat"}</div>
          </Link>
        ))}
      </div>
      {demos.length === 0 && !error && (
        <div className="muted">No hay demos configuradas.</div>
      )}
    </div>
  );
};
