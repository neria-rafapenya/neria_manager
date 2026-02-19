import { Chart } from "../../components/charts/Charts";
import type { TenantServiceOverview } from "../../types";
import type { TranslateFn } from "./types";

type ServicesOverviewCardProps = {
  contractedServices: TenantServiceOverview[];
  serviceOption: Record<string, unknown>;
  canManageSubscription: boolean;
  onAssignServices: () => void;
  t: TranslateFn;
};

export function ServicesOverviewCard({
  contractedServices,
  serviceOption,
  canManageSubscription,
  onAssignServices,
  t,
}: ServicesOverviewCardProps) {
  return (
    <div className="card">
      <h2>{t("Servicios habilitados")}</h2>
      <p className="muted tight">
        {t("Servicios incluidos en la suscripción actual.")}
      </p>
      <div className="chart-block">
        <Chart option={serviceOption} height={200} />
      </div>
      {contractedServices.length > 0 && (
        <div className="service-legend">
          {contractedServices.map((service) => (
            <span key={service.serviceCode} className="service-pill">
              {service.name}
            </span>
          ))}
        </div>
      )}
      {contractedServices.length === 0 && (
        <div className="muted tight">
          {t(
            "No hay servicios contratados. Crea una suscripción para activar servicios.",
          )}
        </div>
      )}
      {canManageSubscription && (
        <div className="mt-3">
          <button className="btn primary" onClick={onAssignServices}>
            {t("Asignar servicios")}
          </button>
        </div>
      )}
    </div>
  );
}
