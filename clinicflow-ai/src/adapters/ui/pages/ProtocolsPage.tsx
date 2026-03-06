import { useEffect, useMemo, useState } from "react";
import { SectionHeader } from "../components/SectionHeader";
import { Tag } from "../components/Tag";
import { clinicflowApi, staffApi } from "../../../infrastructure/api/clinicflowApi";

interface ProtocolItem {
  id: string;
  title?: string | null;
  version?: string | null;
  status?: string | null;
  summary?: string | null;
  approvedBy?: string | null;
}

interface FaqItem {
  id: string;
  question?: string | null;
  category?: string | null;
  active?: boolean | null;
}

export const ProtocolsPage = () => {
  const [protocols, setProtocols] = useState<ProtocolItem[]>([]);
  const [faqEntries, setFaqEntries] = useState<FaqItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [promptContent, setPromptContent] = useState("");
  const [promptUpdatedAt, setPromptUpdatedAt] = useState<string | null>(null);
  const [promptSaving, setPromptSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setError(null);
      try {
        const [protocolList, faqList, prompt] = await Promise.all([
          clinicflowApi.listProtocols(),
          clinicflowApi.listFaq(),
          staffApi.getPrompt("faq_chat"),
        ]);
        if (!mounted) return;
        setProtocols((protocolList as ProtocolItem[]) || []);
        setFaqEntries((faqList as FaqItem[]) || []);
        setPromptContent(prompt?.content || "");
        setPromptUpdatedAt(prompt?.updatedAt || null);
      } catch (err: any) {
        if (!mounted) return;
        setError(err.message || "No se pudieron cargar los protocolos.");
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const protocolRows = useMemo(() => {
    return protocols.map((protocol) => ({
      id: protocol.id,
      title: protocol.title || "Protocolo",
      meta: protocol.version ? `Versión ${protocol.version}` : "Sin versión",
      status: protocol.status || "Pendiente",
      owner: protocol.approvedBy || "Equipo clínico",
    }));
  }, [protocols]);

  const handleSavePrompt = async () => {
    setPromptSaving(true);
    try {
      const updated = await staffApi.updatePrompt("faq_chat", promptContent);
      setPromptUpdatedAt(updated?.updatedAt || new Date().toISOString());
    } catch (err: any) {
      setError(err?.message || "No se pudo guardar el prompt.");
    } finally {
      setPromptSaving(false);
    }
  };

  const formatUpdatedAt = () => {
    if (!promptUpdatedAt) return "Sin guardar todavía";
    const date = new Date(promptUpdatedAt);
    if (Number.isNaN(date.getTime())) return promptUpdatedAt;
    return date.toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const faqRows = useMemo(() => {
    return faqEntries.map((entry) => ({
      id: entry.id,
      title: entry.question || "FAQ",
      category: entry.category || "General",
      status: entry.active === false ? "Inactivo" : "Activo",
    }));
  }, [faqEntries]);

  return (
    <div className="page">
      <SectionHeader
        title="Protocolos y FAQ"
        subtitle="Base de conocimiento y respuestas consistentes"
        action="Subir protocolo"
      />

      {error ? <div className="card error-banner">{error}</div> : null}

      <section className="grid two-columns">
        <div className="card list-card">
          <h3>Protocolos activos</h3>
          <div className="list">
            {protocolRows.length === 0 ? (
              <div className="list-row">
                <div>
                  <p className="list-title">Sin protocolos todavía</p>
                  <p className="muted">Sube un documento para empezar.</p>
                </div>
              </div>
            ) : (
              protocolRows.map((protocol) => (
                <div key={protocol.id} className="list-row">
                  <div>
                    <p className="list-title">{protocol.title}</p>
                    <p className="muted">{protocol.meta}</p>
                  </div>
                  <div className="list-meta">
                    <Tag tone={protocol.status.toLowerCase().includes("aprob") ? "success" : "info"}>
                      {protocol.status}
                    </Tag>
                    <span className="muted">{protocol.owner}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card list-card">
          <h3>FAQ publicadas</h3>
          <div className="list">
            {faqRows.length === 0 ? (
              <div className="list-row">
                <div>
                  <p className="list-title">Sin FAQ todavía</p>
                  <p className="muted">Crea entradas para dudas frecuentes.</p>
                </div>
              </div>
            ) : (
              faqRows.map((entry) => (
                <div key={entry.id} className="list-row">
                  <div>
                    <p className="list-title">{entry.title}</p>
                    <p className="muted">{entry.category}</p>
                  </div>
                  <div className="list-meta">
                    <Tag tone={entry.status === "Activo" ? "success" : "warning"}>
                      {entry.status}
                    </Tag>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="card">
        <h3>Checklist de cumplimiento</h3>
        <ul className="checklist">
          <li className="done">Disclaimer médico incluido</li>
          <li className="done">Protocolos versionados</li>
          <li>Revisión médica pendiente</li>
          <li>Política de retención definida</li>
        </ul>
      </section>

      <section className="card">
        <h3>Prompt del chat FAQ</h3>
        <p className="muted">
          Ajusta el tono y las reglas del asistente. No incluyas datos
          personales ni diagnósticos definitivos.
        </p>
        <div className="form-field">
          <label>Prompt activo</label>
          <textarea
            rows={8}
            value={promptContent}
            onChange={(event) => setPromptContent(event.target.value)}
          />
        </div>
        <div className="summary-actions">
          <button
            className="btn btn-primary btn-normal"
            onClick={handleSavePrompt}
            disabled={promptSaving}
          >
            {promptSaving ? "Guardando..." : "Guardar cambios"}
          </button>
          <span className="muted">Última actualización: {formatUpdatedAt()}</span>
        </div>
      </section>
    </div>
  );
};
