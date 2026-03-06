import { useEffect, useMemo, useState } from "react";
import { SectionHeader } from "../components/SectionHeader";
import { Tag } from "../components/Tag";
import { clinicflowApi } from "../../../infrastructure/api/clinicflowApi";

interface ReportTemplate {
  id: string;
  name?: string | null;
  specialty?: string | null;
  status?: string | null;
}

export const ReportsPage = () => {
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setError(null);
      try {
        const list = await clinicflowApi.listReports();
        if (!mounted) return;
        setTemplates((list as ReportTemplate[]) || []);
      } catch (err: any) {
        if (!mounted) return;
        setError(err.message || "No se pudieron cargar las plantillas.");
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const rows = useMemo(() => {
    return templates.map((template) => ({
      id: template.id,
      name: template.name || "Plantilla",
      specialty: template.specialty || "General",
      status: template.status || "Pendiente",
    }));
  }, [templates]);

  return (
    <div className="page">
      <SectionHeader
        title="Generador de informes"
        subtitle="Borradores por especialidad con códigos internos"
        action="Nueva plantilla"
      />

      {error ? <div className="card error-banner">{error}</div> : null}

      <section className="grid two-columns">
        <div className="card list-card">
          <h3>Plantillas disponibles</h3>
          <div className="list">
            {rows.length === 0 ? (
              <div className="list-row">
                <div>
                  <p className="list-title">Sin plantillas aún</p>
                  <p className="muted">Crea la primera plantilla clínica.</p>
                </div>
              </div>
            ) : (
              rows.map((template) => (
                <div key={template.id} className="list-row">
                  <div>
                    <p className="list-title">{template.name}</p>
                    <p className="muted">{template.specialty}</p>
                  </div>
                  <div className="list-meta">
                    <Tag
                      tone={
                        template.status.toLowerCase().includes("activo")
                          ? "success"
                          : "warning"
                      }
                    >
                      {template.status}
                    </Tag>
                    <button className="btn btn-ghost">Editar</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <h3>Generación rápida</h3>
          <div className="copy-box">
            <p className="muted">Entrada:</p>
            <p>Anamnesis + hallazgos + plan de tratamiento</p>
          </div>
          <div className="copy-actions">
            <button className="btn btn-primary btn-normal">
              Crear borrador
            </button>
            <button className="btn btn-secondary">Dictado</button>
          </div>
        </div>
      </section>
    </div>
  );
};
