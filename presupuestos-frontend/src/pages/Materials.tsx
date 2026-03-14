import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { materialsService } from "../services/materialsService";
import { productsService } from "../services/productsService";
import { sectorsService } from "../services/sectorsService";
import { Material, ProductMaterialRule, MaterialRuleType } from "../types/material";
import { Product } from "../types/product";
import { Sector } from "../types/sector";

const ruleTypeOptions: { value: MaterialRuleType; label: string }[] = [
  { value: "FLOOR_AREA", label: "Área suelo (m²)" },
  { value: "WALL_AREA", label: "Área pared (perímetro × altura)" },
  { value: "LINEAR", label: "Lineal (perímetro)" },
  { value: "PER_UNIT", label: "Por unidad/cantidad" },
  { value: "FIXED", label: "Fijo" },
];

const qualityOptions = [
  { value: "", label: "Todas" },
  { value: "BASIC", label: "Básica" },
  { value: "MEDIUM", label: "Media" },
  { value: "PREMIUM", label: "Alta/Premium" },
];

export default function Materials() {
  const MATERIALS_SECTOR_KEY = "presup_materials_sector";
  const [searchParams] = useSearchParams();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [selectedSectorId, setSelectedSectorId] = useState(
    () => localStorage.getItem(MATERIALS_SECTOR_KEY) ?? "",
  );
  const [rules, setRules] = useState<ProductMaterialRule[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [materialForm, setMaterialForm] = useState({
    name: "",
    unit: "m²",
    costPerUnit: "0",
    active: true,
  });
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
  const [editMaterialForm, setEditMaterialForm] = useState({
    sectorId: "",
    name: "",
    unit: "",
    costPerUnit: "0",
    active: true,
  });

  const [ruleForm, setRuleForm] = useState({
    materialId: "",
    ruleType: "FLOOR_AREA" as MaterialRuleType,
    quantityFactor: "1",
    wastePercent: "0",
    qualityTier: "",
    active: true,
  });
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [editRuleForm, setEditRuleForm] = useState({
    materialId: "",
    ruleType: "FLOOR_AREA" as MaterialRuleType,
    quantityFactor: "1",
    wastePercent: "0",
    qualityTier: "",
    active: true,
  });

  async function loadData() {
    try {
      const [productsData, sectorsData] = await Promise.all([
        productsService.list(""),
        sectorsService.list(""),
      ]);
      setProducts(productsData);
      setSectors(sectorsData);
      if (!selectedSectorId && sectorsData.length > 0) {
        const active = sectorsData.find((s) => s.active);
        setSelectedSectorId(active?.id ?? sectorsData[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando materiales");
    }
  }

  async function loadMaterials(sectorId?: string) {
    try {
      const materialsData = await materialsService.list("", sectorId);
      setMaterials(materialsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando materiales");
    }
  }

  async function loadRules(productId: string) {
    if (!productId) {
      setRules([]);
      return;
    }
    try {
      const data = await materialsService.listProductRules("", productId);
      setRules(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando reglas");
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadMaterials(selectedSectorId);
  }, [selectedSectorId]);

  useEffect(() => {
    if (selectedSectorId) {
      localStorage.setItem(MATERIALS_SECTOR_KEY, selectedSectorId);
    } else {
      localStorage.removeItem(MATERIALS_SECTOR_KEY);
    }
  }, [selectedSectorId]);

  useEffect(() => {
    const productId = searchParams.get("productId");
    if (productId) {
      setSelectedProductId(productId);
    }
  }, [searchParams]);

  useEffect(() => {
    loadRules(selectedProductId);
  }, [selectedProductId]);

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedProductId),
    [products, selectedProductId],
  );

  const materialsForProduct = useMemo(() => {
    if (!selectedProduct?.sectorId) {
      return materials;
    }
    return materials.filter((mat) => mat.sectorId === selectedProduct.sectorId);
  }, [materials, selectedProduct]);

  const productsForSector = useMemo(() => {
    const filtered = selectedSectorId
      ? products.filter((product) => product.sectorId === selectedSectorId)
      : products;
    return [...filtered].sort((a, b) =>
      (a.name ?? "").localeCompare(b.name ?? "", "es", { sensitivity: "base" }),
    );
  }, [products, selectedSectorId]);

  const sectorMap = useMemo(() => {
    const map = new Map<string, string>();
    sectors.forEach((sector) => {
      map.set(sector.id, sector.name);
    });
    return map;
  }, [sectors]);

  const selectedSectorName = sectorMap.get(selectedSectorId ?? "") ?? "";

  useEffect(() => {
    if (selectedProduct?.sectorId && selectedProduct.sectorId !== selectedSectorId) {
      setSelectedSectorId(selectedProduct.sectorId);
    }
  }, [selectedProduct, selectedSectorId]);

  useEffect(() => {
    if (!selectedProductId || !selectedSectorId) {
      return;
    }
    if (selectedProduct?.sectorId && selectedProduct.sectorId !== selectedSectorId) {
      setSelectedProductId("");
    }
  }, [selectedProductId, selectedSectorId, selectedProduct]);

  async function handleCreateMaterial() {
    setError(null);
    if (!materialForm.name.trim()) {
      setError("Nombre de material requerido.");
      return;
    }
    if (!selectedSectorId) {
      setError("Selecciona un sector.");
      return;
    }
    try {
      await materialsService.create("", {
        sectorId: selectedSectorId,
        name: materialForm.name.trim(),
        unit: materialForm.unit.trim(),
        costPerUnit: Number(materialForm.costPerUnit) || 0,
        active: materialForm.active,
      });
      setMaterialForm({ name: "", unit: "m²", costPerUnit: "0", active: true });
      await loadMaterials(selectedSectorId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creando material");
    }
  }

  function startEditMaterial(material: Material) {
    setEditingMaterialId(material.id);
    setEditMaterialForm({
      sectorId: material.sectorId ?? selectedSectorId,
      name: material.name,
      unit: material.unit,
      costPerUnit: String(material.costPerUnit ?? 0),
      active: material.active ?? true,
    });
  }

  async function saveEditMaterial(material: Material) {
    try {
      await materialsService.update("", material.id, {
        sectorId: editMaterialForm.sectorId,
        name: editMaterialForm.name,
        unit: editMaterialForm.unit,
        costPerUnit: Number(editMaterialForm.costPerUnit) || 0,
        active: editMaterialForm.active,
      });
      setEditingMaterialId(null);
      await loadMaterials(selectedSectorId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error actualizando material");
    }
  }

  async function deleteMaterial(id: string) {
    if (!window.confirm("¿Eliminar material?")) return;
    try {
      await materialsService.remove("", id);
      await loadMaterials(selectedSectorId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error eliminando material");
    }
  }

  async function handleCreateRule() {
    setError(null);
    if (!selectedProductId) {
      setError("Selecciona un producto/servicio.");
      return;
    }
    if (!ruleForm.materialId) {
      setError("Selecciona un material.");
      return;
    }
    try {
      await materialsService.createProductRule("", selectedProductId, {
        materialId: ruleForm.materialId,
        ruleType: ruleForm.ruleType,
        quantityFactor: Number(ruleForm.quantityFactor) || 1,
        wastePercent: Number(ruleForm.wastePercent) || 0,
        qualityTier: ruleForm.qualityTier || undefined,
        active: ruleForm.active,
      });
      setRuleForm({
        materialId: "",
        ruleType: "FLOOR_AREA",
        quantityFactor: "1",
        wastePercent: "0",
        qualityTier: "",
        active: true,
      });
      await loadRules(selectedProductId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creando regla");
    }
  }

  function startEditRule(rule: ProductMaterialRule) {
    setEditingRuleId(rule.id);
    setEditRuleForm({
      materialId: rule.materialId,
      ruleType: rule.ruleType,
      quantityFactor: String(rule.quantityFactor ?? 1),
      wastePercent: String(rule.wastePercent ?? 0),
      qualityTier: rule.qualityTier ?? "",
      active: rule.active ?? true,
    });
  }

  async function saveEditRule(rule: ProductMaterialRule) {
    try {
      await materialsService.updateProductRule("", rule.id, {
        materialId: editRuleForm.materialId,
        ruleType: editRuleForm.ruleType,
        quantityFactor: Number(editRuleForm.quantityFactor) || 1,
        wastePercent: Number(editRuleForm.wastePercent) || 0,
        qualityTier: editRuleForm.qualityTier || undefined,
        active: editRuleForm.active,
      });
      setEditingRuleId(null);
      await loadRules(selectedProductId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error actualizando regla");
    }
  }

  async function deleteRule(id: string) {
    if (!window.confirm("¿Eliminar regla de material?")) return;
    try {
      await materialsService.removeProductRule("", id);
      await loadRules(selectedProductId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error eliminando regla");
    }
  }

  return (
    <section>
      <h2>Materiales</h2>
      <p>
        Define el catálogo de materiales y las reglas de consumo por producto/servicio.
        Esto permite calcular un presupuesto con materiales reales (m², perímetro,
        altura, merma, etc.).
      </p>
      <p className="helper-text">
        Para que el cálculo funcione, crea en el producto/servicio opciones NUMÉRICAS como
        “m² suelo”, “perímetro” o “altura”. Esos valores alimentan las reglas
        de materiales.
      </p>
      {error && <div className="error-banner">{error}</div>}

      <div className="card" style={{ marginBottom: "16px" }}>
        <h3>Catálogo de materiales</h3>
        <label className="form-field">
          Sector
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <select
              className="form-select light"
              value={selectedSectorId}
              onChange={(e) => setSelectedSectorId(e.target.value)}
            >
              <option value="">Todos los sectores</option>
              {sectors.map((sector) => (
                <option key={sector.id} value={sector.id}>
                  {sector.name}
                </option>
              ))}
            </select>
            {selectedSectorId && (
              <span className="badge bg-secondary">{selectedSectorName}</span>
            )}
          </div>
        </label>
        <div
          style={{
            display: "grid",
            gap: "8px",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          }}
        >
          <input
            className="form-control light"
            placeholder="Nombre (Azulejo pared)"
            value={materialForm.name}
            onChange={(e) => setMaterialForm((prev) => ({ ...prev, name: e.target.value }))}
          />
          <input
            className="form-control light"
            placeholder="Unidad (m², ml, ud)"
            value={materialForm.unit}
            onChange={(e) => setMaterialForm((prev) => ({ ...prev, unit: e.target.value }))}
          />
          <input
            className="form-control light"
            type="number"
            placeholder="Coste unitario"
            value={materialForm.costPerUnit}
            onChange={(e) => setMaterialForm((prev) => ({ ...prev, costPerUnit: e.target.value }))}
          />
          <select
            className="form-select light"
            value={materialForm.active ? "yes" : "no"}
            onChange={(e) => setMaterialForm((prev) => ({ ...prev, active: e.target.value === "yes" }))}
          >
            <option value="yes">Activo</option>
            <option value="no">Inactivo</option>
          </select>
          <button className="btn btn-primary" onClick={handleCreateMaterial}>
            Crear material
          </button>
        </div>

        <table className="table table-hover mt-3">
          <thead>
            <tr>
              <th>Sector</th>
              <th>Nombre</th>
              <th>Unidad</th>
              <th>Coste</th>
              <th>Activo</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {materials.map((material) => (
              <tr key={material.id}>
                <td>
                  {editingMaterialId === material.id ? (
                    <select
                      className="form-select light"
                      value={editMaterialForm.sectorId}
                      onChange={(e) =>
                        setEditMaterialForm((prev) => ({
                          ...prev,
                          sectorId: e.target.value,
                        }))
                      }
                    >
                      <option value="">Selecciona sector</option>
                      {sectors.map((sector) => (
                        <option key={sector.id} value={sector.id}>
                          {sector.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    sectorMap.get(material.sectorId ?? "") ?? "-"
                  )}
                </td>
                <td>
                  {editingMaterialId === material.id ? (
                    <input
                      className="form-control light"
                      value={editMaterialForm.name}
                      onChange={(e) =>
                        setEditMaterialForm((prev) => ({ ...prev, name: e.target.value }))
                      }
                    />
                  ) : (
                    material.name
                  )}
                </td>
                <td>
                  {editingMaterialId === material.id ? (
                    <input
                      className="form-control light"
                      value={editMaterialForm.unit}
                      onChange={(e) =>
                        setEditMaterialForm((prev) => ({ ...prev, unit: e.target.value }))
                      }
                    />
                  ) : (
                    material.unit
                  )}
                </td>
                <td>
                  {editingMaterialId === material.id ? (
                    <input
                      className="form-control light"
                      type="number"
                      value={editMaterialForm.costPerUnit}
                      onChange={(e) =>
                        setEditMaterialForm((prev) => ({ ...prev, costPerUnit: e.target.value }))
                      }
                    />
                  ) : (
                    material.costPerUnit?.toFixed(2)
                  )}
                </td>
                <td>{material.active ? "Sí" : "No"}</td>
                <td>
                  {editingMaterialId === material.id ? (
                    <>
                      <button
                        className="link-button"
                        onClick={() => saveEditMaterial(material)}
                      >
                        Guardar
                      </button>
                      <button
                        className="link-button danger"
                        onClick={() => setEditingMaterialId(null)}
                      >
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="link-button"
                        onClick={() => startEditMaterial(material)}
                      >
                        Editar
                      </button>
                      <button
                        className="link-button danger"
                        onClick={() => deleteMaterial(material.id)}
                      >
                        Eliminar
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {materials.length === 0 && (
              <tr>
                <td colSpan={6}>No hay materiales.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>Materiales por producto/servicio</h3>
        <div className="helper-text" style={{ marginBottom: "8px" }}>
          Define reglas de consumo (BOM) por producto/servicio. Ejemplo: Azulejo pared =
          perímetro × altura × factor + merma.
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <select
            className="form-select light"
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
          >
            <option value="">Selecciona producto/servicio</option>
            {productsForSector.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
          {selectedSectorId && (
            <span className="badge bg-secondary">
              {selectedSectorName || "Sector activo"}
            </span>
          )}
        </div>

        {selectedProductId && (
          <>
            <div
              style={{
                display: "grid",
                gap: "8px",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                marginTop: "12px",
              }}
            >
              <select
                className="form-select light"
                value={ruleForm.materialId}
                onChange={(e) =>
                  setRuleForm((prev) => ({ ...prev, materialId: e.target.value }))
                }
              >
                <option value="">Selecciona material</option>
                {materialsForProduct.map((material) => (
                  <option key={material.id} value={material.id}>
                    {material.name}
                  </option>
                ))}
              </select>
              <select
                className="form-select light"
                value={ruleForm.ruleType}
                onChange={(e) =>
                  setRuleForm((prev) => ({
                    ...prev,
                    ruleType: e.target.value as MaterialRuleType,
                  }))
                }
              >
                {ruleTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <input
                className="form-control light"
                type="number"
                placeholder="Factor"
                value={ruleForm.quantityFactor}
                onChange={(e) =>
                  setRuleForm((prev) => ({ ...prev, quantityFactor: e.target.value }))
                }
              />
              <input
                className="form-control light"
                type="number"
                placeholder="Merma %"
                value={ruleForm.wastePercent}
                onChange={(e) =>
                  setRuleForm((prev) => ({ ...prev, wastePercent: e.target.value }))
                }
              />
              <select
                className="form-select light"
                value={ruleForm.qualityTier}
                onChange={(e) =>
                  setRuleForm((prev) => ({ ...prev, qualityTier: e.target.value }))
                }
              >
                {qualityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button className="btn btn-primary" onClick={handleCreateRule}>
                Añadir regla
              </button>
            </div>

            <table className="table table-hover mt-3">
              <thead>
                <tr>
                  <th>Material</th>
                  <th>Regla</th>
                  <th>Factor</th>
                  <th>Merma %</th>
                  <th>Calidad</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule) => (
                  <tr key={rule.id}>
                    <td>
                      {editingRuleId === rule.id ? (
                        <select
                          className="form-select light"
                          value={editRuleForm.materialId}
                          onChange={(e) =>
                            setEditRuleForm((prev) => ({
                              ...prev,
                              materialId: e.target.value,
                            }))
                          }
                        >
                          {materialsForProduct.map((material) => (
                            <option key={material.id} value={material.id}>
                              {material.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        rule.materialName ?? rule.materialId
                      )}
                    </td>
                    <td>
                      {editingRuleId === rule.id ? (
                        <select
                          className="form-select light"
                          value={editRuleForm.ruleType}
                          onChange={(e) =>
                            setEditRuleForm((prev) => ({
                              ...prev,
                              ruleType: e.target.value as MaterialRuleType,
                            }))
                          }
                        >
                          {ruleTypeOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        ruleTypeOptions.find((opt) => opt.value === rule.ruleType)
                          ?.label ?? rule.ruleType
                      )}
                    </td>
                    <td>
                      {editingRuleId === rule.id ? (
                        <input
                          className="form-control light"
                          type="number"
                          value={editRuleForm.quantityFactor}
                          onChange={(e) =>
                            setEditRuleForm((prev) => ({
                              ...prev,
                              quantityFactor: e.target.value,
                            }))
                          }
                        />
                      ) : (
                        rule.quantityFactor ?? 1
                      )}
                    </td>
                    <td>
                      {editingRuleId === rule.id ? (
                        <input
                          className="form-control light"
                          type="number"
                          value={editRuleForm.wastePercent}
                          onChange={(e) =>
                            setEditRuleForm((prev) => ({
                              ...prev,
                              wastePercent: e.target.value,
                            }))
                          }
                        />
                      ) : (
                        rule.wastePercent ?? 0
                      )}
                    </td>
                    <td>
                      {editingRuleId === rule.id ? (
                        <select
                          className="form-select light"
                          value={editRuleForm.qualityTier}
                          onChange={(e) =>
                            setEditRuleForm((prev) => ({
                              ...prev,
                              qualityTier: e.target.value,
                            }))
                          }
                        >
                          {qualityOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        rule.qualityTier || "Todas"
                      )}
                    </td>
                    <td>
                      {editingRuleId === rule.id ? (
                        <>
                          <button
                            className="link-button"
                            onClick={() => saveEditRule(rule)}
                          >
                            Guardar
                          </button>
                          <button
                            className="link-button danger"
                            onClick={() => setEditingRuleId(null)}
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="link-button"
                            onClick={() => startEditRule(rule)}
                          >
                            Editar
                          </button>
                          <button
                            className="link-button danger"
                            onClick={() => deleteRule(rule.id)}
                          >
                            Eliminar
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                {rules.length === 0 && (
                  <tr>
                    <td colSpan={6}>No hay reglas aún.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </>
        )}
      </div>
    </section>
  );
}
