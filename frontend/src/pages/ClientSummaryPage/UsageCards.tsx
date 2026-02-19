import { Chart, Sparkline } from "../../components/charts/Charts";
import type { TenantServiceOverview, UsageEvent, UsageSummary } from "../../types";
import type { TranslateFn } from "./types";

const formatTotal = (value: number) => value.toLocaleString();

type UsageCardsProps = {
  usageTrendOption: Record<string, unknown>;
  dailyUsage: {
    labels: string[];
    tokens: number[];
    cost: number[];
  };
  usageSummary: UsageSummary | null;
  usageEvents: UsageEvent[];
  serviceOverviewMap: Map<string, TenantServiceOverview>;
  tenantId?: string;
  t: TranslateFn;
  formatUsdWithEur: (value: number) => string;
};

export function UsageCards({
  usageTrendOption,
  dailyUsage,
  usageSummary,
  usageEvents,
  serviceOverviewMap,
  tenantId,
  t,
  formatUsdWithEur,
}: UsageCardsProps) {
  return (
    <>
      <div className="card">
        <h2>{t("Tendencia de uso")}</h2>
        <p className="muted tight">
          {t("Tokens y coste por día (últimos 7 días).")}
        </p>
        <Chart option={usageTrendOption} height={220} />
        <div className="chart-row">
          <div className="chart-metric">
            <span className="muted">{t("Tokens 7d")}</span>
            <div className="metric">{formatTotal(dailyUsage.tokens.reduce((acc, value) => acc + value, 0))}</div>
            <Sparkline
              data={dailyUsage.labels.map((label, index) => ({
                label,
                value: dailyUsage.tokens[index] || 0,
              }))}
            />
          </div>
          <div className="chart-metric">
            <span className="muted">{t("Coste 7d (USD/EUR)")}</span>
            <div className="metric">
              {formatUsdWithEur(dailyUsage.cost.reduce((acc, value) => acc + value, 0))}
            </div>
            <Sparkline
              data={dailyUsage.labels.map((label, index) => ({
                label,
                value: Number(dailyUsage.cost[index] || 0),
              }))}
              color="#d8512a"
            />
          </div>
        </div>
      </div>

      <div className="card">
        <h2>{t("Uso (hoy)")}</h2>
        <p className="muted tight">{t("Resumen de consumo diario.")}</p>
        {usageSummary ? (
          <div className="mini-list">
            <div className="mini-row usage-today-row">
              <div className="row align-items-center">
                <div className="col-6">{t("Tokens")}</div>
                <div className="col-6 text-end">{usageSummary.tokens}</div>
              </div>
            </div>
            <div className="mini-row usage-today-row">
              <div className="row align-items-center">
                <div className="col-6">{t("Coste USD")}</div>
                <div className="col-6 text-end">{formatUsdWithEur(usageSummary.costUsd)}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="muted">{t("Sin datos de uso.")}</div>
        )}
      </div>

      <div className="card">
        <div>
          <h2>{t("Logs de uso")}</h2>
          <p className="muted">{t("Últimos eventos de consumo.")}</p>
        </div>

        <div className="mini-list usage-logs-list">
          {usageEvents.map((event) => (
            <div className="mini-row usage-logs-row" key={event.id}>
              <div className="row align-items-center">
                <div className="col-6">
                  <div>{event.model}</div>
                  <div className="muted">
                    {event.serviceCode
                      ? serviceOverviewMap.get(event.serviceCode)?.name ||
                        event.serviceCode
                      : t("general")}
                  </div>
                </div>
                <div className="col-6 text-end">
                  <div>
                    {t("{count} tokens", {
                      count: event.tokensIn + event.tokensOut,
                    })}
                  </div>
                  <div className="muted">{formatUsdWithEur(event.costUsd)}</div>
                </div>
              </div>
              <div className="row">
                <div className="col-12 muted">
                  {new Date(event.createdAt).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
        {usageEvents.length === 0 && (
          <div className="muted">{t("Sin eventos de uso.")}</div>
        )}
        <a className="btn primary" href={`/clients/${tenantId}/usage`}>
          {t("Ver Usage")}
        </a>
      </div>
    </>
  );
}
