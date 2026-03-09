import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useServices } from "../app/ServicesProvider";
import type { Claim } from "@/domain/models/claim";
import { StatusPill } from "../components/StatusPill";
import { StatCard } from "../components/StatCard";

export function ClaimsInboxPage() {
  const { claimsService } = useServices();
  const [claims, setClaims] = useState<Claim[]>([]);

  useEffect(() => {
    claimsService.listClaims().then(setClaims).catch(() => setClaims([]));
  }, [claimsService]);

  const stats = useMemo(() => {
    const total = claims.length;
    const completos = claims.filter((claim) => claim.completenessStatus === "completo").length;
    const pendientes = claims.filter((claim) => claim.status === "pendiente_documentos").length;
    return { total, completos, pendientes };
  }, [claims]);

  return (
    <div className="page">
      <div className="row g-4">
        <div className="col-12 col-lg-4">
          <StatCard title="Expedientes activos" value={`${stats.total}`} delta="+12% semanal" />
        </div>
        <div className="col-12 col-lg-4">
          <StatCard title="Completos" value={`${stats.completos}`} delta="meta 80%" />
        </div>
        <div className="col-12 col-lg-4">
          <StatCard title="Pendientes docs" value={`${stats.pendientes}`} delta="alerta" />
        </div>
      </div>

      <div className="row g-4 mt-1">
        <div className="col-12">
          <div className="panel">
            <div className="panel-header">
              <div>
                <h3>Inbox de siniestros</h3>
                <p>Expedientes listos para tramitacion y pendientes de datos.</p>
              </div>
              <div className="panel-actions">
                <button className="btn btn-outline-light" type="button">
                  Exportar
                </button>
                <button className="btn btn-secondary" type="button">
                  Filtrar
                </button>
              </div>
            </div>
            <div className="table-responsive">
              <table className="table table-borderless align-middle">
                <thead>
                  <tr>
                    <th>Expediente</th>
                    <th>Tipo</th>
                    <th>Estado</th>
                    <th>Completitud</th>
                    <th>Poliza</th>
                    <th>Fecha dano</th>
                    <th>Urgencia</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {claims.map((claim) => (
                    <tr key={claim.id}>
                      <td>
                        <Link to={`/claims/${claim.id}`} className="claim-link">
                          {claim.claimNumber}
                        </Link>
                        <p className="text-muted">{claim.description}</p>
                      </td>
                      <td>{claim.type}</td>
                      <td>
                        <StatusPill status={claim.status} />
                      </td>
                      <td>
                        <StatusPill status={claim.completenessStatus} />
                      </td>
                      <td>{claim.policyNumber ?? "-"}</td>
                      <td>{claim.lossDate ?? "-"}</td>
                      <td>{claim.urgency ? "Alta" : "Normal"}</td>
                      <td>
                        <Link to={`/claims/${claim.id}`} className="btn btn-sm btn-primary">
                          Abrir
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
