import { useEffect, useState } from "react";
import { productsService } from "../services/productsService";
import { quotesService } from "../services/quotesService";
import { OptionValue, Product, ProductOption } from "../types/product";
import { QuoteCalculationResponse } from "../types/quote";
import { sectorsService } from "../services/sectorsService";
import { Sector } from "../types/sector";

export default function Pricing() {
  const [products, setProducts] = useState<Product[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [options, setOptions] = useState<ProductOption[]>([]);
  const [valuesByOptionId, setValuesByOptionId] = useState<Record<string, OptionValue[]>>({});
  const [optionValues, setOptionValues] = useState<Record<string, string>>({});
  const [result, setResult] = useState<QuoteCalculationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadProducts() {
    try {
      const data = await productsService.list("");
      setProducts(data);
      if (!selectedProductId && data.length > 0) {
        setSelectedProductId(data[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando productos/servicios");
    }
  }

  async function loadSectors() {
    try {
      const data = await sectorsService.list("");
      setSectors(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando sectores");
    }
  }

  async function loadOptions(productId: string) {
    try {
      const data = await productsService.listOptions("", productId);
      setOptions(data);
      const valuesMap: Record<string, OptionValue[]> = {};
      for (const option of data) {
        if (option.optionType === "SELECT") {
          valuesMap[option.id] = await productsService.listOptionValues("", option.id);
        }
      }
      setValuesByOptionId(valuesMap);
      setOptionValues({});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando opciones");
    }
  }

  useEffect(() => {
    loadProducts();
    loadSectors();
  }, []);

  useEffect(() => {
    if (selectedProductId) {
      loadOptions(selectedProductId);
    }
  }, [selectedProductId]);

  async function handleCalculate() {
    if (!selectedProductId) return;
    setError(null);
    setLoading(true);
    try {
      const requiredMissing = options.filter((option) => option.required && !optionValues[option.id]);
      if (requiredMissing.length > 0) {
        setError(`Faltan opciones obligatorias: ${requiredMissing.map((o) => o.name).join(", ")}`);
        setLoading(false);
        return;
      }
      const response = await quotesService.calculate("", {
        productId: selectedProductId,
        quantity: Math.max(1, Number(quantity)),
        options: optionValues,
      });
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error calculando precio");
    } finally {
      setLoading(false);
    }
  }

  const selectedProduct = products.find((p) => p.id === selectedProductId) ?? null;
  const selectedSectorName =
    sectors.find((s) => s.id === selectedProduct?.sectorId)?.name ?? selectedProduct?.sectorName ?? "-";

  return (
    <section>
      <h2>Pricing</h2>
      <p>
        Aquí configuras y pruebas el motor de precios. Selecciona un producto/servicio y simula el cálculo con
        cantidad y opciones para validar el total y el breakdown.
      </p>
      {error && <div className="auth-error">{error}</div>}

      <div className="card" style={{ marginBottom: "16px" }}>
        <h3>Simulador</h3>
        <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          <label>
            Producto/Servicio
            <select
              className="form-select light"
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
            >
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Cantidad
            <input
              className="form-control light"
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </label>
          <div>
            <div>Sector: {selectedSectorName}</div>
            <div>Pricing: {selectedProduct?.pricingType ?? "-"}</div>
            <div>Base price: {selectedProduct?.basePrice ?? 0}</div>
          </div>
        </div>

        {options.length > 0 && (
          <div style={{ marginTop: "12px", display: "grid", gap: "8px" }}>
            {options.map((option) => {
              const currentValue = optionValues[option.id] ?? "";
              if (option.optionType === "SELECT") {
                const values = valuesByOptionId[option.id] ?? [];
                return (
                  <label key={option.id}>
                    {option.name} {option.required ? "*" : ""}
                    <select
                      className="form-select light"
                      value={currentValue}
                      onChange={(e) =>
                        setOptionValues((prev) => ({ ...prev, [option.id]: e.target.value }))
                      }
                    >
                      <option value="">Selecciona</option>
                      {values.map((value) => (
                        <option key={value.id} value={value.value ?? ""}>
                          {value.value}
                        </option>
                      ))}
                    </select>
                  </label>
                );
              }
              if (option.optionType === "NUMBER") {
                return (
                  <label key={option.id}>
                    {option.name} {option.required ? "*" : ""}
                    <input
                      className="form-control light"
                      type="number"
                      value={currentValue}
                      onChange={(e) =>
                        setOptionValues((prev) => ({ ...prev, [option.id]: e.target.value }))
                      }
                    />
                  </label>
                );
              }
              return (
                <label key={option.id}>
                  {option.name} {option.required ? "*" : ""}
                  <select
                    className="form-select light"
                    value={currentValue}
                    onChange={(e) =>
                      setOptionValues((prev) => ({ ...prev, [option.id]: e.target.value }))
                    }
                  >
                    <option value="">Selecciona</option>
                    <option value="true">true</option>
                    <option value="false">false</option>
                  </select>
                </label>
              );
            })}
          </div>
        )}

        <button onClick={handleCalculate} style={{ marginTop: "12px" }} disabled={loading || !selectedProductId}>
          {loading ? "Calculando..." : "Calcular"}
        </button>
      </div>

      {result && (
        <div className="card">
          <h3>Resultado</h3>
          <div>Total: {result.totalPrice ?? 0}</div>
          <div>Base: {result.breakdown?.basePrice ?? 0}</div>
          <div>Modifiers: {result.breakdown?.modifiers ?? 0}</div>
          <div>Final: {result.breakdown?.total ?? 0}</div>
        </div>
      )}
    </section>
  );
}
