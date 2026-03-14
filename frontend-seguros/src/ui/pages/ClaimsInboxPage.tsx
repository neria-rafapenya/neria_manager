import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useServices } from "../app/ServicesProvider";
import type { Claim } from "@/domain/models/claim";
import type { AuthUser } from "@/domain/models/auth";
import { StatusPill } from "../components/StatusPill";
import { StatCard } from "../components/StatCard";
import { useAuth } from "../app/AuthProvider";
import Swal from "sweetalert2";

export function ClaimsInboxPage() {
  const { claimsService, authService } = useServices();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [claims, setClaims] = useState<Claim[]>([]);
  const [agents, setAgents] = useState<AuthUser[]>([]);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [selection, setSelection] = useState<Record<string, string>>({});
  const [filterAgent, setFilterAgent] = useState("");
  const [filteredClaims, setFilteredClaims] = useState<Claim[]>([]);
  const [summaryBusy, setSummaryBusy] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    claimsService.listClaims().then(setClaims).catch(() => setClaims([]));
  }, [claimsService]);

  useEffect(() => {
    if (!isAdmin) {
      return;
    }
    authService.listAgents().then(setAgents).catch(() => setAgents([]));
  }, [authService, isAdmin]);

  useEffect(() => {
    if (!user) {
      return;
    }
    const assignedParam = searchParams.get("assigned") ?? "";
    if (assignedParam) {
      setFilterAgent(assignedParam);
      return;
    }
    if (user.role === "agente") {
      setFilterAgent(user.id);
      return;
    }
    setFilterAgent("");
  }, [searchParams, user]);

  useEffect(() => {
    if (!filterAgent) {
      searchParams.delete("assigned");
      setSearchParams(searchParams, { replace: true });
      return;
    }
    searchParams.set("assigned", filterAgent);
    setSearchParams(searchParams, { replace: true });
  }, [filterAgent, searchParams, setSearchParams]);

  useEffect(() => {
    setSelection((prev) => {
      const next = { ...prev };
      claims.forEach((claim) => {
        if (!next[claim.id]) {
          next[claim.id] = claim.assignedAgentId ?? "";
        }
      });
      return next;
    });
  }, [claims]);

  useEffect(() => {
    if (!isAdmin || !filterAgent) {
      setFilteredClaims(claims);
      return;
    }
    if (filterAgent === "unassigned") {
      setFilteredClaims(claims.filter((claim) => !claim.assignedAgentId));
      return;
    }
    setFilteredClaims(claims.filter((claim) => claim.assignedAgentId === filterAgent));
  }, [claims, filterAgent, isAdmin]);

  const stats = useMemo(() => {
    const total = filteredClaims.length;
    const completos = filteredClaims.filter((claim) => claim.completenessStatus === "completo").length;
    const pendientes = filteredClaims.filter((claim) => claim.status === "pendiente_documentos").length;
    return { total, completos, pendientes };
  }, [filteredClaims]);

  const agentById = useMemo(() => {
    return agents.reduce<Record<string, AuthUser>>((acc, agent) => {
      acc[agent.id] = agent;
      return acc;
    }, {});
  }, [agents]);

  const handleAssign = async (claim: Claim) => {
    const agentId = selection[claim.id];
    if (!agentId) {
      return;
    }
    const isReassign = Boolean(claim.assignedAgentId);
    const agentLabel = agentById[agentId]?.email ?? "Agente";
    const currentAgent = claim.assignedAgentId
      ? agentById[claim.assignedAgentId]?.email ?? "Agente"
      : "Sin asignar";

    const result = await Swal.fire({
      title: isReassign ? "Confirmar reasignacion" : "Confirmar asignacion",
      text: isReassign
        ? `Expediente ${claim.claimNumber} pasara de ${currentAgent} a ${agentLabel}.`
        : `Asignar expediente ${claim.claimNumber} a ${agentLabel}.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: isReassign ? "Reasignar" : "Asignar",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) {
      return;
    }

    setAssigningId(claim.id);
    try {
      const updated = await claimsService.assignClaim(claim.id, agentId);
      setClaims((prev) => prev.map((item) => (item.id === claim.id ? updated : item)));
    } finally {
      setAssigningId(null);
    }
  };

  const handleSummary = async (claim: Claim) => {
    setSummaryBusy(claim.id);
    const loading = Swal.fire({
      title: "Generando resumen IA...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
    try {
      const result = await claimsService.getSummary(claim.id);
      await Swal.fire({
        title: `Resumen IA · ${claim.claimNumber}`,
        html: `<div class="ai-preview">${result.summary.replace(/\n/g, "<br/>")}</div>`,
        confirmButtonText: "Cerrar",
      });
    } finally {
      setSummaryBusy(null);
      await loading;
    }
  };

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
                {isAdmin ? (
                  <select
                    className="form-select form-select-sm"
                    value={filterAgent}
                    onChange={(event) => setFilterAgent(event.target.value)}
                  >
                    <option value="">Todos los agentes</option>
                    <option value="unassigned">Sin asignar</option>
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.email}
                      </option>
                    ))}
                  </select>
                ) : null}
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
                    {isAdmin ? <th>Asignado</th> : null}
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClaims.map((claim) => (
                    <tr key={claim.id}>
                      <td>
                        <Link to={`/claims/${claim.id}`} className="claim-link">
                          {claim.claimNumber}
                        </Link>
                        <p className="text-muted">{claim.description}</p>
                        {claim.pendingDocumentRequests && claim.pendingDocumentRequests > 0 ? (
                          <span className="request-badge request-badge--inline">
                            {claim.pendingDocumentRequests} solicitud(es)
                          </span>
                        ) : null}
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
                      {isAdmin ? (
                        <td>
                          <div className="assign-cell">
                            <select
                              className="form-select form-select-sm"
                              value={selection[claim.id] ?? ""}
                              onChange={(event) =>
                                setSelection((prev) => ({ ...prev, [claim.id]: event.target.value }))
                              }
                            >
                              <option value="">Sin asignar</option>
                              {agents.map((agent) => (
                                <option key={agent.id} value={agent.id}>
                                  {agent.email}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => handleAssign(claim)}
                              disabled={
                                assigningId === claim.id ||
                                !selection[claim.id] ||
                                selection[claim.id] === claim.assignedAgentId
                              }
                            >
                              {assigningId === claim.id
                                ? "Asignando..."
                                : claim.assignedAgentId
                                  ? "Reasignar"
                                  : "Asignar"}
                            </button>
                            {claim.assignedAgentId ? (
                              <span className="assign-meta">
                                Actual: {agentById[claim.assignedAgentId]?.email ?? "Agente"}
                              </span>
                            ) : null}
                          </div>
                        </td>
                      ) : null}
                      <td>
                        <div className="d-flex gap-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleSummary(claim)}
                            disabled={summaryBusy === claim.id}
                          >
                            {summaryBusy === claim.id ? "IA..." : "Resumen IA"}
                          </button>
                          <Link to={`/claims/${claim.id}`} className="btn btn-sm btn-primary">
                            Abrir
                          </Link>
                        </div>
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
