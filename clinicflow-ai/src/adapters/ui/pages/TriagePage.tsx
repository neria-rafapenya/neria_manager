import { useEffect, useMemo, useState } from "react";
import { SectionHeader } from "../components/SectionHeader";
import { Tag } from "../components/Tag";
import { clinicflowApi } from "../../../infrastructure/api/clinicflowApi";

interface TriageItem {
  id: string;
  name?: string | null;
  description?: string | null;
  status?: string | null;
  outcome?: string | null;
}

export const TriagePage = () => {
  const [flows, setFlows] = useState<TriageItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setError(null);
      try {
        const list = await clinicflowApi.listTriage();
        if (!mounted) return;
        setFlows((list as TriageItem[]) || []);
      } catch (err: any) {
        if (!mounted) return;
        setError(err.message || "No se pudieron cargar los flujos.");
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const flowRows = useMemo(() => {
    return flows.map((flow) => ({
      id: flow.id,
      name: flow.name || "Flujo de triaje",
      steps: flow.description || "Sin descripción",
      outcome: flow.outcome || flow.status || "Pendiente",
    }));
  }, [flows]);

  return (
    <div className="page">
      <SectionHeader
        title="Triaje inteligente"
        subtitle="Reglas y guardrails para decisiones seguras"
        action="Nuevo flujo"
      />

      {error ? <div className="card error-banner">{error}</div> : null}

      <section className="grid two-columns">
        <div className="card list-card">
          <h3>Flujos activos</h3>
          <div className="list">
            {flowRows.length === 0 ? (
              <div className="list-row">
                <div>
                  <p className="list-title">Sin flujos todavía</p>
                  <p className="muted">Configura tu primer triaje.</p>
                </div>
              </div>
            ) : (
              flowRows.map((flow) => (
                <div key={flow.id} className="list-row">
                  <div>
                    <p className="list-title">{flow.name}</p>
                    <p className="muted">{flow.steps}</p>
                  </div>
                  <div className="list-meta">
                    <Tag tone={flow.outcome.toLowerCase().includes("urg") ? "warning" : "success"}>
                      {flow.outcome}
                    </Tag>
                    <button className="btn btn-ghost">Editar</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <h3>Guardrails críticos</h3>
          <ul className="checklist">
            <li className="done">Nunca dar diagnóstico definitivo</li>
            <li className="done">Escalar si dolor &gt; 7/10</li>
            <li className="done">Aviso legal visible</li>
            <li>Revisión médica trimestral</li>
          </ul>
        </div>
      </section>
    </div>
  );
};
