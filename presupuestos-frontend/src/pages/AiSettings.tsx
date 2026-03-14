import { useEffect, useState } from "react";
import { aiService } from "../services/aiService";
import { sectorsService } from "../services/sectorsService";
import { quotesService } from "../services/quotesService";
import { productsService } from "../services/productsService";
import { AiParseResponse, AiRequestLog } from "../types/ai";
import { Sector } from "../types/sector";
import { Product } from "../types/product";

const SECTOR_KEY = "presup_sector";

export default function AiSettings() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<AiParseResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [sectorId, setSectorId] = useState(() => localStorage.getItem(SECTOR_KEY) ?? "");
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [logs, setLogs] = useState<AiRequestLog[]>([]);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [logsLoading, setLogsLoading] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [onlyErrors, setOnlyErrors] = useState(true);

  async function loadSectors() {
    try {
      const data = await sectorsService.list("", true);
      setSectors(data);
      if (sectorId && !data.find((s) => s.id === sectorId)) {
        const byName = data.find((s) => s.name === sectorId);
        if (byName) {
          setSectorId(byName.id);
          localStorage.setItem(SECTOR_KEY, byName.id);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando sectores");
    }
  }

  useEffect(() => {
    loadSectors();
    productsService.list("").then(setProducts).catch(() => {});
  }, []);

  useEffect(() => {
    loadLogs();
  }, [fromDate, toDate, onlyErrors]);

  async function loadLogs() {
    setLogsError(null);
    setLogsLoading(true);
    try {
      const data = await aiService.logs("", {
        from: fromDate || undefined,
        to: toDate || undefined,
        onlyErrors,
      });
      setLogs(data);
    } catch (err) {
      setLogsError(err instanceof Error ? err.message : "Error cargando logs");
    } finally {
      setLogsLoading(false);
    }
  }

  async function handleParse() {
    setError(null);
    setLoading(true);
    try {
      const response = await aiService.parse("", { text, sectorId: sectorId || undefined });
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error parsing");
    } finally {
      setLoading(false);
    }
  }

  function normalize(value: string) {
    return value.trim().toLowerCase();
  }

  async function handleCreateQuote() {
    if (!result?.product) {
      setError("No hay resultado de IA para crear presupuesto.");
      return;
    }
    setError(null);
    setCreating(true);
    try {
      const sectorProducts = products.filter((product) => (product.sectorId ?? "") === sectorId);
      const product =
        sectorProducts.find((item) => normalize(item.name) === normalize(result.product ?? "")) ??
        sectorProducts.find(
          (item) =>
            normalize(item.name).includes(normalize(result.product ?? "")) ||
            normalize(result.product ?? "").includes(normalize(item.name))
        );

      if (!product) {
        setError("El producto/servicio detectado no existe en el catálogo del sector.");
        return;
      }

      const options = await productsService.listOptions("", product.id);
      const optionPayload = await Promise.all(
        options.map(async (option) => {
          const rawValue = result.options?.[option.name ?? ""];
          if (option.required && (rawValue == null || rawValue === "")) {
            throw new Error(`Falta la opción obligatoria: ${option.name}`);
          }
          if (rawValue == null || rawValue === "") return null;
          if (option.optionType === "SELECT") {
            const values = await productsService.listOptionValues("", option.id);
            const match = values.find((value) => normalize(value.value ?? "") === normalize(String(rawValue)));
            if (!match) throw new Error(`Valor no válido para ${option.name}`);
            return { optionId: option.id, value: match.value ?? "" };
          }
          if (option.optionType === "NUMBER") {
            const num = Number(rawValue);
            if (Number.isNaN(num)) throw new Error(`La opción ${option.name} debe ser numérica`);
            return { optionId: option.id, value: String(num) };
          }
          if (option.optionType === "BOOLEAN") {
            const normalized = normalize(String(rawValue));
            const booleanValue = ["true", "si", "sí", "yes", "1"].includes(normalized)
              ? "true"
              : ["false", "no", "0"].includes(normalized)
              ? "false"
              : null;
            if (!booleanValue) throw new Error(`La opción ${option.name} debe ser true/false`);
            return { optionId: option.id, value: booleanValue };
          }
          return { optionId: option.id, value: String(rawValue) };
        })
      );

      const quantity = result.quantity && result.quantity > 0 ? result.quantity : 1;
      const sectorName = sectors.find((s) => s.id === sectorId)?.name;
      await quotesService.create("", {
        items: [
          {
            productId: product.id,
            quantity,
            options: optionPayload.filter(Boolean) as any,
          },
        ],
        sector: sectorName,
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creando presupuesto");
    } finally {
      setCreating(false);
    }
  }

  return (
    <section>
      <h2>AI Settings</h2>
      <p>
        Aquí puedes probar el parser de IA y validar que devuelve JSON correcto
        según el sector seleccionado. La IA solo interpreta el texto; el precio
        lo calcula siempre el backend.
      </p>
      <div className="card">
        <label>
          Sector
          <select
            className="form-select light"
            value={sectorId}
            onChange={(e) => {
              setSectorId(e.target.value);
              localStorage.setItem(SECTOR_KEY, e.target.value);
            }}
          >
            <option value="">Todos</option>
            {sectors.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Texto a interpretar
          <textarea
            className="form-control light"
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Necesito 2000 flyers A5..."
          />
        </label>
        <button onClick={handleParse} disabled={loading || !text}>
          {loading ? "Procesando..." : "Parsear"}
        </button>
        <button onClick={handleCreateQuote} disabled={!result || creating} style={{ marginLeft: "8px" }}>
          {creating ? "Creando..." : "Usar resultado para crear presupuesto"}
        </button>
        {error && <div className="auth-error">{error}</div>}
        {result && <pre className="code-preview">{JSON.stringify(result, null, 2)}</pre>}
      </div>

      <div className="card" style={{ marginTop: "16px" }}>
        <h3>Logs de parsing</h3>
        <p className="helper-text">
          Aquí puedes revisar los errores de parsing por fecha. Por defecto se muestran solo errores.
        </p>
        <div className="row" style={{ gap: "12px", alignItems: "end" }}>
          <label style={{ flex: 1 }}>
            Desde
            <input
              className="form-control light"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </label>
          <label style={{ flex: 1 }}>
            Hasta
            <input
              className="form-control light"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              className="form-control light"
              type="checkbox"
              checked={onlyErrors}
              onChange={(e) => setOnlyErrors(e.target.checked)}
            />
            Solo errores
          </label>
          <button onClick={loadLogs} disabled={logsLoading}>
            {logsLoading ? "Cargando..." : "Actualizar"}
          </button>
        </div>
        {logsError && <div className="auth-error">{logsError}</div>}
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Confidence</th>
                <th>Error</th>
                <th>Texto</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{log.createdAt ? new Date(log.createdAt).toLocaleString() : "-"}</td>
                  <td>{log.confidence ?? "-"}</td>
                  <td>{log.errorMessage ?? "-"}</td>
                  <td>{log.inputText ?? "-"}</td>
                </tr>
              ))}
              {!logs.length && !logsLoading && (
                <tr>
                  <td colSpan={4}>Sin resultados</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
