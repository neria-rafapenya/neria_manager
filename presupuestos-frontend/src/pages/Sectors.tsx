import { useEffect, useState } from "react";
import { sectorsService } from "../services/sectorsService";
import { productsService } from "../services/productsService";
import { Sector } from "../types/sector";
import { Product } from "../types/product";

export default function Sectors() {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [name, setName] = useState("");
  const [catalogType, setCatalogType] = useState<"INTERNAL" | "EXTERNAL">("INTERNAL");
  const [apiBaseUrl, setApiBaseUrl] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingCatalogType, setEditingCatalogType] = useState<"INTERNAL" | "EXTERNAL">("INTERNAL");
  const [editingApiBaseUrl, setEditingApiBaseUrl] = useState("");
  const [editingApiToken, setEditingApiToken] = useState("");
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, string>>({});

  const DEFAULT_PRODUCTS_ENDPOINT = "/catalog/products";
  const DEFAULT_PRODUCT_ENDPOINT = "/catalog/products/{id}";
  const DEFAULT_PRODUCT_OPTIONS_ENDPOINT = "/catalog/products/{id}/options";
  const DEFAULT_OPTION_VALUES_ENDPOINT = "/catalog/options/{id}/values";

  async function loadSectors() {
    try {
      const data = await sectorsService.list("");
      setSectors(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando sectores");
    }
  }

  async function loadProducts() {
    try {
      const data = await productsService.list("");
      const counts: Record<string, number> = {};
      data.forEach((product: Product) => {
        if (!product.sectorId) return;
        counts[product.sectorId] = (counts[product.sectorId] ?? 0) + 1;
      });
      setProductCounts(counts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando productos/servicios");
    }
  }

  useEffect(() => {
    loadSectors();
    loadProducts();
  }, []);

  async function handleCreate() {
    setError(null);
    try {
      await sectorsService.create("", {
        name,
        active: true,
        catalogType,
        externalApiBaseUrl: catalogType === "EXTERNAL" ? apiBaseUrl : undefined,
        externalApiToken: catalogType === "EXTERNAL" ? apiToken : undefined,
        externalProductsEndpoint:
          catalogType === "EXTERNAL" ? DEFAULT_PRODUCTS_ENDPOINT : undefined,
        externalProductEndpoint:
          catalogType === "EXTERNAL" ? DEFAULT_PRODUCT_ENDPOINT : undefined,
        externalProductOptionsEndpoint:
          catalogType === "EXTERNAL" ? DEFAULT_PRODUCT_OPTIONS_ENDPOINT : undefined,
        externalOptionValuesEndpoint:
          catalogType === "EXTERNAL" ? DEFAULT_OPTION_VALUES_ENDPOINT : undefined,
      });
      setName("");
      setCatalogType("INTERNAL");
      setApiBaseUrl("");
      setApiToken("");
      await loadSectors();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creando sector");
    }
  }

  async function toggleActive(sector: Sector) {
    setError(null);
    try {
      await sectorsService.update("", sector.id, { active: !sector.active });
      await loadSectors();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error actualizando sector");
    }
  }

  async function startEdit(sector: Sector) {
    setEditingId(sector.id);
    setEditingName(sector.name);
    setEditingCatalogType(sector.catalogType ?? "INTERNAL");
    setEditingApiBaseUrl(sector.externalApiBaseUrl ?? "");
    setEditingApiToken("");
  }

  async function saveEdit() {
    if (!editingId) return;
    setError(null);
    try {
      await sectorsService.update("", editingId, {
        name: editingName,
        catalogType: editingCatalogType,
        externalApiBaseUrl:
          editingCatalogType === "EXTERNAL" ? editingApiBaseUrl : undefined,
        externalApiToken:
          editingCatalogType === "EXTERNAL"
            ? editingApiToken || undefined
            : "",
        externalProductsEndpoint:
          editingCatalogType === "EXTERNAL" ? DEFAULT_PRODUCTS_ENDPOINT : undefined,
        externalProductEndpoint:
          editingCatalogType === "EXTERNAL" ? DEFAULT_PRODUCT_ENDPOINT : undefined,
        externalProductOptionsEndpoint:
          editingCatalogType === "EXTERNAL" ? DEFAULT_PRODUCT_OPTIONS_ENDPOINT : undefined,
        externalOptionValuesEndpoint:
          editingCatalogType === "EXTERNAL" ? DEFAULT_OPTION_VALUES_ENDPOINT : undefined,
      });
      setEditingId(null);
      setEditingName("");
      setEditingCatalogType("INTERNAL");
      setEditingApiBaseUrl("");
      setEditingApiToken("");
      await loadSectors();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error actualizando sector");
    }
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingName("");
    setEditingCatalogType("INTERNAL");
    setEditingApiBaseUrl("");
    setEditingApiToken("");
  }

  async function handleDelete(id: string) {
    setError(null);
    const count = productCounts[id] ?? 0;
    if (count > 0) {
      setError(`No se puede eliminar: hay ${count} producto(s)/servicio(s) asignado(s) a este sector.`);
      return;
    }
    if (!window.confirm("¿Seguro que quieres eliminar este sector?")) {
      return;
    }
    try {
      await sectorsService.remove("", id);
      await loadSectors();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error eliminando sector");
    }
  }

  async function handleTestConnection(sector: Sector) {
    setError(null);
    setTestingId(sector.id);
    try {
      const result = await sectorsService.testConnection("", sector.id);
      const message = result.ok
        ? `OK (${result.status})`
        : `Error (${result.status}): ${result.message}`;
      setTestResults((prev) => ({ ...prev, [sector.id]: message }));
    } catch (err) {
      setTestResults((prev) => ({
        ...prev,
        [sector.id]: "Error al probar conexión.",
      }));
      setError(err instanceof Error ? err.message : "Error probando conexión");
    } finally {
      setTestingId(null);
    }
  }

  return (
    <section>
      <h2>Sectors</h2>
      <div className="card" style={{ marginBottom: "16px" }}>
        <h3>Integración API externa (catálogo)</h3>
        <p>Si el sector usa catálogo externo, debes pedir al cliente estos datos. Los endpoints son fijos.</p>
        <ul>
          <li>`API Base URL` (ej: `https://api.su-dominio.com`)</li>
          <li>`Auth`: `Authorization: Bearer &lt;TOKEN_MAESTRO&gt;`</li>
          <li>`GET {DEFAULT_PRODUCTS_ENDPOINT}`</li>
          <li>`GET {DEFAULT_PRODUCT_ENDPOINT}`</li>
          <li>`GET {DEFAULT_PRODUCT_OPTIONS_ENDPOINT}`</li>
          <li>`GET {DEFAULT_OPTION_VALUES_ENDPOINT}`</li>
        </ul>
        <div style={{ display: "grid", gap: "8px", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          <label>
            Tipo catálogo
            <select className="form-select light" value={catalogType} onChange={(e) => setCatalogType(e.target.value as "INTERNAL" | "EXTERNAL")}>
              <option value="INTERNAL">Interno</option>
              <option value="EXTERNAL">Externo (API)</option>
            </select>
          </label>
          {catalogType === "EXTERNAL" && (
            <>
              <label>
                API Base URL
                <input className="form-control light" value={apiBaseUrl} onChange={(e) => setApiBaseUrl(e.target.value)} placeholder="https://api.cliente.com" />
              </label>
              <label>
                Token maestro (Bearer)
                <input
                  className="form-control light"
                  type="password"
                  value={apiToken}
                  onChange={(e) => setApiToken(e.target.value)}
                  placeholder="TOKEN_MAESTRO"
                />
              </label>
            </>
          )}
        </div>
      </div>
      <div className="card" style={{ marginBottom: "16px" }}>
        <h3>Nuevo sector</h3>
        <div style={{ display: "grid", gap: "8px", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
          <input className="form-control light" placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)} />
          <button onClick={handleCreate} disabled={!name.trim()}>
            Crear
          </button>
        </div>
        {error && <div className="auth-error">{error}</div>}
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Catálogo</th>
            <th>API Base URL</th>
            <th>Productos/Servicios</th>
            <th>Activo</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {sectors.length === 0 ? (
            <tr>
              <td colSpan={6}>Sin datos</td>
            </tr>
          ) : (
            sectors.map((sector) => (
              <tr key={sector.id}>
                <td>
                  {editingId === sector.id ? (
                    <input className="form-control light" value={editingName} onChange={(e) => setEditingName(e.target.value)} />
                  ) : (
                    sector.name
                  )}
                </td>
                <td>
                  {editingId === sector.id ? (
                    <select
                      className="form-select light"
                      value={editingCatalogType}
                      onChange={(e) => setEditingCatalogType(e.target.value as "INTERNAL" | "EXTERNAL")}
                    >
                      <option value="INTERNAL">Interno</option>
                      <option value="EXTERNAL">Externo</option>
                    </select>
                  ) : (
                    sector.catalogType ?? "INTERNAL"
                  )}
                </td>
                <td>
                  {editingId === sector.id ? (
                    editingCatalogType === "EXTERNAL" ? (
                      <>
                        <input
                          className="form-control light"
                          value={editingApiBaseUrl}
                          onChange={(e) => setEditingApiBaseUrl(e.target.value)}
                          placeholder="https://api.cliente.com"
                        />
                        <div style={{ marginTop: "6px", display: "grid", gap: "6px" }}>
                          <input
                            className="form-control light"
                            type="password"
                            value={editingApiToken}
                            onChange={(e) => setEditingApiToken(e.target.value)}
                            placeholder="Nuevo token maestro (opcional)"
                          />
                          <small className="helper-text">
                            Si dejas el token vacío, se conserva el actual.
                          </small>
                        </div>
                      </>
                    ) : (
                      "-"
                    )
                  ) : (
                    sector.externalApiBaseUrl ?? "-"
                  )}
                </td>
                <td>{productCounts[sector.id] ?? 0}</td>
                <td>{sector.active ? "Si" : "No"}</td>
                <td>
                  {editingId === sector.id ? (
                    <>
                      <button onClick={saveEdit} disabled={!editingName.trim()}>
                        Guardar
                      </button>
                      <button onClick={cancelEdit} style={{ marginLeft: "8px" }}>
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => startEdit(sector)}>Editar</button>
                      <button onClick={() => toggleActive(sector)} style={{ marginLeft: "8px" }}>
                        {sector.active ? "Desactivar" : "Activar"}
                      </button>
                      {sector.catalogType === "EXTERNAL" && (
                        <button
                          onClick={() => handleTestConnection(sector)}
                          style={{ marginLeft: "8px" }}
                          disabled={testingId === sector.id}
                        >
                          {testingId === sector.id ? "Probando..." : "Test API"}
                        </button>
                      )}
                      <button onClick={() => handleDelete(sector.id)} style={{ marginLeft: "8px" }}>
                        Eliminar
                      </button>
                      {testResults[sector.id] && (
                        <div className="helper-text" style={{ marginTop: "6px" }}>
                          {testResults[sector.id]}
                        </div>
                      )}
                    </>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </section>
  );
}
