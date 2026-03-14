import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { productsService } from "../services/productsService";
import { sectorsService } from "../services/sectorsService";
import { formulasService } from "../services/formulasService";
import {
  OptionType,
  Product,
  ProductOption,
  OptionValue,
  PricingType,
} from "../types/product";
import { Sector } from "../types/sector";
import { Formula } from "../types/formula";
import IconInfo from "../components/icons/IconInfo";
import IconEdit from "../components/icons/IconEdit";
import IconTrash from "../components/icons/IconTrash";
import { aiProfileService } from "../services/aiProfileService";
import { AiProfile } from "../types/ai";

export default function Products() {
  const PRODUCT_SECTOR_KEY = "presup_products_sector";
  const [products, setProducts] = useState<Product[]>([]);
  const [options, setOptions] = useState<ProductOption[]>([]);
  const [values, setValues] = useState<OptionValue[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [aiProfiles, setAiProfiles] = useState<AiProfile[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedOptionId, setSelectedOptionId] = useState<string>("");
  const [aiProfile, setAiProfile] = useState<AiProfile | null>(null);
  const [aiProfileLoaded, setAiProfileLoaded] = useState(false);
  const [aiProfileForm, setAiProfileForm] = useState({
    requiredOptionNames: [] as string[],
    promptInstructions: "",
    quantityLabel: "",
    active: true,
  });
  const [sectorFilter, setSectorFilter] = useState(
    () => localStorage.getItem(PRODUCT_SECTOR_KEY) ?? "",
  );
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingOptionId, setEditingOptionId] = useState<string | null>(null);
  const [editingValueId, setEditingValueId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    basePrice: "0",
    active: true,
  });
  const [editOptionForm, setEditOptionForm] = useState({
    name: "",
    optionType: "SELECT" as OptionType,
    required: true,
  });
  const [editValueForm, setEditValueForm] = useState({
    value: "",
    priceModifier: "0",
  });

  const [name, setName] = useState("");
  const [sectorId, setSectorId] = useState(
    () => localStorage.getItem(PRODUCT_SECTOR_KEY) ?? "",
  );
  const [pricingSelection, setPricingSelection] = useState("UNIT");
  const [basePrice, setBasePrice] = useState("0");

  const [optionName, setOptionName] = useState("");
  const [optionType, setOptionType] = useState<OptionType>("SELECT");
  const [optionRequired, setOptionRequired] = useState(true);

  const [valueText, setValueText] = useState("");
  const [valueModifier, setValueModifier] = useState("0");

  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastError, setToastError] = useState<string | null>(null);
  const [showFormulaModal, setShowFormulaModal] = useState(false);
  const [formulaForm, setFormulaForm] = useState({
    id: "",
    sectorId: "",
    productId: "",
    name: "",
    description: "",
    basePrice: "0",
    unitPrice: "0",
    active: true,
  });

  async function loadProducts() {
    try {
      const data = await productsService.list("");
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando productos/servicios");
    }
  }

  async function loadSectors() {
    try {
      const data = await sectorsService.list("");
      setSectors(data);
      if (!sectorId && data.length > 0) {
        const active = data.find((s) => s.active);
        const nextId = active?.id ?? "";
        setSectorId(nextId);
        setSectorFilter(nextId);
        if (nextId) {
          localStorage.setItem(PRODUCT_SECTOR_KEY, nextId);
        }
      } else if (sectorId && !data.find((s) => s.id === sectorId)) {
        const active = data.find((s) => s.active);
        const nextId = active?.id ?? "";
        setSectorId(nextId);
        setSectorFilter(nextId);
        if (nextId) {
          localStorage.setItem(PRODUCT_SECTOR_KEY, nextId);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando sectores");
    }
  }

  async function loadFormulas() {
    try {
      const data = await formulasService.list("");
      setFormulas(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando formulas");
    }
  }

  function getDefaultQuantityLabel(sectorName: string, productName: string) {
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

  async function loadOptions(productId: string) {
    try {
      const data = await productsService.listOptions("", productId);
      setOptions(data);
      const nextOptionId =
        data.find((option) => option.id === selectedOptionId)?.id ??
        data[0]?.id ??
        "";
      setSelectedOptionId(nextOptionId);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando opciones");
    }
    return [];
  }

  async function loadAiProfiles() {
    try {
      const data = await aiProfileService.list("");
      setAiProfiles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando perfiles AI");
    }
  }

  async function loadAiProfile(productId: string) {
    const product = products.find((item) => item.id === productId);
    if (!product) {
      setAiProfile(null);
      setAiProfileLoaded(true);
      return;
    }
    try {
      const profile =
        (await aiProfileService.resolve("", product.sectorId, productId)) ??
        null;
      setAiProfile(profile);
      if (profile) {
        setAiProfileForm({
          requiredOptionNames: profile.requiredOptionNames ?? [],
          promptInstructions: profile.promptInstructions ?? "",
          quantityLabel: profile.quantityLabel ?? "",
          active: profile.active ?? true,
        });
      } else {
        const sectorName =
          sectors.find((sector) => sector.id === product.sectorId)?.name ?? "";
        const defaultLabel = getDefaultQuantityLabel(
          sectorName,
          product.name ?? "",
        );
        setAiProfileForm({
          requiredOptionNames: [],
          promptInstructions: "",
          quantityLabel: defaultLabel,
          active: true,
        });
      }
      setAiProfileLoaded(true);
    } catch {
      setAiProfile(null);
      setAiProfileLoaded(true);
    }
  }

  async function syncAiProfileForProduct(
    productId: string,
    nextOptions?: ProductOption[],
  ) {
    const product = products.find((item) => item.id === productId);
    if (!product?.sectorId) return;
    const optionList = nextOptions ?? options;
    const optionNames = optionList
      .map((option) => option.name ?? "")
      .map((name) => name.trim())
      .filter(Boolean);
    const requiredFromOptions = optionList
      .filter((option) => option.required)
      .map((option) => option.name ?? "")
      .map((name) => name.trim())
      .filter(Boolean);

    let profile = aiProfile;
    if (!profile || profile.productId !== productId) {
      profile = (await aiProfileService.resolve("", product.sectorId, productId)) ?? null;
    }

    if (!profile && requiredFromOptions.length === 0) {
      return;
    }

    const existingNames = profile?.requiredOptionNames ?? [];
    const merged = Array.from(
      new Set([...existingNames, ...requiredFromOptions]),
    )
      .map((name) => name.trim())
      .filter((name) => name.length > 0)
      .filter((name) => optionNames.includes(name));

    const payload = {
      sectorId: product.sectorId,
      productId,
      requiredOptionNames: merged,
      promptInstructions: profile?.promptInstructions ?? undefined,
      quantityLabel: profile?.quantityLabel ?? undefined,
      active: profile?.active ?? true,
    };

    try {
      if (profile?.id) {
        const updated = await aiProfileService.update("", profile.id, payload);
        setAiProfile(updated);
      } else {
        const created = await aiProfileService.create("", payload);
        setAiProfile(created);
      }
      setAiProfileForm((prev) => ({
        ...prev,
        requiredOptionNames: merged,
      }));
      await loadAiProfiles();
    } catch {
      // ignore sync errors to avoid blocking option editing
    }
  }

  async function loadValues(optionId: string) {
    try {
      const data = await productsService.listOptionValues("", optionId);
      setValues(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando valores");
    }
  }

  useEffect(() => {
    loadProducts();
    loadSectors();
    loadFormulas();
    loadAiProfiles();
  }, []);

  useEffect(() => {
    if (selectedProductId) {
      loadOptions(selectedProductId);
      setAiProfile(null);
      setAiProfileLoaded(false);
      loadAiProfile(selectedProductId);
      setEditingOptionId(null);
      setEditingValueId(null);
    } else {
      setOptions([]);
      setSelectedOptionId("");
      setValues([]);
      setAiProfile(null);
      setAiProfileLoaded(false);
      setAiProfileForm({
        requiredOptionNames: [],
        promptInstructions: "",
        quantityLabel: "",
        active: true,
      });
    }
  }, [selectedProductId]);

  useEffect(() => {
    if (selectedOptionId) {
      loadValues(selectedOptionId);
    } else {
      setValues([]);
    }
    setEditingValueId(null);
  }, [selectedOptionId]);

  useEffect(() => {
    if (!selectedProductId || !aiProfileLoaded || aiProfile) return;
    if (aiProfileForm.requiredOptionNames.length > 0) return;
    const defaultRequired = options
      .filter((option) => option.required)
      .map((option) => option.name ?? "")
      .filter((name) => name.trim().length > 0);
    if (defaultRequired.length) {
      setAiProfileForm((prev) => ({
        ...prev,
        requiredOptionNames: defaultRequired,
      }));
    }
  }, [
    selectedProductId,
    aiProfileLoaded,
    aiProfile,
    options,
    aiProfileForm.requiredOptionNames.length,
  ]);

  useEffect(() => {
    setSectorFilter(sectorId);
  }, [sectorId]);

  useEffect(() => {
    if (pricingSelection.startsWith("FORMULA:")) {
      const formulaId = pricingSelection.replace("FORMULA:", "");
      if (!formulasForSector.find((formula) => formula.id === formulaId)) {
        setPricingSelection("UNIT");
      }
    }
  }, [sectorId, formulas]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => {
      setToastMessage(null);
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  useEffect(() => {
    if (!toastError) return;
    const timer = window.setTimeout(() => {
      setToastError(null);
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [toastError]);

  const filteredProducts = sectorFilter
    ? products.filter((product) => (product.sectorId ?? "") === sectorFilter)
    : products;

  const aiProfileByProductId = new Map(
    aiProfiles
      .filter((profile) => profile.productId)
      .map((profile) => [profile.productId as string, profile]),
  );

  useEffect(() => {
    if (!selectedProductId) return;
    if (!filteredProducts.find((product) => product.id === selectedProductId)) {
      setSelectedProductId("");
      setOptions([]);
      setSelectedOptionId("");
      setValues([]);
    }
  }, [filteredProducts, selectedProductId]);

  const isFormulaSelection = pricingSelection.startsWith("FORMULA:");
  const selectedFormulaId = isFormulaSelection
    ? pricingSelection.replace("FORMULA:", "")
    : undefined;
  const pricingType: PricingType = isFormulaSelection
    ? "FORMULA"
    : (pricingSelection as PricingType);
  const formulasForSector = sectorId
    ? formulas.filter((formula) => formula.sectorId === sectorId)
    : [];
  const canCreateProduct = name.trim().length > 0 && !!sectorId;

  async function handleCreateProduct() {
    setError(null);
    try {
      await productsService.create("", {
        name,
        sectorId: sectorId || undefined,
        pricingType,
        formulaId: selectedFormulaId,
        basePrice: pricingType === "FORMULA" ? undefined : Number(basePrice),
        active: true,
      });
      setName("");
      setBasePrice("0");
      await loadProducts();
      setToastMessage("Producto/servicio creado correctamente.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creando producto/servicio");
    }
  }

  function startEditRow(product: Product) {
    setEditingProductId(product.id);
    setEditForm({
      name: product.name ?? "",
      basePrice: String(product.basePrice ?? 0),
      active: product.active,
    });
  }

  function cancelEditRow() {
    setEditingProductId(null);
  }

  async function saveEditRow(product: Product) {
    setError(null);
    try {
      await productsService.update("", product.id, {
        name: editForm.name,
        basePrice:
          product.pricingType === "FORMULA"
            ? undefined
            : Number(editForm.basePrice),
        active: editForm.active,
      });
      setEditingProductId(null);
      await loadProducts();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error actualizando producto/servicio",
      );
    }
  }

  async function handleDeleteProduct(product: Product) {
    if (!window.confirm("¿Eliminar este producto/servicio?")) {
      return;
    }
    setError(null);
    try {
      await productsService.remove("", product.id);
      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error eliminando producto/servicio");
    }
  }

  function resetFormulaForm() {
    setFormulaForm({
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

  function startEditFormula(formula: Formula) {
    setFormulaForm({
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

  async function handleSaveFormula() {
    setError(null);
    try {
      const payload = {
        sectorId: formulaForm.sectorId,
        productId: formulaForm.productId || undefined,
        name: formulaForm.name,
        description: formulaForm.description || undefined,
        basePrice: Number(formulaForm.basePrice),
        unitPrice: Number(formulaForm.unitPrice),
        active: formulaForm.active,
      };
      if (formulaForm.id) {
        await formulasService.update("", formulaForm.id, payload);
      } else {
        await formulasService.create("", payload);
      }
      await loadFormulas();
      resetFormulaForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error guardando formula");
    }
  }

  async function handleDeleteFormula(id: string) {
    if (!window.confirm("¿Eliminar esta fórmula?")) {
      return;
    }
    setError(null);
    try {
      await formulasService.remove("", id);
      await loadFormulas();
      if (pricingSelection === `FORMULA:${id}`) {
        setPricingSelection("UNIT");
      }
      if (formulaForm.id === id) {
        resetFormulaForm();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error eliminando formula");
    }
  }

  async function handleCreateOption() {
    if (!selectedProductId) return;
    setError(null);
    try {
      await productsService.createOption("", selectedProductId, {
        name: optionName,
        optionType,
        required: optionRequired,
      });
      setOptionName("");
      const nextOptions = await loadOptions(selectedProductId);
      await syncAiProfileForProduct(selectedProductId, nextOptions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creando opcion");
    }
  }

  async function handleCreateValue() {
    if (!selectedOptionId || options.length === 0 || !valueText.trim()) return;
    setError(null);
    try {
      const normalizedValue = valueText.trim().toLowerCase();
      const modifierNumber = Number(valueModifier);
      const duplicate = values.some(
        (value) =>
          (value.value ?? "").trim().toLowerCase() === normalizedValue,
      );
      if (duplicate) {
        setToastError("Ya existe un valor con ese nombre.");
        return;
      }
      await productsService.createOptionValue("", selectedOptionId, {
        value: valueText,
        priceModifier: modifierNumber,
      });
      setValueText("");
      setValueModifier("0");
      await loadValues(selectedOptionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creando valor");
    }
  }

  function startEditOption(option: ProductOption) {
    setEditingOptionId(option.id);
    setEditOptionForm({
      name: option.name ?? "",
      optionType: option.optionType ?? "SELECT",
      required: option.required,
    });
  }

  function cancelEditOption() {
    setEditingOptionId(null);
  }

  async function saveEditOption(option: ProductOption) {
    setError(null);
    try {
      await productsService.updateOption("", option.id, {
        name: editOptionForm.name,
        optionType: editOptionForm.optionType,
        required: editOptionForm.required,
      });
      setEditingOptionId(null);
      const nextOptions = await loadOptions(option.productId);
      await syncAiProfileForProduct(option.productId, nextOptions);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error actualizando opcion",
      );
    }
  }

  async function handleDeleteOption(option: ProductOption) {
    if (!window.confirm("¿Eliminar esta opción?")) {
      return;
    }
    setError(null);
    try {
      await productsService.removeOption("", option.id);
      if (selectedOptionId === option.id) {
        setSelectedOptionId("");
      }
      const nextOptions = await loadOptions(option.productId);
      await syncAiProfileForProduct(option.productId, nextOptions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error eliminando opcion");
    }
  }

  function startEditValue(value: OptionValue) {
    setEditingValueId(value.id);
    setEditValueForm({
      value: value.value ?? "",
      priceModifier: String(value.priceModifier ?? 0),
    });
  }

  function cancelEditValue() {
    setEditingValueId(null);
  }

  async function saveEditValue(value: OptionValue) {
    setError(null);
    try {
      await productsService.updateOptionValue("", value.id, {
        value: editValueForm.value,
        priceModifier: Number(editValueForm.priceModifier),
      });
      setEditingValueId(null);
      if (selectedOptionId) {
        await loadValues(selectedOptionId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error actualizando valor");
    }
  }

  async function handleDeleteValue(value: OptionValue) {
    if (!window.confirm("¿Eliminar este valor?")) {
      return;
    }
    setError(null);
    try {
      await productsService.removeOptionValue("", value.id);
      if (selectedOptionId) {
        await loadValues(selectedOptionId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error eliminando valor");
    }
  }

  function toggleAiRequiredOption(name: string) {
    setAiProfileForm((prev) => {
      const exists = prev.requiredOptionNames.includes(name);
      const next = exists
        ? prev.requiredOptionNames.filter((item) => item !== name)
        : [...prev.requiredOptionNames, name];
      return { ...prev, requiredOptionNames: next };
    });
  }

  async function handleSaveAiProfile() {
    if (!selectedProductId) return;
    const product = products.find((item) => item.id === selectedProductId);
    if (!product?.sectorId) {
      setToastError("Selecciona un sector válido para el producto/servicio.");
      return;
    }
    setError(null);
    try {
      const payload = {
        sectorId: product.sectorId,
        productId: selectedProductId,
      requiredOptionNames: aiProfileForm.requiredOptionNames,
      promptInstructions: aiProfileForm.promptInstructions || undefined,
      quantityLabel: aiProfileForm.quantityLabel || undefined,
      active: aiProfileForm.active,
    };
      if (aiProfile?.id) {
        const updated = await aiProfileService.update(
          "",
          aiProfile.id,
          payload,
        );
        setAiProfile(updated);
      } else {
        const created = await aiProfileService.create("", payload);
        setAiProfile(created);
      }
      await loadAiProfiles();
      setToastMessage("Perfil AI guardado.");
    } catch (err) {
      setToastError(
        err instanceof Error ? err.message : "Error guardando perfil AI",
      );
    }
  }

  async function handleDeleteAiProfile() {
    if (!aiProfile?.id) return;
    if (!window.confirm("¿Eliminar perfil AI de este producto/servicio?")) {
      return;
    }
    try {
      await aiProfileService.remove("", aiProfile.id);
      setAiProfile(null);
      setAiProfileForm({
        requiredOptionNames: [],
        promptInstructions: "",
        quantityLabel: "",
        active: true,
      });
      await loadAiProfiles();
      setToastMessage("Perfil AI eliminado.");
    } catch (err) {
      setToastError(
        err instanceof Error ? err.message : "Error eliminando perfil AI",
      );
    }
  }

  return (
    <section>
      <h2>Productos/Servicios</h2>
      <p>
        Aquí defines el catálogo interno. Crea productos/servicios, asigna sector, tipo de
        pricing y precio base. Después puedes añadir opciones y valores para
        personalizar cada presupuesto.
      </p>
      <div className="card" style={{ marginBottom: "16px" }}>
        <h3>Nuevo producto/servicio</h3>
        <p className="helper-text">
          Al seleccionar una regla/fórmula, la casilla de precio base se
          desactiva pues la fórmula ya contiene el precio.
        </p>
        <div
          style={{
            display: "grid",
            gap: "8px",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          }}
        >
          <label className="form-field">
            <span>Nombre</span>
            <input
              className="form-control light"
              placeholder="Nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="form-field">
            <span>Sector</span>
            <select
              className="form-select light"
              value={sectorId}
              onChange={(e) => {
                const value = e.target.value;
                setSectorId(value);
                setSectorFilter(value);
                if (value) {
                  localStorage.setItem(PRODUCT_SECTOR_KEY, value);
                } else {
                  localStorage.removeItem(PRODUCT_SECTOR_KEY);
                }
              }}
            >
              <option value="">Sin sector</option>
              {sectors
                .filter((s) => s.active)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
            </select>
          </label>
          <div className="form-field">
            <div className="link-with-tooltip">
              <button
                type="button"
                className="btn btn-link p-0 text-start ghost-link"
                onClick={() => setShowFormulaModal(true)}
              >
                Definir fórmula
              </button>
              <span
                className="info-tooltip"
                data-tooltip="Crea o edita fórmulas para calcular precios automáticamente."
                aria-label="Información sobre definir fórmula"
                tabIndex={0}
              >
                <IconInfo />
              </span>
            </div>
            <select
              className="form-select light"
              value={pricingSelection}
              onChange={(e) => setPricingSelection(e.target.value)}
            >
              <option value="FIXED">FIXED</option>
              <option value="UNIT">UNIT</option>
              {formulasForSector.map((formula) => (
                <option key={formula.id} value={`FORMULA:${formula.id}`}>
                  FORMULA · {formula.name}
                </option>
              ))}
            </select>
          </div>
          <label className="form-field">
            <span>Base price</span>
            <input
              className={`form-control light ${pricingType === "FORMULA" ? "ghost-field" : ""}`}
              type="number"
              placeholder="Base price"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              disabled={pricingType === "FORMULA"}
            />
          </label>
          <div className="form-field">
            <span>&nbsp;</span>
            <button onClick={handleCreateProduct} disabled={!canCreateProduct}>
              Crear
            </button>
          </div>
        </div>
        {error && <div className="auth-error">{error}</div>}

        <hr style={{ marginTop: "20px", marginBottom: "16px" }} />
        <div className="row g-3">
          <div className="col-md-6">
            <h3>Opciones del producto/servicio</h3>
            <p className="helper-text">
              Primero selecciona un producto/servicio. Después crea sus opciones para
              personalizar el presupuesto (formato, papel, etc.).
            </p>
            <select
              className="form-select light"
              value={selectedProductId}
              onChange={(e) => {
                setSelectedProductId(e.target.value);
                setSelectedOptionId("");
              }}
            >
              <option value="">Selecciona producto/servicio</option>
              {filteredProducts.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
            <div
              style={{
                display: "grid",
                gap: "8px",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                marginTop: "12px",
              }}
            >
              <input
                className="form-control light"
                placeholder="Nombre opcion"
                value={optionName}
                onChange={(e) => setOptionName(e.target.value)}
              />
              <select
                className="form-select light"
                value={optionType}
                onChange={(e) => setOptionType(e.target.value as OptionType)}
              >
                <option value="SELECT">SELECT</option>
                <option value="NUMBER">NUMBER</option>
                <option value="BOOLEAN">BOOLEAN</option>
              </select>
              <select
                className="form-select light"
                value={optionRequired ? "yes" : "no"}
                onChange={(e) => setOptionRequired(e.target.value === "yes")}
              >
                <option value="yes">Required</option>
                <option value="no">Optional</option>
              </select>
              <button onClick={handleCreateOption} disabled={!selectedProductId}>
                Crear opcion
              </button>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Tipo</th>
                  <th>Required</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {!selectedProductId ? (
                  <tr>
                    <td colSpan={4}>Selecciona un producto/servicio</td>
                  </tr>
                ) : options.length === 0 ? (
                  <tr>
                    <td colSpan={4}>Sin opciones</td>
                  </tr>
                ) : (
                  options.map((option) => (
                    <tr
                      key={option.id}
                      onClick={() => setSelectedOptionId(option.id)}
                      style={{ cursor: "pointer" }}
                    >
                      <td>
                        {editingOptionId === option.id ? (
                          <input
                            className="form-control light"
                            value={editOptionForm.name}
                            onChange={(e) =>
                              setEditOptionForm((prev) => ({
                                ...prev,
                                name: e.target.value,
                              }))
                            }
                          />
                        ) : (
                          option.name
                        )}
                      </td>
                      <td>
                        {editingOptionId === option.id ? (
                          <select
                            className="form-select light"
                            value={editOptionForm.optionType}
                            onChange={(e) =>
                              setEditOptionForm((prev) => ({
                                ...prev,
                                optionType: e.target.value as OptionType,
                              }))
                            }
                          >
                            <option value="SELECT">SELECT</option>
                            <option value="NUMBER">NUMBER</option>
                            <option value="BOOLEAN">BOOLEAN</option>
                          </select>
                        ) : (
                          option.optionType
                        )}
                      </td>
                      <td>
                        {editingOptionId === option.id ? (
                          <select
                            className="form-select light"
                            value={editOptionForm.required ? "yes" : "no"}
                            onChange={(e) =>
                              setEditOptionForm((prev) => ({
                                ...prev,
                                required: e.target.value === "yes",
                              }))
                            }
                          >
                            <option value="yes">Required</option>
                            <option value="no">Optional</option>
                          </select>
                        ) : option.required ? (
                          "Si"
                        ) : (
                          "No"
                        )}
                      </td>
                      <td>
                        <div className="row-actions">
                          {editingOptionId === option.id ? (
                            <>
                              <button
                                className="btn btn-outline-dark btn-sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  saveEditOption(option);
                                }}
                              >
                                Guardar
                              </button>
                              <button
                                className="btn btn-outline-dark btn-sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  cancelEditOption();
                                }}
                              >
                                Cancelar
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                className="icon-button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditOption(option);
                                }}
                                aria-label="Editar"
                                title="Editar"
                              >
                                <IconEdit />
                              </button>
                              <button
                                className="icon-button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteOption(option);
                                }}
                                aria-label="Eliminar"
                                title="Eliminar"
                              >
                                <IconTrash />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {selectedProductId && (
              <div style={{ marginTop: "16px" }}>
                <h3>Perfil AI del producto/servicio</h3>
                <p className="helper-text">
                  Define qué opciones son obligatorias para que la IA complete
                  correctamente los presupuestos de este producto/servicio.
                </p>
                {options.length === 0 ? (
                  <div className="helper-text">
                    Este producto/servicio no tiene opciones aún.
                  </div>
                ) : (
                  <div className="checkbox-grid">
                    {options.map((option) => (
                      <label key={option.id} className="checkbox-item">
                        <input
                          type="checkbox"
                          checked={aiProfileForm.requiredOptionNames.includes(
                            option.name ?? "",
                          )}
                          onChange={() =>
                            toggleAiRequiredOption(option.name ?? "")
                          }
                        />
                        <span>{option.name}</span>
                      </label>
                    ))}
                  </div>
                )}
                <label className="form-field" style={{ marginTop: "12px" }}>
                  Instrucciones adicionales (opcional)
                  <textarea
                    className="form-control light"
                    rows={3}
                    value={aiProfileForm.promptInstructions}
                    onChange={(e) =>
                      setAiProfileForm((prev) => ({
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
                    value={aiProfileForm.quantityLabel}
                    onChange={(e) =>
                      setAiProfileForm((prev) => ({
                        ...prev,
                        quantityLabel: e.target.value,
                      }))
                    }
                    placeholder="Ej: horas, visitas, m²"
                  />
                  <p className="helper-text">
                    Sirve para que la IA pregunte la cantidad con sentido (por
                    ejemplo “¿Cuántas horas necesitas?”).
                  </p>
                </label>
                <label className="form-field" style={{ marginTop: "8px" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <input
                      type="checkbox"
                      checked={aiProfileForm.active}
                      onChange={(e) =>
                        setAiProfileForm((prev) => ({
                          ...prev,
                          active: e.target.checked,
                        }))
                      }
                    />
                    Perfil activo
                  </span>
                </label>
                <div className="button-row" style={{ marginTop: "8px" }}>
                  <button
                    className="btn btn-primary"
                    onClick={handleSaveAiProfile}
                  >
                    Guardar perfil AI
                  </button>
                  {aiProfile?.id && (
                    <button
                      className="btn btn-outline-dark"
                      onClick={handleDeleteAiProfile}
                    >
                      Eliminar perfil
                    </button>
                  )}
                </div>
              </div>
            )}

            {selectedProductId && (
              <div style={{ marginTop: "16px" }}>
                <h3>Materiales del producto/servicio</h3>
                <p className="helper-text">
                  Para reformas, crea opciones numéricas como “m² suelo”,
                  “perímetro” o “altura”. Luego define las reglas de materiales
                  del producto/servicio.
                </p>
                <p className="helper-text">
                  Para asociar materiales a un producto/servicio para su presupuesto,
                  debes crear estas opciones como NUMBER (obligatorias): m2 suelo,
                  perimetro, altura.
                </p>
                <p className="helper-text">Instrucciones rápidas:</p>
                <p className="helper-text">
                  1. Crea las opciones NUMBER obligatorias: m2 suelo, perimetro, altura.
                </p>
                <p className="helper-text">
                  2. Ve al menú Materiales y añade reglas de materiales para este producto/servicio.
                </p>
                <button
                  className="btn btn-outline-dark"
                  style={{ marginTop: "8px" }}
                  onClick={() => (window.location.href = "/materials")}
                >
                  Ir a materiales del sector actual
                </button>
                <Link
                  to={`/materials?productId=${selectedProductId}`}
                  style={{ color: "#000", textDecoration: "underline" }}
                >
                  Configurar materiales del producto/servicio
                </Link>
              </div>
            )}
          </div>
          <div className="col-md-6">
            <h3>Valores de opcion</h3>
            <p className="helper-text">
              Selecciona una opción y crea los valores permitidos (por ejemplo,
              Tapa blanda o Tapa dura) con su modificador.
            </p>
            <p className="helper-text">
              Por ejemplo, Número de páginas no se crean valores, porque es un
              número libre.
            </p>
            <p className="helper-text">
              Para opciones BOOLEAN, crea un valor “Sí” con su modificador
              (ej: Con ventanas → Sí → +8).
            </p>
            <div
              style={{
                display: "grid",
                gap: "8px",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              }}
            >
              <select
                className="form-select light"
                value={selectedOptionId}
                onChange={(e) => setSelectedOptionId(e.target.value)}
              >
                <option value="">
                  {options.length === 0 ? "Sin opciones" : "Selecciona opción"}
                </option>
                {options
                  .filter((option) => option.optionType !== "NUMBER")
                  .map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
              </select>
              <input
                className="form-control light"
                placeholder="Valor (ej: 90g)"
                value={valueText}
                onChange={(e) => setValueText(e.target.value)}
              />
              <input
                className="form-control light"
                type="number"
                placeholder="Modifier"
                value={valueModifier}
                onChange={(e) => setValueModifier(e.target.value)}
              />
              <button
                onClick={handleCreateValue}
                disabled={
                  !selectedOptionId || options.length === 0 || !valueText.trim()
                }
              >
                Crear valor
              </button>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Value</th>
                  <th>Modifier</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {!selectedOptionId ? (
                  <tr>
                    <td colSpan={3}>Selecciona una opción</td>
                  </tr>
                ) : values.length === 0 ? (
                  <tr>
                    <td colSpan={3}>Sin valores</td>
                  </tr>
                ) : (
                  values.map((value) => (
                    <tr key={value.id}>
                      <td>
                        {editingValueId === value.id ? (
                          <input
                            className="form-control light"
                            value={editValueForm.value}
                            onChange={(e) =>
                              setEditValueForm((prev) => ({
                                ...prev,
                                value: e.target.value,
                              }))
                            }
                          />
                        ) : (
                          value.value
                        )}
                      </td>
                      <td>
                        {editingValueId === value.id ? (
                          <input
                            className="form-control light"
                            type="number"
                            value={editValueForm.priceModifier}
                            onChange={(e) =>
                              setEditValueForm((prev) => ({
                                ...prev,
                                priceModifier: e.target.value,
                              }))
                            }
                          />
                        ) : (
                          value.priceModifier ?? 0
                        )}
                      </td>
                      <td>
                        <div className="row-actions">
                          {editingValueId === value.id ? (
                            <>
                              <button
                                className="btn btn-outline-dark btn-sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  saveEditValue(value);
                                }}
                              >
                                Guardar
                              </button>
                              <button
                                className="btn btn-outline-dark btn-sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  cancelEditValue();
                                }}
                              >
                                Cancelar
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                className="icon-button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditValue(value);
                                }}
                                aria-label="Editar"
                                title="Editar"
                              >
                                <IconEdit />
                              </button>
                              <button
                                className="icon-button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteValue(value);
                                }}
                                aria-label="Eliminar"
                                title="Eliminar"
                              >
                                <IconTrash />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: "16px", marginBottom: "12px" }}>
        <label>
          Filtrar por sector
          <select
            className="form-select light"
            value={sectorFilter}
            onChange={(e) => {
              const value = e.target.value;
              setSectorFilter(value);
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
      </div>

      <table className="table table-hover">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Sector</th>
            <th>Fórmula pricing</th>
            <th>Base price</th>
            <th>Perfil AI</th>
            <th>Activo</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filteredProducts.length === 0 ? (
            <tr>
              <td colSpan={7}>Sin datos</td>
            </tr>
          ) : (
            filteredProducts.map((product) => (
              <tr
                key={product.id}
                className={`product-row ${
                  editingProductId === product.id ? "editing" : ""
                }`}
                onDoubleClick={() => startEditRow(product)}
              >
                <td>
                  {editingProductId === product.id ? (
                    <input
                      className="form-control light"
                      value={editForm.name}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                    />
                  ) : (
                    product.name
                  )}
                </td>
                <td>
                  {product.sectorName ??
                    sectors.find((s) => s.id === product.sectorId)?.name ??
                    "-"}
                </td>
                <td>
                  {product.pricingType === "FORMULA"
                    ? `FORMULA · ${product.formulaName ?? "Sin nombre"}`
                    : product.pricingType}
                </td>
                <td>
                  {editingProductId === product.id ? (
                    <input
                      className={`form-control light ${
                        product.pricingType === "FORMULA" ? "ghost-field" : ""
                      }`}
                      type="number"
                      value={editForm.basePrice}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          basePrice: e.target.value,
                        }))
                      }
                      disabled={product.pricingType === "FORMULA"}
                    />
                  ) : product.pricingType === "FORMULA" ? (
                    "-"
                  ) : (
                    product.basePrice ?? 0
                  )}
                </td>
                <td>
                  {(() => {
                    const profile = aiProfileByProductId.get(product.id);
                    if (!profile) {
                      return <span className="helper-text">Sin perfil</span>;
                    }
                    const required =
                      profile.requiredOptionNames?.filter(Boolean) ?? [];
                    return (
                      <div>
                        <div>{profile.active ? "Activo" : "Inactivo"}</div>
                        {required.length > 0 && (
                          <div className="helper-text">
                            {required.join(", ")}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </td>
                <td>
                  {editingProductId === product.id ? (
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={editForm.active}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            active: e.target.checked,
                          }))
                        }
                      />
                    </div>
                  ) : (
                    (product.active ? "Si" : "No")
                  )}
                </td>
                <td>
                  <div className="row-actions">
                    {editingProductId === product.id ? (
                      <>
                        <button
                          className="btn btn-outline-dark btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            saveEditRow(product);
                          }}
                        >
                          Guardar
                        </button>
                        <button
                          className="btn btn-outline-dark btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            cancelEditRow();
                          }}
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="icon-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditRow(product);
                          }}
                          aria-label="Editar"
                          title="Editar"
                        >
                          <IconEdit />
                        </button>
                        <button
                          className="icon-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProduct(product);
                          }}
                          aria-label="Eliminar"
                          title="Eliminar"
                        >
                          <IconTrash />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {showFormulaModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Definir fórmulas</h3>
              <button
                className="btn btn-outline-dark btn-sm"
                onClick={() => setShowFormulaModal(false)}
              >
                Cerrar
              </button>
            </div>
            <div className="modal-body">
              <p className="helper-text">
                Las fórmulas permiten calcular el precio con base + unitario ×
                cantidad + modificadores de opciones.
              </p>
              <div className="modal-grid">
                <div>
                  <h4>Fórmulas existentes</h4>
                  {formulas.length === 0 ? (
                    <div className="helper-text">Sin fórmulas.</div>
                  ) : (
                    <div className="modal-list">
                      {formulas.map((formula) => (
                        <div
                          key={formula.id}
                          className={`modal-list-item ${
                            formulaForm.id === formula.id ? "active" : ""
                          }`}
                        >
                          <div>
                            <strong>{formula.name}</strong>
                            <div className="helper-text">
                              Base: {formula.basePrice ?? 0} · Unitario:{" "}
                              {formula.unitPrice ?? 0}
                            </div>
                            <div className="helper-text">
                              Sector:{" "}
                              {formula.sectorName ??
                                sectors.find((s) => s.id === formula.sectorId)
                                  ?.name ??
                                "-"}
                            </div>
                            <div className="helper-text">
                              {formula.active ? "Activa" : "Inactiva"}
                            </div>
                          </div>
                          <div className="modal-actions">
                            <button
                              className="btn btn-outline-dark btn-sm"
                              onClick={() => startEditFormula(formula)}
                            >
                              Editar
                            </button>
                            <button
                              className="btn btn-outline-dark btn-sm"
                              onClick={() => handleDeleteFormula(formula.id)}
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <h4>{formulaForm.id ? "Editar fórmula" : "Nueva fórmula"}</h4>
                  <div className="modal-form">
                    <label>
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
                        value={formulaForm.sectorId}
                        onChange={(e) => {
                          const nextSector = e.target.value;
                          setFormulaForm((prev) => ({
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
                    <label>
                      <span className="label-row">
                        Producto (opcional)
                        <span
                          className="info-tooltip"
                          data-tooltip="Vincula la fórmula a un producto/servicio concreto."
                        >
                          <IconInfo />
                        </span>
                      </span>
                      <select
                        className="form-select light"
                        value={formulaForm.productId}
                        onChange={(e) =>
                          setFormulaForm((prev) => ({
                            ...prev,
                            productId: e.target.value,
                          }))
                        }
                        disabled={!formulaForm.sectorId}
                      >
                        <option value="">Sin producto/servicio</option>
                        {products
                          .filter((p) => p.active)
                          .filter(
                            (p) =>
                              !formulaForm.sectorId ||
                              p.sectorId === formulaForm.sectorId,
                          )
                          .map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                      </select>
                    </label>
                    <label>
                      <span className="label-row">
                        Nombre
                        <span
                          className="info-tooltip"
                          data-tooltip="Nombre interno de la fórmula. Aparecerá en el selector de pricing."
                        >
                          <IconInfo />
                        </span>
                      </span>
                      <input
                        className="form-control light"
                        value={formulaForm.name}
                        onChange={(e) =>
                          setFormulaForm((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                      />
                    </label>
                    <label>
                      <span className="label-row">
                        Descripción
                        <span
                          className="info-tooltip"
                          data-tooltip="Describe para qué sirve esta fórmula (por ejemplo: Flyers A5)."
                        >
                          <IconInfo />
                        </span>
                      </span>
                      <textarea
                        className="form-control light"
                        rows={3}
                        value={formulaForm.description}
                        onChange={(e) =>
                          setFormulaForm((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                      />
                    </label>
                    <label>
                      <span className="label-row">
                        Base
                        <span
                          className="info-tooltip"
                          data-tooltip="Importe fijo que siempre se suma al presupuesto."
                        >
                          <IconInfo />
                        </span>
                      </span>
                      <input
                        className="form-control light"
                        type="number"
                        value={formulaForm.basePrice}
                        onChange={(e) =>
                          setFormulaForm((prev) => ({
                            ...prev,
                            basePrice: e.target.value,
                          }))
                        }
                      />
                    </label>
                    <label>
                      <span className="label-row">
                        Unitario
                        <span
                          className="info-tooltip"
                          data-tooltip="Precio por unidad. Se multiplica por la cantidad."
                        >
                          <IconInfo />
                        </span>
                      </span>
                      <input
                        className="form-control light"
                        type="number"
                        value={formulaForm.unitPrice}
                        onChange={(e) =>
                          setFormulaForm((prev) => ({
                            ...prev,
                            unitPrice: e.target.value,
                          }))
                        }
                      />
                    </label>
                    <label>
                      <span className="label-row">
                        Activa
                        <span
                          className="info-tooltip"
                          data-tooltip="Si está inactiva no aparece en el selector de pricing."
                        >
                          <IconInfo />
                        </span>
                      </span>
                      <select
                        className="form-select light"
                        value={formulaForm.active ? "yes" : "no"}
                        onChange={(e) =>
                          setFormulaForm((prev) => ({
                            ...prev,
                            active: e.target.value === "yes",
                          }))
                        }
                      >
                        <option value="yes">Sí</option>
                        <option value="no">No</option>
                      </select>
                    </label>
                    <div className="modal-actions">
                      <button
                        className="btn btn-outline-dark btn-sm"
                        onClick={resetFormulaForm}
                        type="button"
                      >
                        Nueva
                      </button>
                      <button
                        className="btn btn-dark btn-sm"
                        onClick={handleSaveFormula}
                        disabled={
                          !formulaForm.name.trim() || !formulaForm.sectorId
                        }
                        type="button"
                      >
                        Guardar
                      </button>
                    </div>
                  </div>
                  {error && <div className="auth-error">{error}</div>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="toast-success" role="status" aria-live="polite">
          {toastMessage}
        </div>
      )}
      {toastError && (
        <div className="toast-error" role="alert" aria-live="assertive">
          {toastError}
        </div>
      )}
    </section>
  );
}
