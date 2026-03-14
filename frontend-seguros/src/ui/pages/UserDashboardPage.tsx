import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../app/AuthProvider";
import { useServices } from "../app/ServicesProvider";
import { Link } from "react-router-dom";
import type { Claim, ClaimDocumentRequest } from "@/domain/models/claim";

export function UserDashboardPage() {
  const { user } = useAuth();
  const { claimsService } = useServices();
  const [requests, setRequests] = useState<ClaimDocumentRequest[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    claimsService.listDocumentRequests().then(setRequests).catch(() => setRequests([]));
  }, [claimsService]);

  useEffect(() => {
    claimsService.listMyClaims().then(setClaims).catch(() => setClaims([]));
  }, [claimsService]);

  const kindLabel = useMemo(() => {
    return (kind: string) => {
      const map: Record<string, string> = {
        parte_amistoso: "Parte amistoso",
        atestados: "Atestado",
        factura: "Factura",
        presupuesto: "Presupuesto",
        informe_medico: "Informe medico",
        foto: "Foto",
        poliza: "Poliza",
        dni: "DNI",
        otro: "Otro",
      };
      return map[kind] ?? kind;
    };
  }, []);

  return (
    <div className="user-dashboard">
      <div className="user-dashboard__header">
        <div>
          <p className="user-dashboard__eyebrow">Portal asegurado</p>
          <h1>Hola {user?.email}</h1>
          <p className="text-muted">
            Gestiona tus siniestros y mantente al dia del estado de tu expediente.
          </p>
        </div>
        <Link className="btn btn-primary" to="/claims/new">
          Abrir siniestro
        </Link>
      </div>

      <div className="user-dashboard__card">
        <h3>Estado del expediente</h3>
        <p className="text-muted">
          Cuando tengas un siniestro abierto, veras aqui su estado, documentos pendientes y
          proximos pasos.
        </p>
        {claims.length > 0 ? (
          <div className="user-claims">
            {claims.map((claim) => (
              <div key={claim.id} className="user-claim">
                <div>
                  <Link to={`/portal/claims/${claim.id}`} className="user-claim__title">
                    {claim.claimNumber}
                  </Link>
                  <p className="text-muted">{claim.description ?? "Sin descripcion."}</p>
                </div>
                <div className="user-claim__meta">
                  <span className="request-pill request-pill--inline">{claim.status}</span>
                  {claim.pendingDocumentRequests && claim.pendingDocumentRequests > 0 ? (
                    <span className="request-badge request-badge--inline">
                      {claim.pendingDocumentRequests} pendiente
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="user-dashboard__card">
        <div className="request-header">
          <h3>Solicitudes de documentos</h3>
          <span className="request-badge">{requests.length}</span>
        </div>
        {requests.length === 0 ? (
          <p className="text-muted">No hay solicitudes pendientes.</p>
        ) : (
          <div className="request-list">
            {requests.map((request) => (
              <div key={request.id} className="request-item">
                <div>
                  <p className="request-title">
                    {kindLabel(request.kind)} {request.claimNumber ? `· ${request.claimNumber}` : ""}
                  </p>
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
                        if (!file) {
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
                          await claimsService.uploadDocument(request.claimId, {
                            kind: request.kind,
                            filename: file.name,
                            mimeType: file.type || "application/octet-stream",
                            base64,
                          });
                          const updated = await claimsService.listDocumentRequests();
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
    </div>
  );
}
