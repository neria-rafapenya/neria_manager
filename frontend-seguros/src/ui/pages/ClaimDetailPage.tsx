import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { Claim, ClaimDocument } from "@/domain/models/claim";
import { useServices } from "../app/ServicesProvider";
import { StatusPill } from "../components/StatusPill";
import { DocumentList } from "../components/DocumentList";

export function ClaimDetailPage() {
  const { id } = useParams();
  const { claimsService } = useServices();
  const [claim, setClaim] = useState<Claim | null>(null);
  const [documents, setDocuments] = useState<ClaimDocument[]>([]);

  useEffect(() => {
    if (!id) return;
    claimsService.getClaim(id).then(setClaim).catch(() => setClaim(null));
    claimsService.listDocuments(id).then(setDocuments).catch(() => setDocuments([]));
  }, [claimsService, id]);

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
              <button className="btn btn-secondary" type="button">
                Solicitar documento
              </button>
            </div>
            <DocumentList documents={documents} />
          </div>
        </div>

        <div className="col-12 col-xl-4">
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
          <div className="panel mt-4">
            <h3>Alertas</h3>
            <div className="alert-card">
              <p>Falta atestado de trafico.</p>
              <button className="btn btn-outline-light" type="button">
                Lanzar request
              </button>
            </div>
            <div className="alert-card">
              <p>Factura ilegible, requiere nueva carga.</p>
              <button className="btn btn-outline-light" type="button">
                Notificar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
