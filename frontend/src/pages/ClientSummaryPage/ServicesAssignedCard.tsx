import type { NavigateFunction } from "react-router-dom";
import { DataTable } from "../../components/DataTable";
import { StatusBadgeIcon } from "../../components/StatusBadgeIcon";
import type { TenantServiceOverview, SubscriptionSummary } from "../../types";
import type { TranslateFn } from "./types";

const buildStatusLabel = (
  t: TranslateFn,
  status: string,
  activateAt?: string | null,
  deactivateAt?: string | null,
) => {
  const activateLabel = activateAt
    ? ` · ${new Date(activateAt).toLocaleDateString()}`
    : "";
  const deactivateLabel = deactivateAt
    ? ` · ${new Date(deactivateAt).toLocaleDateString()}`
    : "";
  if (status === "pending") {
    return `${t("pendiente")}${activateLabel}`;
  }
  if (status === "pending_removal") {
    return `${t("baja pendiente")}${deactivateLabel}`;
  }
  return status;
};

type ServicesAssignedCardProps = {
  contractedServices: TenantServiceOverview[];
  subscription: SubscriptionSummary["subscription"] | null;
  canManageServices: boolean;
  canManageSubscription: boolean;
  canDeleteServiceAssignment: boolean;
  serviceRemoveBusy: boolean;
  tenantId?: string;
  navigate: NavigateFunction;
  formatEur: (value: number) => string;
  onUnassignService: (service: TenantServiceOverview) => void;
  onDeleteServiceAssignment: (service: TenantServiceOverview) => void;
  t: TranslateFn;
};

export function ServicesAssignedCard({
  contractedServices,
  subscription,
  canManageServices,
  canManageSubscription,
  canDeleteServiceAssignment,
  serviceRemoveBusy,
  tenantId,
  navigate,
  formatEur,
  onUnassignService,
  onDeleteServiceAssignment,
  t,
}: ServicesAssignedCardProps) {
  return (
    <div className="card full-width">
      <div className="card-header">
        <div>
          <h2>{t("Servicios asignados")}</h2>
          <p className="muted">
            {t(
              "Configura parámetros y, si aplica, endpoints de cada servicio. Para gestionar un servicio, pulse en \"Gestionar\" para abrir la página detalles del servicio.",
            )}
          </p>
        </div>
      </div>
      {contractedServices.length === 0 ? (
        <div className="muted">{t("Sin servicios asignados.")}</div>
      ) : (
        <DataTable
          columns={[
            { key: "name", label: t("Servicio"), sortable: true },
            {
              key: "price",
              label: t("Precio"),
              sortable: true,
              render: (service: TenantServiceOverview) =>
                formatEur(
                  subscription?.period === "annual"
                    ? service.priceAnnualEur
                    : service.priceMonthlyEur,
                ),
            },
            {
              key: "subscriptionStatus",
              label: t("Estado"),
              sortable: true,
              render: (service: TenantServiceOverview) => {
                const status = service.subscriptionStatus || "disabled";
                const label = buildStatusLabel(
                  t,
                  status,
                  service.activateAt,
                  service.deactivateAt,
                );
                return (
                  <StatusBadgeIcon
                    status={status === "active" ? "active" : "disabled"}
                    title={label}
                  />
                );
              },
            },
            {
              key: "configScope",
              label: t("LLM"),
              render: (service: TenantServiceOverview) => {
                const hasOverride = Boolean(
                  service.providerId || service.pricingId || service.policyId,
                );
                return (
                  <span className={`pill ${hasOverride ? "pill-alt" : ""}`}>
                    {hasOverride ? t("Override") : t("Global")}
                  </span>
                );
              },
            },
            {
              key: "configStatus",
              label: t("Operativo"),
              sortable: true,
              render: (service: TenantServiceOverview) => (
                <span
                  className={`status ${
                    service.configStatus === "suspended" ? "critical" : "active"
                  }`}
                >
                  {service.configStatus === "suspended"
                    ? t("suspendido")
                    : t("activo")}
                </span>
              ),
            },
            {
              key: "userCount",
              label: t("Usuarios"),
              sortable: true,
              render: (service: TenantServiceOverview) =>
                t("{count} usuarios", { count: service.userCount }),
            },
            {
              key: "endpointCount",
              label: t("Endpoints"),
              sortable: true,
              render: (service: TenantServiceOverview) =>
                service.endpointsEnabled !== false
                  ? t("{count} endpoints", { count: service.endpointCount })
                  : t("No aplica"),
            },
            {
              key: "serviceActions",
              label: t("Acción rápida"),
              render: (service: TenantServiceOverview) => {
                const actions: {
                  key: string;
                  label: string;
                  onClick: () => void;
                }[] = [];
                if (service.endpointsEnabled !== false) {
                  actions.push({
                    key: "observability",
                    label: t("Ver observability"),
                    onClick: () =>
                      navigate(`/clients/${tenantId}/observability`),
                  });
                }
                if (service.humanHandoffEnabled) {
                  actions.push({
                    key: "support",
                    label: t("Ver soporte"),
                    onClick: () => navigate(`/clients/${tenantId}/support`),
                  });
                }
                if (service.serviceCode === "sistema-encuestas") {
                  actions.push({
                    key: "surveys",
                    label: t("Abrir gestor de encuestas"),
                    onClick: () => navigate(`/clients/${tenantId}/surveys`),
                  });
                }
                if (service.serviceCode === "simulador-financiero") {
                  actions.push({
                    key: "financial",
                    label: t("Abrir simulador financiero"),
                    onClick: () =>
                      navigate(`/clients/${tenantId}/financial-simulations`),
                  });
                }
                if (service.serviceCode === "autoevalucion") {
                  actions.push({
                    key: "self-assessment",
                    label: t("Abrir autoevaluaciones"),
                    onClick: () =>
                      navigate(`/clients/${tenantId}/self-assessments`),
                  });
                }
                if (actions.length === 0) {
                  return <span className="muted">{t("No aplica")}</span>;
                }
                return (
                  <div className="row-actions">
                    {actions.map((action) => (
                      <button
                        key={action.key}
                        className="link"
                        type="button"
                        onClick={action.onClick}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                );
              },
            },
            {
              key: "actions",
              label: t("Acciones"),
              render: (service: TenantServiceOverview) => (
                <div className="row-actions">
                  {canManageServices && (
                    <button
                      className="link"
                      type="button"
                      onClick={() =>
                        navigate(`/clients/${tenantId}/services/${service.serviceCode}`)
                      }
                    >
                      {t("Gestionar")}
                    </button>
                  )}
                  {canManageSubscription && (
                    <button
                      className="link"
                      type="button"
                      onClick={() => onUnassignService(service)}
                      disabled={serviceRemoveBusy}
                    >
                      {t("Desasignar")}
                    </button>
                  )}
                  {canDeleteServiceAssignment && (
                    <button
                      className="link danger"
                      type="button"
                      onClick={() => onDeleteServiceAssignment(service)}
                      disabled={serviceRemoveBusy}
                    >
                      {t("Eliminar")}
                    </button>
                  )}
                </div>
              ),
            },
          ]}
          data={contractedServices}
          getRowId={(service) => service.serviceCode}
          pageSize={6}
          filterKeys={["name", "serviceCode", "subscriptionStatus"]}
        />
      )}
    </div>
  );
}
