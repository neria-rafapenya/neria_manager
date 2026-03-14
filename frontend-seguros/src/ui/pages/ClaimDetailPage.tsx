import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { Claim, ClaimDocument } from "@/domain/models/claim";
import type { AuthUser } from "@/domain/models/auth";
import { useServices } from "../app/ServicesProvider";
import { StatusPill } from "../components/StatusPill";
import { DocumentList } from "../components/DocumentList";
import { useAuth } from "../app/AuthProvider";
import Swal from "sweetalert2";

export function ClaimDetailPage() {
  const { id } = useParams();
  const { claimsService, authService } = useServices();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const isStaff = user?.role === "admin" || user?.role === "agente";
  const [claim, setClaim] = useState<Claim | null>(null);
  const [documents, setDocuments] = useState<ClaimDocument[]>([]);
  const [agents, setAgents] = useState<AuthUser[]>([]);
  const [assigning, setAssigning] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState("");
  const [alertBusy, setAlertBusy] = useState<Record<string, boolean>>({});
  const [summary, setSummary] = useState<string>("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    claimsService.getClaim(id).then(setClaim).catch(() => setClaim(null));
    claimsService.listDocuments(id).then(setDocuments).catch(() => setDocuments([]));
  }, [claimsService, id]);

  useEffect(() => {
    if (!id || !isStaff) return;
    setSummaryLoading(true);
    claimsService
      .getSummary(id)
      .then((result) => {
        setSummary(result.summary);
        setSummaryError(null);
      })
      .catch(() => setSummaryError("No se pudo generar el resumen IA."))
      .finally(() => setSummaryLoading(false));
  }, [claimsService, id, isStaff]);

  useEffect(() => {
    if (!isAdmin) return;
    authService.listAgents().then(setAgents).catch(() => setAgents([]));
  }, [authService, isAdmin]);

  useEffect(() => {
    if (claim) {
      setSelectedAgent(claim.assignedAgentId ?? "");
    }
  }, [claim]);

  const handleAssign = async () => {
    if (!id || !selectedAgent) {
      return;
    }
    const isReassign = Boolean(claim?.assignedAgentId);
    const agentLabel = agents.find((agent) => agent.id === selectedAgent)?.email ?? "Agente";
    const currentAgent = claim?.assignedAgentId
      ? agents.find((agent) => agent.id === claim.assignedAgentId)?.email ?? "Agente"
      : "Sin asignar";

    const result = await Swal.fire({
      title: isReassign ? "Confirmar reasignacion" : "Confirmar asignacion",
      text: isReassign
        ? `Expediente ${claim?.claimNumber} pasara de ${currentAgent} a ${agentLabel}.`
        : `Asignar expediente ${claim?.claimNumber} a ${agentLabel}.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: isReassign ? "Reasignar" : "Asignar",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) {
      return;
    }

    setAssigning(true);
    try {
      const updated = await claimsService.assignClaim(id, selectedAgent);
      setClaim(updated);
    } finally {
      setAssigning(false);
    }
  };

  const handleRequestDocument = async () => {
    if (!id || !claim) {
      return;
    }

    const kindOptions = [
      { value: "parte_amistoso", label: "Parte amistoso" },
      { value: "atestados", label: "Atestado" },
      { value: "factura", label: "Factura" },
      { value: "presupuesto", label: "Presupuesto" },
      { value: "informe_medico", label: "Informe medico" },
      { value: "foto", label: "Foto" },
      { value: "poliza", label: "Poliza" },
      { value: "dni", label: "DNI" },
      { value: "otro", label: "Otro" },
    ];

    const { value: form } = await Swal.fire({
      title: "Solicitar documento",
      html: `
        <div class="swal-form">
          <label>Tipo de documento</label>
          <select id="doc-kind" class="swal2-select">
            ${kindOptions
              .map((option) => `<option value="${option.value}">${option.label}</option>`)
              .join("")}
          </select>
          <label class="swal-label">Notas para IA (opcional)</label>
          <textarea id="doc-message" class="swal2-textarea" placeholder="Ej: foto del lateral derecho, incluir matricula."></textarea>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Enviar solicitud",
      cancelButtonText: "Cancelar",
      preConfirm: () => {
        const popup = Swal.getPopup();
        const kind = (popup?.querySelector("#doc-kind") as HTMLSelectElement | null)?.value ?? "";
        const message = (popup?.querySelector("#doc-message") as HTMLTextAreaElement | null)?.value ?? "";
        if (!kind) {
          Swal.showValidationMessage("Selecciona un tipo de documento.");
          return null;
        }
        return { kind, message: message.trim() };
      },
    });

    if (!form) {
      return;
    }

    const preview = await claimsService.previewDocumentRequest(id, form);
    const confirm = await Swal.fire({
      title: "Vista previa IA",
      html: `<div class="ai-preview">${preview.message}</div>`,
      showCancelButton: true,
      confirmButtonText: "Enviar solicitud",
      cancelButtonText: "Cancelar",
    });

    if (!confirm.isConfirmed) {
      return;
    }

    await claimsService.requestDocument(id, { ...form, aiMessage: preview.message });
    await Swal.fire({
      title: "Solicitud enviada",
      text: `Se ha solicitado ${form.kind} al cliente.`,
      icon: "success",
      timer: 1600,
      showConfirmButton: false,
    });
  };

  const handleQuickRequest = async (kind: string, message: string, key: string) => {
    if (!id || !claim) {
      return;
    }
    setAlertBusy((prev) => ({ ...prev, [key]: true }));
    try {
      const preview = await claimsService.previewDocumentRequest(id, { kind, message });
      const confirm = await Swal.fire({
        title: "Vista previa IA",
        html: `<div class="ai-preview">${preview.message}</div>`,
        showCancelButton: true,
        confirmButtonText: "Enviar solicitud",
        cancelButtonText: "Cancelar",
      });

      if (!confirm.isConfirmed) {
        return;
      }

      await claimsService.requestDocument(id, { kind, message, aiMessage: preview.message });
      await Swal.fire({
        title: "Solicitud enviada",
        text: "La solicitud se ha enviado al cliente.",
        icon: "success",
        timer: 1400,
        showConfirmButton: false,
      });
    } finally {
      setAlertBusy((prev) => ({ ...prev, [key]: false }));
    }
  };

  if (!claim) {
    return (
      <div className="page">
        <div className="panel">
          <h3>Expediente no encontrado</h3>
          <p>Revisa el identificador o vuelve al inbox.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="row g-4">
        <div className="col-12 col-xl-8">
          <div className="panel">
            <div className="panel-header">
              <div>
                <h3>{claim.claimNumber}</h3>
                <p>{claim.description}</p>
              </div>
              <div className="panel-actions">
                <StatusPill status={claim.status} />
                <StatusPill status={claim.completenessStatus} />
              </div>
            </div>
            <div className="row g-3">
              <div className="col-6 col-lg-4">
                <p>Tipo</p>
                <strong>{claim.type}</strong>
              </div>
              <div className="col-6 col-lg-4">
                <p>Poliza</p>
                <strong>{claim.policyNumber ?? "-"}</strong>
              </div>
              <div className="col-6 col-lg-4">
                <p>Fecha dano</p>
                <strong>{claim.lossDate ?? "-"}</strong>
              </div>
              <div className="col-6 col-lg-4">
                <p>Urgencia</p>
                <strong>{claim.urgency ? "Alta" : "Normal"}</strong>
              </div>
              <div className="col-6 col-lg-4">
                <p>Terceros</p>
                <strong>{claim.thirdPartyInvolved ? "Si" : "No"}</strong>
              </div>
              <div className="col-6 col-lg-4">
                <p>Reportado</p>
                <strong>{new Date(claim.reportedAt).toLocaleString("es-ES")}</strong>
              </div>
            </div>
          </div>

          <div className="panel mt-4">
            <div className="panel-header">
              <div>
                <h3>Documentacion</h3>
                <p>Evidencia con campos extraidos.</p>
              </div>
              {isStaff ? (
                <button className="btn btn-secondary" type="button" onClick={handleRequestDocument}>
                  Solicitar documento
                </button>
              ) : null}
            </div>
            <DocumentList documents={documents} />
          </div>
        </div>

        <div className="col-12 col-xl-4">
          {isAdmin ? (
            <div className="panel">
              <h3>Asignacion</h3>
              <div className="assign-card">
                <label className="form-label">Agente</label>
                <select
                  className="form-select"
                  value={selectedAgent}
                  onChange={(event) => setSelectedAgent(event.target.value)}
                >
                  <option value="">Sin asignar</option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.email}
                    </option>
                  ))}
                </select>
                <button
                  className="btn btn-outline-primary"
                  type="button"
                  onClick={handleAssign}
                  disabled={!selectedAgent || assigning || selectedAgent === claim.assignedAgentId}
                >
                  {assigning ? "Asignando..." : claim.assignedAgentId ? "Reasignar" : "Asignar agente"}
                </button>
                {claim.assignedAgentId ? (
                  <p className="assign-meta">
                    Asignado a: {agents.find((item) => item.id === claim.assignedAgentId)?.email ?? "Agente"}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}
          {isStaff ? (
            <div className="panel mt-4">
              <div className="panel-header">
                <div>
                  <h3>Resumen IA</h3>
                  <p>Vision operativa y proximos pasos sugeridos.</p>
                </div>
              </div>
              {summaryLoading ? (
                <p className="text-muted">Generando resumen...</p>
              ) : summaryError ? (
                <p className="text-muted">{summaryError}</p>
              ) : (
                <div className="ai-summary">
                  {summary.split("\n").map((line, index) => (
                    <p key={`${line}-${index}`}>{line}</p>
                  ))}
                </div>
              )}
            </div>
          ) : null}
          <div className="panel">
            <h3>Timeline</h3>
            <ul className="timeline">
              <li>
                <span>Hoy</span>
                <p>Expediente abierto y datos basicos registrados.</p>
              </li>
              <li>
                <span>+10 min</span>
                <p>Detectado documento pendiente: atestado.</p>
              </li>
              <li>
                <span>+20 min</span>
                <p>Recordatorio enviado al cliente final.</p>
              </li>
            </ul>
          </div>
          {isStaff ? (
            <div className="panel mt-4">
              <h3>Alertas</h3>
              <div className="alert-card">
                <p>Falta atestado de trafico.</p>
                <button
                  className="btn btn-outline-light"
                  type="button"
                  onClick={() =>
                    handleQuickRequest(
                      "atestados",
                      "Por favor aporta el atestado de trafico para continuar con el expediente.",
                      "atestados",
                    )
                  }
                  disabled={alertBusy.atestados}
                >
                  {alertBusy.atestados ? "Enviando..." : "Solicitar atestado"}
                </button>
              </div>
              <div className="alert-card">
                <p>Factura ilegible, requiere nueva carga.</p>
                <button
                  className="btn btn-outline-light"
                  type="button"
                  onClick={() =>
                    handleQuickRequest(
                      "factura",
                      "La factura no se lee correctamente. Sube una nueva foto o PDF en buena calidad.",
                      "factura",
                    )
                  }
                  disabled={alertBusy.factura}
                >
                  {alertBusy.factura ? "Enviando..." : "Solicitar nueva factura"}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
