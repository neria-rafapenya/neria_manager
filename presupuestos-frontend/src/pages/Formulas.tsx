import { useEffect, useState } from "react";
import { formulasService } from "../services/formulasService";
import { sectorsService } from "../services/sectorsService";
import { productsService } from "../services/productsService";
import { Formula } from "../types/formula";
import { Product } from "../types/product";
import { Sector } from "../types/sector";
import IconInfo from "../components/icons/IconInfo";

export default function Formulas() {
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    id: "",
    sectorId: "",
    productId: "",
    name: "",
    description: "",
    basePrice: "0",
    unitPrice: "0",
    active: true,
  });

  async function loadData() {
    try {
      const [formulaData, sectorData, productData] = await Promise.all([
        formulasService.list(""),
        sectorsService.list(""),
        productsService.list(""),
      ]);
      setFormulas(formulaData);
      setSectors(sectorData);
      setProducts(productData);
      if (!form.sectorId) {
        const activeSector = sectorData.find((s) => s.active);
        if (activeSector) {
          setForm((prev) => ({ ...prev, sectorId: activeSector.id }));
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando formulas");
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function resetForm() {
    setForm({
      id: "",
      sectorId: "",
      productId: "",
      name: "",
      description: "",
      basePrice: "0",
      unitPrice: "0",
      active: true,
    });
  }

  function startEdit(formula: Formula) {
    setForm({
      id: formula.id,
      sectorId: formula.sectorId ?? "",
      productId: formula.productId ?? "",
      name: formula.name,
      description: formula.description ?? "",
      basePrice: String(formula.basePrice ?? 0),
      unitPrice: String(formula.unitPrice ?? 0),
      active: formula.active,
    });
  }

  async function handleSave() {
    setError(null);
    try {
      const payload = {
        sectorId: form.sectorId,
        productId: form.productId || undefined,
        name: form.name,
        description: form.description || undefined,
        basePrice: Number(form.basePrice),
        unitPrice: Number(form.unitPrice),
        active: form.active,
      };
      if (form.id) {
        await formulasService.update("", form.id, payload);
      } else {
        await formulasService.create("", payload);
      }
      await loadData();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error guardando formula");
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("¿Eliminar esta fórmula?")) {
      return;
    }
    setError(null);
    try {
      await formulasService.remove("", id);
      await loadData();
      if (form.id === id) {
        resetForm();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error eliminando formula");
    }
  }

  return (
    <section>
      <h2>Formulas</h2>
      <p>
        Aquí puedes crear y mantener fórmulas de pricing. Cada fórmula pertenece
        a un sector y solo podrá aplicarse a productos/servicios de ese sector.
      </p>

      <div className="card" style={{ marginBottom: "16px" }}>
        <h3>{form.id ? "Editar fórmula" : "Nueva fórmula"}</h3>
        <div
          style={{
            display: "grid",
            gap: "8px",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          }}
        >
          <label className="form-field">
            <span className="label-row">
              Sector
              <span
                className="info-tooltip"
                data-tooltip="La fórmula solo podrá usarse en productos/servicios de este sector."
              >
                <IconInfo />
              </span>
            </span>
            <select
              className="form-select light"
              value={form.sectorId}
              onChange={(e) => {
                const nextSector = e.target.value;
                setForm((prev) => ({
                  ...prev,
                  sectorId: nextSector,
                  productId:
                    prev.productId &&
                    products.find((p) => p.id === prev.productId)
                      ?.sectorId === nextSector
                      ? prev.productId
                      : "",
                }));
              }}
            >
              <option value="">Selecciona sector</option>
              {sectors
                .filter((s) => s.active)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
            </select>
          </label>
          <label className="form-field">
            <span className="label-row">
              Producto/Servicio (opcional)
              <span
                className="info-tooltip"
                data-tooltip="Vincula la fórmula a un producto/servicio concreto."
              >
                <IconInfo />
              </span>
            </span>
            <select
              className="form-select light"
              value={form.productId}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, productId: e.target.value }))
              }
              disabled={!form.sectorId}
            >
              <option value="">Sin producto/servicio</option>
              {products
                .filter((p) => p.active)
                .filter((p) => !form.sectorId || p.sectorId === form.sectorId)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </select>
          </label>
          <label className="form-field">
            <span className="label-row">
              Nombre
              <span
                className="info-tooltip"
                data-tooltip="Nombre interno de la fórmula."
              >
                <IconInfo />
              </span>
            </span>
            <input
              className="form-control light"
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
            />
          </label>
          <label className="form-field">
            <span className="label-row">
              Base
              <span
                className="info-tooltip"
                data-tooltip="Importe fijo que se suma siempre."
              >
                <IconInfo />
              </span>
            </span>
            <input
              className="form-control light"
              type="number"
              value={form.basePrice}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, basePrice: e.target.value }))
              }
            />
          </label>
          <label className="form-field">
            <span className="label-row">
              Unitario
              <span
                className="info-tooltip"
                data-tooltip="Precio por unidad (se multiplica por cantidad)."
              >
                <IconInfo />
              </span>
            </span>
            <input
              className="form-control light"
              type="number"
              value={form.unitPrice}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, unitPrice: e.target.value }))
              }
            />
          </label>
          <label className="form-field">
            <span className="label-row">
              Activa
              <span
                className="info-tooltip"
                data-tooltip="Si está inactiva no aparece en los selectores."
              >
                <IconInfo />
              </span>
            </span>
            <select
              className="form-select light"
              value={form.active ? "yes" : "no"}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  active: e.target.value === "yes",
                }))
              }
            >
              <option value="yes">Sí</option>
              <option value="no">No</option>
            </select>
          </label>
          <label className="form-field">
            <span>Descripción</span>
            <input
              className="form-control light"
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
            />
          </label>
          <div className="form-field">
            <span>&nbsp;</span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                className="btn btn-outline-dark"
                onClick={resetForm}
                type="button"
              >
                Nueva
              </button>
              <button
                className="btn btn-dark"
                onClick={handleSave}
                disabled={!form.name.trim() || !form.sectorId}
                type="button"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
        {error && <div className="auth-error">{error}</div>}
      </div>

      <div className="card">
        <h3>Listado de fórmulas</h3>
        <table className="table table-hover">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Sector</th>
              <th>Producto/Servicio</th>
              <th>Base</th>
              <th>Unitario</th>
              <th>Activa</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {formulas.length === 0 ? (
              <tr>
                <td colSpan={7}>Sin datos</td>
              </tr>
            ) : (
              formulas.map((formula) => (
                <tr key={formula.id}>
                  <td>{formula.name}</td>
                  <td>
                    {formula.sectorName ??
                      sectors.find((s) => s.id === formula.sectorId)?.name ??
                      "-"}
                  </td>
                  <td>
                    {formula.productName ??
                      products.find((p) => p.id === formula.productId)?.name ??
                      "-"}
                  </td>
                  <td>{formula.basePrice ?? 0}</td>
                  <td>{formula.unitPrice ?? 0}</td>
                  <td>{formula.active ? "Si" : "No"}</td>
                  <td style={{ display: "flex", gap: "8px" }}>
                    <button
                      className="btn btn-outline-dark btn-sm"
                      onClick={() => startEdit(formula)}
                    >
                      Editar
                    </button>
                    <button
                      className="btn btn-outline-dark btn-sm"
                      onClick={() => handleDelete(formula.id)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
