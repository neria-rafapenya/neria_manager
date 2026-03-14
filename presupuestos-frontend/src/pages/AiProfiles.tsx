import { useEffect, useState } from "react";
import { aiProfileService } from "../services/aiProfileService";
import { productsService } from "../services/productsService";
import { sectorsService } from "../services/sectorsService";
import { AiProfile } from "../types/ai";
import { Product, ProductOption } from "../types/product";
import { Sector } from "../types/sector";

export default function AiProfiles() {
  const [profiles, setProfiles] = useState<AiProfile[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    id: "",
    sectorId: "",
    productId: "",
    requiredOptionNames: [] as string[],
    requiredOptionsText: "",
    promptInstructions: "",
    quantityLabel: "",
    active: true,
  });

  async function loadData() {
    try {
      const [profilesData, sectorsData, productsData] = await Promise.all([
        aiProfileService.list(""),
        sectorsService.list(""),
        productsService.list(""),
      ]);
      setProfiles(profilesData);
      setSectors(sectorsData);
      setProducts(productsData);
      if (!form.sectorId) {
        const activeSector = sectorsData.find((s) => s.active);
        if (activeSector) {
          setForm((prev) => ({ ...prev, sectorId: activeSector.id }));
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando perfiles AI");
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!form.productId) {
      setProductOptions([]);
      return;
    }
    productsService
      .listOptions("", form.productId)
      .then(setProductOptions)
      .catch(() => setProductOptions([]));
  }, [form.productId]);

  function getDefaultQuantityLabel(sectorId: string, productName: string) {
    const sectorName =
      sectors.find((sector) => sector.id === sectorId)?.name ?? "";
    const sectorNormalized = sectorName.toLowerCase();
    const productNormalized = productName.toLowerCase();
    if (
      sectorNormalized.includes("servicios") ||
      sectorNormalized.includes("domest") ||
      productNormalized.includes("limpieza") ||
      productNormalized.includes("mantenimiento")
    ) {
      return "horas";
    }
    if (
      sectorNormalized.includes("taller") ||
      productNormalized.includes("reparacion") ||
      productNormalized.includes("reparación")
    ) {
      return "servicios";
    }
    if (sectorNormalized.includes("imprenta")) {
      return "unidades";
    }
    return "";
  }

  function resetForm() {
    setForm({
      id: "",
      sectorId: form.sectorId,
      productId: "",
      requiredOptionNames: [],
      requiredOptionsText: "",
      promptInstructions: "",
      quantityLabel: getDefaultQuantityLabel(form.sectorId, ""),
      active: true,
    });
    setProductOptions([]);
  }

  function startEdit(profile: AiProfile) {
    setForm({
      id: profile.id,
      sectorId: profile.sectorId ?? "",
      productId: profile.productId ?? "",
      requiredOptionNames: profile.requiredOptionNames ?? [],
      requiredOptionsText: (profile.requiredOptionNames ?? []).join(", "),
      promptInstructions: profile.promptInstructions ?? "",
      quantityLabel:
        profile.quantityLabel ??
        getDefaultQuantityLabel(profile.sectorId ?? "", profile.productName ?? ""),
      active: profile.active ?? true,
    });
  }

  function toggleRequiredOption(name: string) {
    setForm((prev) => {
      const exists = prev.requiredOptionNames.includes(name);
      const next = exists
        ? prev.requiredOptionNames.filter((item) => item !== name)
        : [...prev.requiredOptionNames, name];
      return { ...prev, requiredOptionNames: next };
    });
  }

  async function handleSave() {
    setError(null);
    if (!form.sectorId) {
      setError("Selecciona un sector.");
      return;
    }
    try {
      const requiredOptionNames =
        form.productId && productOptions.length
          ? form.requiredOptionNames
          : form.requiredOptionsText
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean);

      const payload = {
        sectorId: form.sectorId,
        productId: form.productId || undefined,
        requiredOptionNames,
        promptInstructions: form.promptInstructions || undefined,
        quantityLabel: form.quantityLabel || undefined,
        active: form.active,
      };

      if (form.id) {
        await aiProfileService.update("", form.id, payload);
      } else {
        await aiProfileService.create("", payload);
      }
      await loadData();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error guardando perfil AI");
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("¿Eliminar este perfil AI?")) {
      return;
    }
    setError(null);
    try {
      await aiProfileService.remove("", id);
      await loadData();
      if (form.id === id) {
        resetForm();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error eliminando perfil AI");
    }
  }

  const filteredProducts = products.filter(
    (product) => !form.sectorId || product.sectorId === form.sectorId,
  );

  return (
    <section>
      <h2>AI Profiles</h2>
      <p>
        Define reglas por sector o por producto/servicio para que la IA sepa qué datos
        son obligatorios y cómo interpretar las solicitudes. El “label de
        cantidad” sirve para que la IA pregunte con sentido (horas, visitas,
        m², etc.).
      </p>

      {error && <div className="error-banner">{error}</div>}

      <div className="card" style={{ marginBottom: "16px" }}>
        <h3>{form.id ? "Editar perfil AI" : "Nuevo perfil AI"}</h3>
        <div
          style={{
            display: "grid",
            gap: "12px",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          }}
        >
          <label className="form-field">
            Sector
            <select
              className="form-select light"
              value={form.sectorId}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  sectorId: e.target.value,
                  productId: "",
                  requiredOptionNames: [],
                  requiredOptionsText: "",
                  quantityLabel:
                    prev.quantityLabel ||
                    getDefaultQuantityLabel(e.target.value, ""),
                }))
              }
            >
              <option value="">Selecciona sector</option>
              {sectors
                .filter((s) => s.active)
                .map((sector) => (
                  <option key={sector.id} value={sector.id}>
                    {sector.name}
                  </option>
                ))}
            </select>
          </label>

          <label className="form-field">
            Producto/Servicio (opcional)
            <select
              className="form-select light"
              value={form.productId}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  productId: e.target.value,
                  requiredOptionNames: [],
                  quantityLabel:
                    prev.quantityLabel ||
                    getDefaultQuantityLabel(
                      prev.sectorId,
                      filteredProducts.find(
                        (product) => product.id === e.target.value,
                      )?.name ?? "",
                    ),
                }))
              }
              disabled={!form.sectorId}
            >
              <option value="">Perfil solo por sector</option>
              {filteredProducts.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div style={{ marginTop: "12px" }}>
          <label className="form-field">
            Opciones obligatorias
            {form.productId ? (
              <div className="checkbox-grid">
                {productOptions.map((option) => (
                  <label key={option.id} className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={form.requiredOptionNames.includes(
                        option.name ?? "",
                      )}
                      onChange={() => toggleRequiredOption(option.name ?? "")}
                    />
                    <span>{option.name}</span>
                  </label>
                ))}
                {!productOptions.length && (
                  <div className="helper-text">
                    Este producto/servicio aún no tiene opciones.
                  </div>
                )}
              </div>
            ) : (
              <>
                <input
                  className="form-control light"
                  placeholder="Ej: Formato, Encuadernación, Papel interior"
                  value={form.requiredOptionsText}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      requiredOptionsText: e.target.value,
                    }))
                  }
                />
                <p className="helper-text">
                  Si no seleccionas un producto/servicio, escribe aquí las opciones
                  obligatorias separadas por comas.
                </p>
              </>
            )}
          </label>
        </div>

        <label className="form-field" style={{ marginTop: "12px" }}>
          Instrucciones adicionales (opcional)
          <textarea
            className="form-control light"
            rows={3}
            value={form.promptInstructions}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                promptInstructions: e.target.value,
              }))
            }
            placeholder="Ej: Para edición de libros, exige formato, encuadernación, papel interior y número de páginas."
          />
        </label>

        <label className="form-field" style={{ marginTop: "12px" }}>
          Label de cantidad (opcional)
          <input
            className="form-control light"
            value={form.quantityLabel}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, quantityLabel: e.target.value }))
            }
            placeholder="Ej: horas, visitas, m²"
          />
          <p className="helper-text">
            Permite adaptar la pregunta de cantidad según el servicio o
            producto/servicio.
          </p>
        </label>

        <label className="form-field" style={{ marginTop: "12px" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, active: e.target.checked }))
              }
            />
            Perfil activo
          </span>
        </label>

        <div className="button-row" style={{ marginTop: "12px" }}>
          <button className="btn btn-primary" onClick={handleSave}>
            {form.id ? "Guardar cambios" : "Crear perfil"}
          </button>
          {form.id && (
            <button className="btn btn-secondary" onClick={resetForm}>
              Cancelar
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <h3>Perfiles existentes</h3>
        <table className="table table-hover">
          <thead>
            <tr>
              <th>Sector</th>
              <th>Producto/Servicio</th>
              <th>Opciones obligatorias</th>
              <th>Label cantidad</th>
              <th>Activo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((profile) => (
              <tr key={profile.id}>
                <td>{profile.sectorName ?? "-"}</td>
                <td>{profile.productName ?? "Sector completo"}</td>
                <td>{(profile.requiredOptionNames ?? []).join(", ") || "-"}</td>
                <td>{profile.quantityLabel ?? "-"}</td>
                <td>{profile.active ? "Sí" : "No"}</td>
                <td>
                  <button
                    className="link-button"
                    onClick={() => startEdit(profile)}
                  >
                    Editar
                  </button>
                  <button
                    className="link-button danger"
                    onClick={() => handleDelete(profile.id)}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {!profiles.length && (
              <tr>
                <td colSpan={6}>No hay perfiles aún.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
