import { SectionHeader } from "../components/SectionHeader";
import { Tag } from "../components/Tag";
import { appointments } from "../../../core/domain/mockData";

export const AgendaPage = () => {
  return (
    <div className="page">
      <SectionHeader
        title="Agenda inteligente"
        subtitle="Reservas, cambios y lista de espera automática"
        action="Añadir bloqueo"
      />

      <section className="grid two-columns">
        <div className="card">
          <h3>Confirmaciones próximas</h3>
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
        </div>

        <div className="card">
          <h3>No-show killer</h3>
          <div className="timeline">
            <div className="timeline-step done">
              <span>48h</span>
              <div>
                <p>Recordatorio automatizado</p>
                <p className="muted">Email + WhatsApp</p>
              </div>
            </div>
            <div className="timeline-step active">
              <span>24h</span>
              <div>
                <p>Confirmación con 1 clic</p>
                <p className="muted">Escala a recepción si no responde</p>
              </div>
            </div>
            <div className="timeline-step">
              <span>2h</span>
              <div>
                <p>Reintento automático</p>
                <p className="muted">Activa lista de espera</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
