import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { Claim, ClaimDocument, ClaimDocumentRequest } from "@/domain/models/claim";
import { useServices } from "../app/ServicesProvider";
import { DocumentList } from "../components/DocumentList";
import { StatusPill } from "../components/StatusPill";

export function UserClaimDetailPage() {
  const { id } = useParams();
  const { claimsService } = useServices();
  const [claim, setClaim] = useState<Claim | null>(null);
  const [documents, setDocuments] = useState<ClaimDocument[]>([]);
  const [requests, setRequests] = useState<ClaimDocumentRequest[]>([]);
  const [explanation, setExplanation] = useState<string>("");
  const [explanationLoading, setExplanationLoading] = useState(false);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!id) return;
    claimsService.getMyClaim(id).then(setClaim).catch(() => setClaim(null));
    claimsService.listDocuments(id).then(setDocuments).catch(() => setDocuments([]));
  }, [claimsService, id]);

  useEffect(() => {
    if (!id) return;
    claimsService.listMyDocumentRequests(id).then(setRequests).catch(() => setRequests([]));
  }, [claimsService, id]);

  useEffect(() => {
    if (!id) return;
    setExplanationLoading(true);
    claimsService
      .getUserExplanation(id)
      .then((result) => setExplanation(result.explanation))
      .finally(() => setExplanationLoading(false));
  }, [claimsService, id]);

  if (!claim) {
    return (
      <div className="page">
        <div className="panel">
          <h3>Expediente no encontrado</h3>
          <p>Revisa el identificador o vuelve al portal.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
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
            <p>Archivos cargados y evidencias.</p>
          </div>
        </div>
        <DocumentList documents={documents} />
      </div>

      <div className="panel mt-4">
        <div className="panel-header">
          <div>
            <h3>Solicitudes de documentos</h3>
            <p>Documentos pedidos por tu gestor.</p>
          </div>
        </div>
        {requests.length === 0 ? (
          <p className="text-muted">No hay solicitudes para este expediente.</p>
        ) : (
          <div className="request-list">
            {requests.map((request) => (
              <div key={request.id} className="request-item">
                <div>
                  <p className="request-title">{request.kind}</p>
                  <p className="text-muted">{request.message}</p>
                  <small className="text-muted">
                    {new Date(request.createdAt).toLocaleString("es-ES")}
                  </small>
                </div>
                <div className="request-actions">
                  <label className="btn btn-outline-primary btn-sm">
                    {uploading[request.id] ? "Subiendo..." : "Adjuntar"}
                    <input
                      type="file"
                      hidden
                      onChange={async (event) => {
                        const file = event.target.files?.[0];
                        if (!file || !claim) {
                          return;
                        }
                        setUploading((prev) => ({ ...prev, [request.id]: true }));
                        try {
                          const reader = new FileReader();
                          const base64 = await new Promise<string>((resolve, reject) => {
                            reader.onload = () => resolve(reader.result as string);
                            reader.onerror = () => reject(new Error("Error leyendo archivo"));
                            reader.readAsDataURL(file);
                          });
                          await claimsService.uploadDocument(claim.id, {
                            kind: request.kind,
                            filename: file.name,
                            mimeType: file.type || "application/octet-stream",
                            base64,
                          });
                          const updated = await claimsService.listMyDocumentRequests(claim.id);
                          setRequests(updated);
                        } finally {
                          setUploading((prev) => ({ ...prev, [request.id]: false }));
                          event.target.value = "";
                        }
                      }}
                    />
                  </label>
                  <span className={`request-pill request-pill--${request.status}`}>
                    {request.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="panel mt-4">
        <div className="panel-header">
          <div>
            <h3>Explicacion IA</h3>
            <p>Resumen claro del estado y siguientes pasos.</p>
          </div>
        </div>
        {explanationLoading ? (
          <p className="text-muted">Generando explicacion...</p>
        ) : (
          <div className="ai-summary">
            {explanation.split("\n").map((line, index) => (
              <p key={`${line}-${index}`}>{line}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
