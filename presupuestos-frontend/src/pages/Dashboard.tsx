import { useEffect, useMemo, useState } from "react";
import { quotesService } from "../services/quotesService";
import { emailService } from "../services/emailService";
import { Quote } from "../types/quote";

function buildDailySeries(quotes: Quote[], days = 7) {
  const today = new Date();
  const labels: string[] = [];
  const counts: number[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const key = date.toISOString().slice(0, 10);
    labels.push(key);
    counts.push(0);
  }
  const indexByKey = new Map(labels.map((label, idx) => [label, idx]));
  quotes.forEach((quote) => {
    if (!quote.createdAt) return;
    const key = new Date(quote.createdAt).toISOString().slice(0, 10);
    const idx = indexByKey.get(key);
    if (idx !== undefined) {
      counts[idx] += 1;
    }
  });
  return { labels, counts };
}

export default function Dashboard() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [leadsCount, setLeadsCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const quotesData = await quotesService.list("");
        setQuotes(quotesData);
        const emails = await emailService.list("");
        setLeadsCount(emails.length);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error cargando dashboard");
      }
    }
    loadStats();
  }, []);

  const acceptedCount = useMemo(
    () => quotes.filter((q) => q.status === "ACCEPTED").length,
    [quotes]
  );

  const totalRevenue = useMemo(
    () => quotes.reduce((acc, q) => acc + (q.totalPrice ?? 0), 0),
    [quotes]
  );

  const series = useMemo(() => buildDailySeries(quotes, 7), [quotes]);
  const maxValue = Math.max(...series.counts, 1);

  return (
    <section>
      <h2>Dashboard</h2>
      <div className="card" style={{ marginBottom: "16px" }}>
        <strong>Backoffice</strong>: uso interno para tu equipo.
        <br />
        <strong>Frontend</strong>: portal público para tus clientes (solicitar presupuesto).
      </div>
      {error && <div className="auth-error">{error}</div>}
      <div className="card-grid">
        <div className="card">
          <div style={{ fontSize: "14px", opacity: 0.7 }}>Presupuestos hoy</div>
          <div style={{ fontSize: "24px", fontWeight: 600 }}>{quotes.length}</div>
        </div>
        <div className="card">
          <div style={{ fontSize: "14px", opacity: 0.7 }}>Presupuestos aceptados</div>
          <div style={{ fontSize: "24px", fontWeight: 600 }}>{acceptedCount}</div>
        </div>
        <div className="card">
          <div style={{ fontSize: "14px", opacity: 0.7 }}>Leads nuevos</div>
          <div style={{ fontSize: "24px", fontWeight: 600 }}>{leadsCount}</div>
        </div>
        <div className="card">
          <div style={{ fontSize: "14px", opacity: 0.7 }}>Ingresos estimados</div>
          <div style={{ fontSize: "24px", fontWeight: 600 }}>{totalRevenue.toFixed(2)} €</div>
        </div>
      </div>
      <div className="card" style={{ marginTop: "24px" }}>
        <h3>Presupuestos por dia</h3>
        <div className="bar-chart">
          {series.labels.map((label, idx) => (
            <div key={label} className="bar-item">
              <div
                className="bar"
                style={{ height: `${(series.counts[idx] / maxValue) * 100}%` }}
              />
              <span>{label.slice(5)}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
