import { SectionHeader } from "../components/SectionHeader";
import { StatCard } from "../components/StatCard";
import { Tag } from "../components/Tag";
import { ProgressBar } from "../components/ProgressBar";
import { kpis, tasks, conversations, appointments } from "../../../core/domain/mockData";

export const DashboardPage = () => {
  return (
    <div className="page">
      <section className="hero card">
        <div className="hero-copy">
          <p className="eyebrow">ClinicFlow AI</p>
          <h1>Menos llamadas, más citas confirmadas.</h1>
          <p className="muted">
            Un asistente omnicanal que responde dudas, gestiona agenda y prepara
            informes con protocolos clínicos.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary">Crear flujo de triaje</button>
            <button className="btn btn-ghost">Ver métricas</button>
          </div>
        </div>
        <div className="hero-panel">
          <p className="hero-panel-title">Estado operativo</p>
          <ProgressBar value={74} label="Automatización actual" />
          <div className="hero-panel-grid">
            <div>
              <p className="hero-panel-label">Citas hoy</p>
              <p className="hero-panel-value">28</p>
            </div>
            <div>
              <p className="hero-panel-label">Triajes activos</p>
              <p className="hero-panel-value">9</p>
            </div>
            <div>
              <p className="hero-panel-label">Handoff pendiente</p>
              <p className="hero-panel-value">3</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid kpi-grid">
        {kpis.map((kpi) => (
          <StatCard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            change={kpi.change}
            tone={kpi.tone}
          />
        ))}
      </section>

      <section className="grid two-columns">
        <div className="card list-card">
          <SectionHeader
            title="Tareas críticas"
            subtitle="Revisión de protocolos y agenda"
            action="Abrir tablero"
          />
          <div className="list">
            {tasks.map((task) => (
              <div key={task.title} className="list-row">
                <div>
                  <p className="list-title">{task.title}</p>
                  <p className="muted">{task.owner}</p>
                </div>
                <div className="list-meta">
                  <span>{task.due}</span>
                  <Tag tone="warning">Urgente</Tag>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card list-card">
          <SectionHeader
            title="Conversaciones destacadas"
            subtitle="Resumen listo para el equipo"
            action="Ver bandeja"
          />
          <div className="list">
            {conversations.map((conv) => (
              <div key={conv.patient} className="list-row">
                <div>
                  <p className="list-title">{conv.patient}</p>
                  <p className="muted">{conv.reason}</p>
                </div>
                <div className="list-meta">
                  <Tag tone={conv.status === "Resuelto" ? "success" : "warning"}>
                    {conv.status}
                  </Tag>
                  <span className="muted">{conv.channel}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="card">
        <SectionHeader
          title="Agenda de hoy"
          subtitle="Confirmaciones y huecos disponibles"
          action="Ver agenda"
        />
        <div className="appointments">
          {appointments.map((appt) => (
            <div key={appt.patient} className="appointment-card">
              <div>
                <p className="list-title">{appt.patient}</p>
                <p className="muted">{appt.type}</p>
              </div>
              <div className="appointment-meta">
                <span>{appt.time}</span>
                <Tag tone={appt.status === "Confirmada" ? "success" : "info"}>
                  {appt.status}
                </Tag>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
