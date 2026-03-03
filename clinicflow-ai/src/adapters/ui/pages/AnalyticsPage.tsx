import { SectionHeader } from "../components/SectionHeader";
import { Tag } from "../components/Tag";
import { analytics } from "../../../core/domain/mockData";

export const AnalyticsPage = () => {
  return (
    <div className="page">
      <SectionHeader
        title="Métricas operativas"
        subtitle="Ahorro de tiempo y automatización"
        action="Exportar"
      />

      <section className="grid three-columns">
        {analytics.map((metric) => (
          <div key={metric.title} className="card stat-card">
            <p className="stat-label">{metric.title}</p>
            <p className="stat-value">{metric.value}</p>
            <p className="muted">{metric.detail}</p>
          </div>
        ))}
      </section>

      <section className="card">
        <h3>Embudo operativo</h3>
        <div className="funnel">
          <div className="funnel-step">
            <span>Conversaciones</span>
            <Tag tone="info">1.240</Tag>
          </div>
          <div className="funnel-step">
            <span>Citas generadas</span>
            <Tag tone="success">213</Tag>
          </div>
          <div className="funnel-step">
            <span>Visitas realizadas</span>
            <Tag tone="neutral">176</Tag>
          </div>
          <div className="funnel-step">
            <span>Tratamientos iniciados</span>
            <Tag tone="warning">94</Tag>
          </div>
        </div>
      </section>
    </div>
  );
};
