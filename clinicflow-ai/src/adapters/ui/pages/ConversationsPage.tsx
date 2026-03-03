import { SectionHeader } from "../components/SectionHeader";
import { Tag } from "../components/Tag";
import { conversations } from "../../../core/domain/mockData";

export const ConversationsPage = () => {
  return (
    <div className="page">
      <SectionHeader
        title="Bandeja omnicanal"
        subtitle="Web, WhatsApp y derivaciones con resumen clínico"
        action="Asignar agente"
      />

      <section className="grid two-columns">
        <div className="card list-card">
          <h3>Cola prioritaria</h3>
          <div className="list">
            {conversations.map((conv) => (
              <div key={conv.patient} className="list-row">
                <div>
                  <p className="list-title">{conv.patient}</p>
                  <p className="muted">{conv.reason}</p>
                </div>
                <div className="list-meta">
                  <Tag tone={conv.status === "Escalada" ? "warning" : "success"}>
                    {conv.status}
                  </Tag>
                  <span className="muted">{conv.channel}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card conversation-preview">
          <h3>Resumen automático</h3>
          <div className="summary-box">
            <p className="eyebrow">Resumen clínico</p>
            <p>
              Motivo: dolor agudo en muela inferior derecha. Preguntas realizadas:
              escala de dolor, fiebre, medicación previa. Recomendación: cita de
              urgencias hoy.
            </p>
          </div>
          <div className="summary-actions">
            <button className="btn btn-primary">Escalar a doctora</button>
            <button className="btn btn-ghost">Enviar mensaje</button>
          </div>
        </div>
      </section>
    </div>
  );
};
