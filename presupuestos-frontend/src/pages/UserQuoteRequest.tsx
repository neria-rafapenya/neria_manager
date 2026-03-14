import { useEffect, useRef, useState, useCallback } from "react";
import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { productsService } from "../services/productsService";
import { quotesService } from "../services/quotesService";
import { sectorsService } from "../services/sectorsService";
import { aiService } from "../services/aiService";
import { OptionValue, Product, ProductOption } from "../types/product";
import {
  Quote,
  QuoteAttachment,
  QuoteItem,
  QuoteItemCreateRequest,
} from "../types/quote";
import { Sector } from "../types/sector";
import IconNext from "../components/icons/IconNext";
import IconPrev from "../components/icons/IconPrev";
import IconBot from "../components/icons/IconBot";
import IconCart from "../components/icons/IconCart";
import IconAdd from "../components/icons/IconAdd";
import { aiProfileService } from "../services/aiProfileService";
import {
  buildOptionSuggestions,
  extractManualData,
  filterMissingFields,
  resolveRequiredOptionNames,
} from "../services/ai/matchers";
import {
  buildMissingPrompt,
  buildSuggestionChips,
} from "../services/ai/prompts";
import {
  AiManualData,
  isPageOptionName,
  isQuantityOptionName,
  normalize,
} from "../services/ai/rules";
import { AiProfile } from "../types/ai";

interface ItemForm {
  id: string;
  productId: string;
  quantity: number;
  options: Record<string, string>;
}

type OptionPayload = NonNullable<QuoteItemCreateRequest["options"]>;

const SECTOR_KEY = "presup_sector";

type AiDraftResult = {
  productId?: string;
  productName?: string;
  quantity?: number;
  options: OptionPayload;
  formulaName?: string;
  missingFields?: string[];
  optionSuggestions?: Record<string, string[]>;
  formulaSuggestions?: string[];
};

export default function UserQuoteRequest() {
  const welcomeMessage =
    "Hola, soy tu asistente. Cuéntame qué presupuesto necesitas y te ayudaré a generarlo.";
  const [products, setProducts] = useState<Product[]>([]);
  const [productOptions, setProductOptions] = useState<
    Record<
      string,
      {
        options: ProductOption[];
        valuesByOptionId: Record<string, OptionValue[]>;
      }
    >
  >({});
  const [items, setItems] = useState<ItemForm[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [sectorId, setSectorId] = useState(
    () => localStorage.getItem(SECTOR_KEY) ?? "",
  );
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [mode, setMode] = useState<"ai" | "manual" | null>(null);
  const [requestText, setRequestText] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [createdQuote, setCreatedQuote] = useState<Quote | null>(null);
  const [createdQuoteAttachments, setCreatedQuoteAttachments] = useState<
    QuoteAttachment[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiDraft, setAiDraft] = useState<{
    productId: string;
    productName: string;
    quantity: number;
    options: OptionPayload;
    formulaName?: string;
    rawText: string;
  } | null>(null);
  const [aiContextText, setAiContextText] = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<
    { id: string; label: string; value: string }[]
  >([]);
  const [aiOptionalSuggestions, setAiOptionalSuggestions] = useState<
    { id: string; label: string; value: string }[]
  >([]);
  const [usedSuggestionIds, setUsedSuggestionIds] = useState<string[]>([]);
  const [aiManualData, setAiManualData] = useState<AiManualData>({
    options: {},
  });
  const [chatMessages, setChatMessages] = useState<
    { id: string; role: "assistant" | "user"; content: ReactNode }[]
  >([{ id: "welcome", role: "assistant", content: welcomeMessage }]);
  const [submissionSnapshot, setSubmissionSnapshot] = useState<{
    mode: "ai" | "manual" | null;
    requestText: string;
    aiDraft: {
      productId: string;
      productName: string;
      quantity: number;
      options: OptionPayload;
      formulaName?: string;
      rawText: string;
    } | null;
    items: ItemForm[];
  } | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const aiProfileCacheRef = useRef<Record<string, AiProfile | null>>({});
  const allSuggestionChips = [...aiSuggestions, ...aiOptionalSuggestions];

  useEffect(() => {
    setUsedSuggestionIds([]);
  }, [aiSuggestions, aiOptionalSuggestions]);

  useEffect(() => {
    if (!chatInput.trim()) {
      setUsedSuggestionIds([]);
    }
  }, [chatInput]);

  useEffect(() => {
    setUsedSuggestionIds([]);
  }, [step]);

  useEffect(() => {
    if (!chatEndRef.current) return;
    chatEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [chatMessages, aiProcessing]);

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
      const data = await sectorsService.list("", true);
      setSectors(data);
      if (!sectorId && data.length > 0) {
        setSectorId(data[0].id);
        localStorage.setItem(SECTOR_KEY, data[0].id);
      } else if (sectorId && !data.find((s) => s.id === sectorId)) {
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

  async function ensureProductOptions(productId: string) {
    if (!productId || productOptions[productId]) return;
    try {
      const options = await productsService.listOptions("", productId);
      const valuesByOptionId: Record<string, OptionValue[]> = {};
      for (const option of options) {
        if (option.optionType === "SELECT") {
          valuesByOptionId[option.id] = await productsService.listOptionValues(
            "",
            option.id,
          );
        }
      }
      setProductOptions((prev) => ({
        ...prev,
        [productId]: { options, valuesByOptionId },
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando opciones");
    }
  }

  async function resolveAiProfile(productId: string) {
    if (!productId || !sectorId) return undefined;
    const cached = aiProfileCacheRef.current[productId];
    if (cached !== undefined) {
      return cached ?? undefined;
    }
    try {
      const profile = await aiProfileService.resolve("", sectorId, productId);
      aiProfileCacheRef.current[productId] = profile ?? null;
      return profile ?? undefined;
    } catch {
      aiProfileCacheRef.current[productId] = null;
      return undefined;
    }
  }

  const resolveAiProfileBySector = useCallback(async () => {
    if (!sectorId) return undefined;
    const cacheKey = `sector:${sectorId}`;
    const cached = aiProfileCacheRef.current[cacheKey];
    if (cached !== undefined) {
      return cached ?? undefined;
    }
    try {
      const profile = await aiProfileService.resolve("", sectorId);
      aiProfileCacheRef.current[cacheKey] = profile ?? null;
      return profile ?? undefined;
    } catch {
      aiProfileCacheRef.current[cacheKey] = null;
      return undefined;
    }
  }, [sectorId]);

  useEffect(() => {
    loadProducts();
    loadSectors();
  }, []);

  useEffect(() => {
    if (!createdQuote?.id) {
      setCreatedQuoteAttachments([]);
      return;
    }
    quotesService
      .listAttachments("", createdQuote.id)
      .then(setCreatedQuoteAttachments)
      .catch(() => setCreatedQuoteAttachments([]));
  }, [createdQuote?.id]);

  useEffect(() => {
    items.forEach((item) => {
      if (item.productId) {
        ensureProductOptions(item.productId);
      }
    });
  }, [items]);

  function updateItem(index: number, patch: Partial<ItemForm>) {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  }

  function addItem() {
    setItems((prev) => [
      ...prev,
      { id: `${Date.now()}`, productId: "", quantity: 1, options: {} },
    ]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function buildItemsPayload(): QuoteItemCreateRequest[] {
    return items
      .filter((item) => item.productId)
      .map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        options: Object.entries(item.options).map(([optionId, value]) => ({
          optionId,
          value,
        })),
      }));
  }

  function validateForm(): string[] {
    const errors: string[] = [];
    if (items.length === 0) {
      errors.push("Debes añadir al menos un item.");
    }
    items.forEach((item, index) => {
      if (!item.productId) {
        errors.push(`Item ${index + 1}: selecciona producto/servicio.`);
        return;
      }
      if (!item.quantity || item.quantity < 1) {
        errors.push(`Item ${index + 1}: cantidad inválida.`);
      }
      const optionData = productOptions[item.productId];
      if (!optionData) return;
      optionData.options.forEach((option) => {
        if (!option.required) return;
        const value = item.options[option.id];
        if (value == null || value === "") {
          errors.push(
            `Item ${index + 1}: opción obligatoria '${option.name}' sin valor.`,
          );
          return;
        }
        if (option.optionType === "NUMBER" && isNaN(Number(value))) {
          errors.push(`Item ${index + 1}: '${option.name}' debe ser numérico.`);
        }
        if (
          option.optionType === "BOOLEAN" &&
          value !== "true" &&
          value !== "false"
        ) {
          errors.push(
            `Item ${index + 1}: '${option.name}' debe ser true/false.`,
          );
        }
      });
    });
    return errors;
  }

  async function getOptionData(productId: string) {
    if (productOptions[productId]) return productOptions[productId];
    const options = await productsService.listOptions("", productId);
    const valuesByOptionId: Record<string, OptionValue[]> = {};
    for (const option of options) {
      if (option.optionType === "SELECT") {
        valuesByOptionId[option.id] = await productsService.listOptionValues(
          "",
          option.id,
        );
      }
    }
    const payload = { options, valuesByOptionId };
    setProductOptions((prev) => ({ ...prev, [productId]: payload }));
    return payload;
  }

  async function fetchAiResponse(text: string) {
    return aiService.parse("", {
      text,
      sectorId: sectorId || undefined,
    });
  }

  async function buildAiDraft(
    aiResponse: Awaited<ReturnType<typeof fetchAiResponse>>,
    overrides: AiManualData,
  ): Promise<AiDraftResult> {
    const missing = new Set<string>();
    const sectorProducts = products.filter(
      (product) => (product.sectorId ?? "") === sectorId,
    );
    const product =
      (aiResponse.productId
        ? sectorProducts.find((item) => item.id === aiResponse.productId)
        : undefined) ??
      sectorProducts.find(
        (item) => normalize(item.name) === normalize(aiResponse.product ?? ""),
      ) ??
      sectorProducts.find(
        (item) =>
          normalize(item.name).includes(normalize(aiResponse.product ?? "")) ||
          normalize(aiResponse.product ?? "").includes(normalize(item.name)),
      );

    if (!product) {
      missing.add("product");
      return {
        productId: aiResponse.productId ?? "",
        productName: aiResponse.product ?? "Producto/Servicio",
        quantity: 0,
        options: [],
        missingFields: Array.from(missing),
        optionSuggestions: aiResponse.optionSuggestions,
        formulaSuggestions: aiResponse.formulaSuggestions,
      };
    }

    const quantityCandidate = overrides.quantity ?? aiResponse.quantity ?? 0;
    const quantity = quantityCandidate > 0 ? quantityCandidate : 0;
    if (!quantity) {
      missing.add("quantity");
    }
    const optionData = await getOptionData(product.id);
    const aiProfile = await resolveAiProfile(product.id);
    const profileRequired = (aiProfile?.requiredOptionNames ?? []).filter(
      (name) => name && name.trim().length > 0,
    );
    const requiredOptionNames =
      profileRequired.length > 0
        ? resolveRequiredOptionNames(optionData.options, profileRequired)
        : optionData.options
            .filter((option) => option.required)
            .map((option) => option.name ?? "")
            .filter((name) => name.trim().length > 0);
    const requiredNameSet = new Set(
      requiredOptionNames.map((name) => normalize(name)),
    );
    const optionList = optionData.options;
    const optionSuggestions: Record<string, string[]> = {
      ...(aiResponse.optionSuggestions ?? {}),
    };
    const mergedOptions = {
      ...(aiResponse.options ?? {}),
      ...(overrides.options ?? {}),
    } as Record<string, string | null>;

    const dayOption = optionData.options.find((option) =>
      normalize(option.name ?? "").includes("dia del servicio") ||
      normalize(option.name ?? "").includes("día del servicio"),
    );
    if (dayOption) {
      const dayValue = mergedOptions[dayOption.name ?? ""] ?? "";
      if (dayValue && isDayOfWeek(String(dayValue))) {
        const weekOption = optionData.options.find((option) => {
          const name = normalize(option.name ?? "");
          return (
            name.includes("dias por semana") ||
            name.includes("días por semana") ||
            name.includes("visitas por semana")
          );
        });
        if (weekOption && !mergedOptions[weekOption.name ?? ""]) {
          mergedOptions[weekOption.name ?? ""] = "1";
        }
        const frequencyOption = optionData.options.find((option) =>
          normalize(option.name ?? "").includes("frecuenc"),
        );
        if (frequencyOption && !mergedOptions[frequencyOption.name ?? ""]) {
          mergedOptions[frequencyOption.name ?? ""] = "Semanal";
        }
      }
    }
    const optionPayload: OptionPayload = (
      optionList
      .map((option) => {
        const optionName = option.name ?? "";
        let rawValue = mergedOptions?.[optionName];
        if (
          (rawValue == null || rawValue === "") &&
          quantity > 0 &&
          isQuantityOptionName(optionName)
        ) {
          rawValue = String(quantity);
        }
        const mustHave =
          option.required || requiredNameSet.has(normalize(optionName));
        if (mustHave && (rawValue == null || rawValue === "")) {
          if (!isQuantityOptionName(optionName)) {
            missing.add(`option:${optionName}`);
            if (!optionSuggestions[optionName]) {
              optionSuggestions[optionName] = buildOptionSuggestions(
                option,
                optionData.valuesByOptionId[option.id],
              );
            }
          }
          return null;
        }
        if (rawValue == null || rawValue === "") {
          return null;
        }
        if (option.optionType === "SELECT") {
          const values = optionData.valuesByOptionId[option.id] ?? [];
          const numericValue = Number(rawValue);
          if (
            isPageOptionName(optionName) &&
            !Number.isNaN(numericValue) &&
            numericValue > 0
          ) {
            return { optionId: option.id, value: String(numericValue) };
          }
          if (!values.length) {
            return { optionId: option.id, value: String(rawValue) };
          }
          const match = values.find(
            (value) =>
              normalize(value.value ?? "") === normalize(String(rawValue)),
          );
          if (!match) {
            missing.add(`option:${optionName}`);
            if (!optionSuggestions[optionName]) {
              optionSuggestions[optionName] = buildOptionSuggestions(
                option,
                values,
              );
            }
            return null;
          }
          return { optionId: option.id, value: match.value ?? "" };
        }
        if (option.optionType === "NUMBER") {
          const num = Number(rawValue);
          if (Number.isNaN(num)) {
            missing.add(`option:${optionName}`);
            return null;
          }
          return { optionId: option.id, value: String(num) };
        }
        if (option.optionType === "BOOLEAN") {
          const normalized = normalize(String(rawValue));
          const values = optionData.valuesByOptionId[option.id] ?? [];
          const truthy = ["true", "si", "sí", "yes", "1"].includes(normalized);
          const falsy = ["false", "no", "0"].includes(normalized);

          if (values.length > 0) {
            const match = values.find(
              (value) =>
                normalize(value.value ?? "") === normalize(String(rawValue)),
            );
            if (match) {
              return { optionId: option.id, value: match.value ?? "" };
            }
            if (truthy) {
              const yesMatch = values.find((value) =>
                ["true", "si", "sí", "yes", "1"].includes(
                  normalize(value.value ?? ""),
                ),
              );
              if (yesMatch) {
                return { optionId: option.id, value: yesMatch.value ?? "" };
              }
              if (values.length === 1) {
                return { optionId: option.id, value: values[0].value ?? "" };
              }
            }
            if (falsy) {
              const noMatch = values.find((value) =>
                ["false", "no", "0"].includes(normalize(value.value ?? "")),
              );
              if (noMatch) {
                return { optionId: option.id, value: noMatch.value ?? "" };
              }
              if (mustHave) {
                missing.add(`option:${optionName}`);
                if (!optionSuggestions[optionName]) {
                  optionSuggestions[optionName] = buildOptionSuggestions(
                    option,
                    values,
                  );
                }
              }
              return null;
            }
            missing.add(`option:${optionName}`);
            if (!optionSuggestions[optionName]) {
              optionSuggestions[optionName] = buildOptionSuggestions(
                option,
                values,
              );
            }
            return null;
          }

          const booleanValue = truthy ? "true" : falsy ? "false" : null;
          if (!booleanValue) {
            missing.add(`option:${optionName}`);
            if (!optionSuggestions[optionName]) {
              optionSuggestions[optionName] = ["true", "false"];
            }
            return null;
          }
          return { optionId: option.id, value: booleanValue };
        }
        return { optionId: option.id, value: String(rawValue) };
      })
      .filter(Boolean) as OptionPayload
    ) ?? [];

    optionList.forEach((option) => {
      if (option.optionType !== "BOOLEAN") return;
      const optionName = option.name ?? "";
      if (!optionName) return;
      const values = optionData.valuesByOptionId[option.id] ?? [];
      if (values.length > 0) {
        optionSuggestions[optionName] = buildOptionSuggestions(option, values);
      }
    });

    if (
      aiResponse.missingFields?.includes("formula") &&
      !overrides.formula
    ) {
      missing.add("formula");
    }

    await ensureProductOptions(product.id);

    return {
      productId: product.id,
      productName: product.name ?? "Producto/Servicio",
      quantity: quantity || 0,
      options: optionPayload,
      formulaName: overrides.formula,
      missingFields: missing.size ? Array.from(missing) : undefined,
      optionSuggestions,
      formulaSuggestions: aiResponse.formulaSuggestions,
    };
  }

  function mergeManualData(current: AiManualData, next: AiManualData) {
    return {
      quantity: next.quantity ?? current.quantity,
      formula: next.formula ?? current.formula,
      options: {
        ...current.options,
        ...next.options,
      },
    };
  }

  function buildAugmentedText(baseText: string, manualData: AiManualData) {
    const parts: string[] = [baseText];
    const confirmations: string[] = [];
    if (manualData.quantity) {
      confirmations.push(`cantidad ${manualData.quantity}`);
    }
    Object.entries(manualData.options).forEach(([key, value]) => {
      confirmations.push(`${key}: ${value}`);
    });
    if (manualData.formula) {
      confirmations.push(`fórmula ${manualData.formula}`);
    }
    if (confirmations.length) {
      const alreadyHasConfirmations = baseText
        .toLowerCase()
        .includes("datos confirmados:");
      if (!alreadyHasConfirmations) {
        parts.push(`Datos confirmados: ${confirmations.join(", ")}.`);
      }
    }
    return parts.join("\n");
  }

  function extractExplicitOptionPairs(text: string) {
    const pairs: Record<string, string> = {};
    const pattern =
      /([A-Za-zÀ-ÿ0-9ºª()/%._\-\s]+?)\s*:\s*([^:\n]+?)(?=(?:\s*[·•-]?\s*[A-Za-zÀ-ÿ0-9ºª()/%._\-\s]+?\s*:)|$)/g;
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const key = match[1]?.trim();
      const value = match[2]?.trim();
      if (!key || !value) continue;
      if (normalize(key).startsWith("datos confirmados")) continue;
      pairs[key] = value;
    }
    return pairs;
  }

  function isDayOfWeek(value: string) {
    const normalized = normalize(value);
    return [
      "lunes",
      "martes",
      "miercoles",
      "miércoles",
      "jueves",
      "viernes",
      "sabado",
      "sábado",
      "domingo",
    ].some((day) => normalized.includes(day));
  }

  async function getQuantityPrompt(productId?: string) {
    const profile = productId
      ? await resolveAiProfile(productId)
      : await resolveAiProfileBySector();
    if (profile?.quantityLabel) {
      const label = profile.quantityLabel.trim();
      if (label.length > 0) {
        const normalized = normalize(label);
        const feminine =
          normalized.includes("hora") ||
          normalized.includes("visita") ||
          normalized.includes("sesion");
        const prefix = feminine ? "¿Cuántas" : "¿Cuántos";
        return `${prefix} ${label} necesitas?`;
      }
    }
    const sectorName =
      sectors.find((sector) => sector.id === sectorId)?.name ?? "";
    const productName =
      products.find((product) => product.id === productId)?.name ?? "";
    const optionNames =
      productId && productOptions[productId]
        ? productOptions[productId].options
            .map((option) => option.name ?? "")
            .filter(Boolean)
        : [];
    const hayVisitas = optionNames.some((name) =>
      normalize(name).includes("visita"),
    );
    const hayHoras = optionNames.some((name) =>
      normalize(name).includes("hora"),
    );
    const hayFrecuencia = optionNames.some((name) =>
      normalize(name).includes("frecuenc"),
    );
    const sectorNormalized = normalize(sectorName);
    const productNormalized = normalize(productName);

    if (hayHoras) {
      return "¿Cuántas horas necesitas?";
    }
    if (hayVisitas || hayFrecuencia) {
      return "¿Cuántas visitas necesitas?";
    }
    if (
      sectorNormalized.includes("servicios") ||
      sectorNormalized.includes("domest") ||
      productNormalized.includes("limpieza") ||
      productNormalized.includes("mantenimiento")
    ) {
      return "¿Cuántas horas necesitas?";
    }
    return "¿Qué cantidad necesitas?";
  }

  function buildOptionQuestionMap(optionNames: string[]) {
    const map: Record<string, string> = {};
    optionNames.forEach((optionName) => {
      const normalized = normalize(optionName);
      if (normalized.includes("frecuenc")) {
        map[optionName] = "¿Con qué frecuencia?";
        return;
      }
      if (normalized.includes("mascot")) {
        map[optionName] = "¿Hay mascotas en casa?";
        return;
      }
      if (normalized.includes("dia del servicio") || normalized.includes("día del servicio")) {
        map[optionName] = "¿Qué día de la semana prefieres?";
        return;
      }
      if (
        normalized.includes("dias por semana") ||
        normalized.includes("días por semana") ||
        normalized.includes("visitas por semana")
      ) {
        map[optionName] = "¿Cuántos días por semana?";
        return;
      }
      if (normalized.includes("bano") || normalized.includes("baño")) {
        map[optionName] = "¿Cuántos baños hay?";
        return;
      }
      map[optionName] = `¿Puedes indicar ${optionName}?`;
    });
    return map;
  }

  function buildOptionalQuestions(optionalChips: { id: string; value: string }[]) {
    const names = Array.from(
      new Set(
        optionalChips
          .filter((chip) => chip.id.startsWith("opt-"))
          .map((chip) => chip.value.split(":")[0]?.trim())
          .filter(Boolean) as string[],
      ),
    );
    if (!names.length) return [];
    const map = buildOptionQuestionMap(names);
    return names.map((name) => map[name]).filter(Boolean);
  }

  async function handleAiChatSend() {
    const text = chatInput.trim();
    if (!text || aiProcessing) return;
    setError(null);
    setChatInput("");
    const explicitPairs = extractExplicitOptionPairs(text);
    const manualSeed = mergeManualData(aiManualData, { options: explicitPairs });
    const baseText = aiContextText ? `${aiContextText}\n${text}` : text;
    const augmentedText = buildAugmentedText(baseText, manualSeed);
    setRequestText(augmentedText);
    setAiDraft(null);
    setChatMessages((prev) => [
      ...prev,
      { id: `${Date.now()}-user`, role: "user", content: text },
    ]);
    setAiProcessing(true);
    try {
      const aiResponse = await fetchAiResponse(augmentedText);
      let draft = await buildAiDraft(aiResponse, manualSeed);
      if (draft.missingFields && draft.missingFields.length > 0) {
        const extracted = extractManualData(
          text,
          draft.missingFields,
          draft.optionSuggestions,
          draft.formulaSuggestions,
        );
        const mergedManual = mergeManualData(manualSeed, extracted);
        const draftWithManual = await buildAiDraft(aiResponse, mergedManual);
        const filteredMissing = draftWithManual.missingFields?.length
          ? filterMissingFields(draftWithManual.missingFields, mergedManual)
          : [];
        if (filteredMissing.length) {
          setAiContextText(baseText);
          setAiManualData(mergedManual);
          const chips = buildSuggestionChips(
            filteredMissing,
            draftWithManual.optionSuggestions,
            draftWithManual.formulaSuggestions,
          );
          const optionalChips = draftWithManual.productId
            ? await buildOptionalSuggestionChips(draftWithManual.productId)
            : [];
          const hasOptionChips = chips.some((chip) =>
            chip.id.startsWith("opt-"),
          );
          const hasFormulaChips = chips.some((chip) =>
            chip.id.startsWith("formula-"),
          );
          const quantityPrompt = await getQuantityPrompt(draftWithManual.productId);
          const missingPrompt = buildMissingPrompt(
            filteredMissing,
            draftWithManual.optionSuggestions,
            draftWithManual.formulaSuggestions,
            hasOptionChips,
            hasFormulaChips,
            quantityPrompt,
            buildOptionQuestionMap(
              filteredMissing
                .filter((field) => field.startsWith("option:"))
                .map((field) => field.replace("option:", "").trim()),
            ),
            buildOptionalQuestions(optionalChips),
          );
          setAiSuggestions(chips);
          setAiOptionalSuggestions(optionalChips);
          setChatMessages((prev) => [
            ...prev,
            {
              id: `${Date.now()}-assistant`,
              role: "assistant",
              content: missingPrompt,
            },
          ]);
          return;
        }
        draft = draftWithManual;
        setAiManualData({ options: {} });
      }

      setAiContextText(augmentedText);
      setAiSuggestions([]);
      setAiManualData({
        quantity: draft.quantity ?? undefined,
        options: draft.options.reduce<Record<string, string>>((acc, opt) => {
          const name = getOptionName(opt.optionId, draft.productId);
          if (name) acc[name] = String(opt.value);
          return acc;
        }, {}),
        formula: draft.formulaName,
      });
      setAiDraft({
        productId: draft.productId ?? "",
        productName: draft.productName ?? "Producto/Servicio",
        quantity: draft.quantity ?? 1,
        options: draft.options,
        formulaName: draft.formulaName,
        rawText: augmentedText,
      });
      setAiOptionalSuggestions(
        draft.productId
          ? await buildOptionalSuggestionChips(draft.productId)
          : [],
      );
      const optionEntries = draft.options.map((opt) => ({
        name: getOptionName(opt.optionId, draft.productId),
        value: opt.value,
      }));
      const summarizedOptions = Array.from(
        new Map(optionEntries.map((entry) => [entry.name, entry.value])),
      ).map(([name, value]) => `${name}: ${value}`);
      const summaryItems = [
        `Producto/Servicio: ${draft.productName}`,
        draft.quantity ? `Cantidad: ${draft.quantity}` : null,
        ...summarizedOptions,
        draft.formulaName ? `Fórmula: ${draft.formulaName}` : null,
      ].filter(Boolean) as string[];
      const summaryContent = (
        <div>
          <div>Resumen del presupuesto:</div>
          <ul className="chat-summary-list">
            {summaryItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <div className="chat-summary-cta">
            Cuando quieras, pulsa Procesar para continuar.
          </div>
        </div>
      );
      setChatMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-assistant`,
          role: "assistant",
          content: summaryContent,
        },
      ]);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No pude interpretar tu solicitud.";
      setChatMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-assistant`,
          role: "assistant",
          content:
            "No he podido preparar el presupuesto. " +
            message +
            " Puedes reformular la solicitud o dar más detalles.",
        },
      ]);
    } finally {
      setAiProcessing(false);
    }
  }

  function applySuggestionChip(chip: { id: string; label: string; value: string }) {
    const isOptionChip = chip.id.startsWith("opt-");
    const optionName = isOptionChip
      ? chip.value.split(":")[0]?.trim().toLowerCase()
      : "";
    setChatInput((prev) => {
      if (!isOptionChip || !optionName) {
        return prev ? `${prev}\n${chip.value}` : chip.value;
      }
      const cleaned = prev
        .split("\n")
        .filter((line) => {
          const key = line.split(":")[0]?.trim().toLowerCase();
          return key !== optionName;
        })
        .filter((line) => line.trim().length > 0);
      return cleaned.length
        ? `${cleaned.join("\n")}\n${chip.value}`
        : chip.value;
    });
    setUsedSuggestionIds((prev) => {
      if (!isOptionChip || !optionName) {
        return [...prev, chip.id];
      }
      const next = prev.filter((id) => {
        const existing = allSuggestionChips.find((item) => item.id === id);
        if (!existing?.id.startsWith("opt-")) {
          return true;
        }
        const existingName = existing.value
          .split(":")[0]
          ?.trim()
          .toLowerCase();
        return existingName !== optionName;
      });
      return [...next, chip.id];
    });
  }

  function renderChipLabel(chip: { id: string; label: string; value: string }) {
    if (!chip.id.startsWith("opt-")) {
      return chip.label;
    }
    const parts = chip.value.split(":");
    if (parts.length < 2) {
      return chip.label;
    }
    const optionName = parts[0]?.trim();
    const rawValue = parts.slice(1).join(":").trim();
    const normalized = rawValue.toLowerCase();
    const isTrue =
      normalized === "true" || normalized === "si" || normalized === "sí";
    const isFalse = normalized === "false" || normalized === "no";
    if (!isTrue && !isFalse) {
      return chip.label;
    }
    return (
      <>
        {optionName}:{" "}
        <span className={`chip-icon ${isTrue ? "yes" : "no"}`}>
          {isTrue ? "✓" : "✕"}
        </span>
      </>
    );
  }

  async function buildOptionalSuggestionChips(productId: string) {
    const optionData = await getOptionData(productId);
    const aiProfile = await resolveAiProfile(productId);
    const profileRequired = (aiProfile?.requiredOptionNames ?? []).filter(
      (name) => name && name.trim().length > 0,
    );
    const requiredNames =
      profileRequired.length > 0
        ? resolveRequiredOptionNames(optionData.options, profileRequired)
        : optionData.options
            .filter((option) => option.required)
            .map((option) => option.name ?? "")
            .filter((name) => name.trim().length > 0);
    const requiredSet = new Set(requiredNames.map((name) => normalize(name)));

    const optionalOptions = optionData.options.filter((option) => {
      const name = option.name ?? "";
      if (!name) return false;
      if (requiredSet.has(normalize(name))) return false;
      if (option.required) return false;
      if (option.optionType === "NUMBER") return false;
      return true;
    });

    const chips: { id: string; label: string; value: string }[] = [];
    optionalOptions.forEach((option) => {
      const suggestions = buildOptionSuggestions(
        option,
        optionData.valuesByOptionId[option.id],
      );
      suggestions.forEach((suggestion) => {
        const value = `${option.name}: ${suggestion}`;
        chips.push({
          id: `opt-${option.name}-${suggestion}`,
          label: value,
          value,
        });
      });
    });

    return chips.sort((a, b) => a.label.localeCompare(b.label, "es"));
  }

  async function handleAiSubmit() {
    setError(null);
    setCreatedQuote(null);
    try {
      const submission = getSubmissionContext();
      const submissionText = submission.requestText;
      if (!submissionText.trim()) {
        setError("Describe la solicitud para generar el presupuesto.");
        return;
      }
      setLoading(true);
      const aiResponse = await fetchAiResponse(submissionText);
      const draftResult =
        submission.aiDraft ?? (await buildAiDraft(aiResponse, aiManualData));
      if (!submission.aiDraft && draftResult.missingFields?.length) {
        setError("Faltan datos para completar el presupuesto.");
        return;
      }
      const draft = submission.aiDraft ?? {
        productId: draftResult.productId ?? "",
        productName: draftResult.productName ?? "Producto/Servicio",
        quantity: draftResult.quantity ?? 1,
        options: draftResult.options,
        formulaName: draftResult.formulaName,
        rawText: submissionText,
      };
      const sectorName = sectors.find((s) => s.id === sectorId)?.name;
      const created = await quotesService.create("", {
        items: [
          {
            productId: draft.productId,
            quantity: draft.quantity,
            options: draft.options,
            formulaName: draft.formulaName,
          },
        ],
        sector: sectorName,
      });
      setCreatedQuote(created);
      setItems([]);
      setRequestText("");
      setAiDraft(null);
      setSubmissionSnapshot(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error solicitando presupuesto",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleManualSubmit() {
    setError(null);
    setCreatedQuote(null);
    setLoading(true);
    try {
      const submission = getSubmissionContext();
      const payload =
        submission.items.length > 0
          ? submission.items
              .filter((item) => item.productId)
              .map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                options: Object.entries(item.options).map(([optionId, value]) => ({
                  optionId,
                  value,
                })),
              }))
          : buildItemsPayload();
      if (!payload.length) {
        setError("Debes añadir al menos un item con producto/servicio.");
        return;
      }
      const sectorName = sectors.find((s) => s.id === sectorId)?.name;
      const created = await quotesService.create("", {
        items: payload,
        sector: sectorName,
      });
      setCreatedQuote(created);
      setItems([]);
      setSubmissionSnapshot(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error solicitando presupuesto",
      );
    } finally {
      setLoading(false);
    }
  }

  function resetWizardDraft() {
    setRequestText("");
    setAiDraft(null);
    setAiContextText(null);
    setAiSuggestions([]);
    setAiOptionalSuggestions([]);
    setAiManualData({ options: {} });
    setChatInput("");
    setChatMessages([{ id: "welcome", role: "assistant", content: welcomeMessage }]);
    setUsedSuggestionIds([]);
    setItems([]);
    setMode(null);
  }

  function handleProcessStep() {
    setSubmissionSnapshot({
      mode,
      requestText,
      aiDraft,
      items,
    });
    resetWizardDraft();
    setStep(5);
  }

  function getSubmissionContext() {
    return (
      submissionSnapshot ?? {
        mode,
        requestText,
        aiDraft,
        items,
      }
    );
  }

  function goNextStep() {
    setError(null);
    setCreatedQuote(null);
    setStep((prev) => (prev < 5 ? ((prev + 1) as 1 | 2 | 3 | 4 | 5) : prev));
  }

  function goPrevStep() {
    setError(null);
    setCreatedQuote(null);
    if (step === 5) {
      resetWizardDraft();
      setSubmissionSnapshot(null);
    }
    setStep((prev) => (prev > 1 ? ((prev - 1) as 1 | 2 | 3 | 4 | 5) : prev));
  }

  const filteredProducts = products.filter(
    (product) => (product.sectorId ?? "") === sectorId,
  );
  const canContinueStep1 = Boolean(sectorId);
  const selectedItems = items.filter((item) => item.productId);
  const canProceedAi = Boolean(aiDraft);
  const canProceedManual = selectedItems.length > 0;
  const canProceedToSend =
    mode === "ai" ? canProceedAi : mode === "manual" ? canProceedManual : false;
  const submissionContext = getSubmissionContext();
  const submitMode = submissionContext.mode;
  const canSubmit =
    submitMode === "ai"
      ? Boolean(submissionContext.aiDraft)
      : submitMode === "manual"
        ? submissionContext.items.filter((item) => item.productId).length > 0
        : false;

  function getProductName(productId: string) {
    return (
      products.find((product) => product.id === productId)?.name ?? "Producto/Servicio"
    );
  }

  function getOptionName(optionId: string, productId: string) {
    const optionData = productOptions[productId];
    return (
      optionData?.options?.find((option) => option.id === optionId)?.name ??
      "Opción"
    );
  }

  function formatMoney(value: number) {
    return value.toLocaleString("es-ES", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function normalizeText(value: string) {
    return value.trim().toLowerCase();
  }

  function getFrequencyInfo(item: QuoteItem) {
    const optionNameFor = (opt: QuoteItem["options"][number]) =>
      normalizeText(getOptionName(opt.optionId, item.productId));
    const frequencyOption = item.options?.find((opt) =>
      optionNameFor(opt).includes("frecuenc"),
    );
    const daysPerWeekOption = item.options?.find((opt) => {
      const name = optionNameFor(opt);
      return (
        name.includes("dias por semana") ||
        name.includes("días por semana") ||
        name.includes("visitas por semana") ||
        name.includes("dias/semana") ||
        name.includes("visitas/semana")
      );
    });

    const frequencyValue = String(frequencyOption?.value ?? "").trim();
    const normalizedFrequency = normalizeText(frequencyValue);
    const daysPerWeekValue = String(daysPerWeekOption?.value ?? "").trim();
    const visitsPerWeek = Number(daysPerWeekValue.replace(",", "."));
    const hasVisitsPerWeek = !Number.isNaN(visitsPerWeek) && visitsPerWeek > 0;

    if (normalizedFrequency.includes("puntual") && !hasVisitsPerWeek) {
      return null;
    }

    if (hasVisitsPerWeek) {
      const monthlyVisits = Math.round(visitsPerWeek * 4);
      const labelParts = [];
      if (frequencyValue) labelParts.push(frequencyValue);
      labelParts.push(`${visitsPerWeek} días/semana`);
      return {
        label: labelParts.join(" · "),
        multiplier: visitsPerWeek * 4,
        periodLabel: `mensual (${monthlyVisits} visitas)`,
      };
    }

    if (normalizedFrequency.includes("semanal")) {
      return {
        label: frequencyValue,
        multiplier: 4,
        periodLabel: "mensual (4 visitas)",
      };
    }
    if (normalizedFrequency.includes("quincenal")) {
      return {
        label: frequencyValue,
        multiplier: 2,
        periodLabel: "mensual (2 visitas)",
      };
    }
    if (normalizedFrequency.includes("mensual")) {
      return {
        label: frequencyValue,
        multiplier: 1,
        periodLabel: "mensual (1 visita)",
      };
    }
    if (frequencyValue) {
      return {
        label: frequencyValue,
        multiplier: 1,
        periodLabel: "mensual (1 visita)",
      };
    }
    return null;
  }

  function calcLineTotal(item: QuoteItem) {
    const qty = item.quantity ?? 1;
    const unit = item.unitPrice ?? 0;
    return item.totalPrice ?? unit * qty;
  }

  const motionVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.25 } },
    exit: { opacity: 0, x: -20, transition: { duration: 0.2 } },
  };

  function handleStepSelect(target: 1 | 2 | 3 | 4 | 5) {
    setError(null);
    setCreatedQuote(null);
    if (step === 5 && target < 5) {
      resetWizardDraft();
      setSubmissionSnapshot(null);
    }
    if (target === 1) {
      setStep(1);
      return;
    }
    if (target === 2) {
      if (!canContinueStep1) {
        setError("Selecciona un sector antes de continuar.");
        return;
      }
      setStep(2);
      return;
    }
    if (target === 3) {
      if (!canContinueStep1) {
        setError("Selecciona un sector antes de continuar.");
        return;
      }
      setMode("ai");
      setStep(3);
      return;
    }
    if (target === 4) {
      if (!canContinueStep1) {
        setError("Selecciona un sector antes de continuar.");
        return;
      }
      setMode("manual");
      setStep(4);
      return;
    }
    if (target === 5) {
      if (!canContinueStep1) {
        setError("Selecciona un sector antes de continuar.");
        return;
      }
      if (!mode) {
        setError("Selecciona si quieres IA o modo manual antes de continuar.");
        return;
      }
      if (!canProceedToSend) {
        setError(
          mode === "ai"
            ? "Introduce un texto válido para continuar."
            : "Añade al menos un item con producto/servicio para continuar.",
        );
        return;
      }
      handleProcessStep();
    }
  }

  return (
    <section>
      <h2>Solicitar presupuesto</h2>
      <p>
        Completa los pasos para generar tu presupuesto al instante. Elige el
        sector, decide si quieres usar IA o seleccionar productos/servicios manualmente y
        finaliza el envío.
      </p>
      <div className="wizard-steps">
        <button
          className={`wizard-step ${step === 1 ? "active" : ""}`}
          onClick={() => handleStepSelect(1)}
          type="button"
        >
          <span className="wizard-step-index">1</span>
          <span className="wizard-step-label">Sector</span>
        </button>
        <button
          className={`wizard-step ${step === 2 ? "active" : ""} ${canContinueStep1 ? "" : "disabled"}`}
          onClick={() => handleStepSelect(2)}
          type="button"
        >
          <span className="wizard-step-index">2</span>
          <span className="wizard-step-label">Método</span>
        </button>
        <button
          className={`wizard-step ${step === 3 ? "active" : ""}`}
          onClick={() => handleStepSelect(3)}
          type="button"
        >
          <span className="wizard-step-index">3</span>
          <span className="wizard-step-label">IA</span>
        </button>
        <button
          className={`wizard-step ${step === 4 ? "active" : ""}`}
          onClick={() => handleStepSelect(4)}
          type="button"
        >
          <span className="wizard-step-index">4</span>
          <span className="wizard-step-label">Manual</span>
        </button>
        <button
          className={`wizard-step ${step === 5 ? "active" : ""} ${
            canProceedToSend ? "" : "disabled"
          }`}
          onClick={() => handleStepSelect(5)}
          type="button"
          disabled={!canProceedToSend}
        >
          <span className="wizard-step-index">5</span>
          <span className="wizard-step-label">Enviar</span>
        </button>
      </div>
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step-1" {...motionVariants}>
            <div className="card" style={{ marginBottom: "16px" }}>
              <h3>1. Selecciona el sector</h3>
              <small className="helper-text">
                El sector define el catálogo de productos/servicios y opciones disponibles
                para tu solicitud.
              </small>
              <label>
                <select
                  className="form-select light mt-4 mb-4"
                  value={sectorId}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSectorId(value);
                    localStorage.setItem(SECTOR_KEY, value);
                    setItems([]);
                    setAiDraft(null);
                    setRequestText("");
                    setChatInput("");
                    setChatMessages([
                      {
                        id: "welcome",
                        role: "assistant",
                        content: welcomeMessage,
                      },
                    ]);
                  }}
                >
                  {sectors.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="wizard-actions">
                <button
                  onClick={goNextStep}
                  disabled={!canContinueStep1}
                  className="btn-icon btn-icon-circle"
                  aria-label="Continuar"
                  title="Continuar"
                >
                  <IconNext />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step-2" {...motionVariants}>
            <div className="card" style={{ marginBottom: "16px" }}>
              <h3>2. Elige cómo crear el presupuesto</h3>
              <div
                className="mt-5 mb-5"
                style={{
                  display: "grid",
                  gap: "12px",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  justifyItems: "center",
                }}
              >
                <button
                  onClick={() => {
                    setMode("ai");
                    setStep(3);
                  }}
                  className="step-choice-button"
                >
                  <IconBot width={88} height={88} />
                  Presupuesto con IA
                </button>
                <button
                  onClick={() => {
                    setMode("manual");
                    setStep(4);
                  }}
                  className="step-choice-button"
                >
                  <IconCart width={88} height={88} />
                  Seleccionar manualmente
                </button>
              </div>
              <div style={{ marginTop: "12px" }}>
                <button
                  onClick={goPrevStep}
                  className="btn-icon btn-icon-circle"
                  aria-label="Volver"
                  title="Volver"
                >
                  <IconPrev />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="step-3" {...motionVariants}>
            <div className="card" style={{ marginBottom: "16px" }}>
              <h3>3. Solicitud con IA</h3>
              <small className="helper-text mb-3">
                Escribe el pedido tal y como lo harías por email. La IA
                detectará el producto/servicio, la cantidad y las opciones. En el
                siguiente paso podrás enviar la solicitud.
              </small>
              {sectorId && (
                <QuantityLabelHint
                  sectorId={sectorId}
                  resolveProfile={resolveAiProfileBySector}
                  sectorName={
                    sectors.find((sector) => sector.id === sectorId)?.name ?? ""
                  }
                />
              )}
              <div className="chat-panel">
                {chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`chat-bubble ${message.role}`}
                  >
                    {message.content}
                  </div>
                ))}
                {aiProcessing && (
                  <div className="chat-bubble assistant">
                    Estoy analizando tu solicitud...
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              {aiSuggestions.length > 0 && (
                <div className="chat-suggestions">
                  <div className="chat-suggestions-title">
                    Sugerencias rápidas
                  </div>
                  <div className="chat-suggestions-row">
                    {(() => {
                      return aiSuggestions.map((chip) => {
                        const isUsed = usedSuggestionIds.includes(chip.id);
                        return (
                          <button
                            key={chip.id}
                            type="button"
                            className={`chat-chip ${isUsed ? "active" : ""}`}
                            disabled={isUsed}
                            aria-pressed={isUsed}
                            onClick={() => {
                              if (isUsed) return;
                              applySuggestionChip(chip);
                            }}
                          >
                            {renderChipLabel(chip)}
                          </button>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}
              {aiOptionalSuggestions.length > 0 && (
                <div className="chat-suggestions">
                  <div className="chat-suggestions-title">
                    Opcionales sugeridos
                  </div>
                  <div className="chat-suggestions-row">
                    {aiOptionalSuggestions.map((chip) => {
                      const isUsed = usedSuggestionIds.includes(chip.id);
                      return (
                        <button
                          key={chip.id}
                          type="button"
                          className={`chat-chip ${isUsed ? "active" : ""}`}
                          disabled={isUsed}
                          aria-pressed={isUsed}
                          onClick={() => {
                            if (isUsed) return;
                            applySuggestionChip(chip);
                          }}
                        >
                          {renderChipLabel(chip)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="chat-input-row">
                <textarea
                  className="form-control light"
                  rows={4}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleAiChatSend();
                    }
                  }}
                  placeholder="Por ejemplo: Necesito 2000 flyers A5 en papel 135g"
                />
                <button
                  onClick={handleAiChatSend}
                  disabled={!chatInput.trim() || aiProcessing}
                  className="btn-icon"
                >
                  Enviar
                </button>
              </div>
              {aiDraft && (
                <small className="helper-text">
                  IA lista: puedes continuar al siguiente paso.
                </small>
              )}
              <div className="wizard-actions-row">
                <button
                  onClick={goPrevStep}
                  className="btn-icon btn-icon-circle"
                  aria-label="Volver"
                  title="Volver"
                >
                  <IconPrev />
                </button>
                <button
                  onClick={handleProcessStep}
                  disabled={!canProceedAi || aiProcessing}
                  className="btn-icon"
                  aria-label="Procesar"
                  title="Procesar"
                >
                  Procesar
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div key="step-4" {...motionVariants}>
            <div className="card" style={{ marginBottom: "16px" }}>
              <h3>4. Selección manual</h3>
              {items.length === 0 ? (
                <div style={{ display: "grid", gap: "12px" }}>
                  <small className="helper-text text-center">
                    Pulsa en “Añadir item” para incluir productos/servicios al
                    presupuesto. Podrás indicar cantidades y opciones
                    específicas.
                  </small>
                  <div className="button-center">
                    <button onClick={addItem} className="btn-add-item btn-icon">
                      <IconAdd />
                      Añadir item
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <small className="helper-text">Productos/Servicios seleccionados</small>
                  {items.map((item, index) => {
                    const optionData = item.productId
                      ? productOptions[item.productId]
                      : undefined;
                    return (
                      <div
                        key={item.id}
                        className="card"
                        style={{ marginTop: "8px" }}
                      >
                        <div
                          style={{
                            display: "grid",
                            gap: "8px",
                            gridTemplateColumns: "50% 35% 1fr",
                            alignItems: "center",
                          }}
                        >
                          <div style={{ display: "grid", gap: "6px" }}>
                            <small className="helper-text">
                              Selecciona el producto/servicio específico dentro del
                              sector elegido.
                            </small>
                            <select
                              className="form-select light"
                              value={item.productId}
                              onChange={(e) =>
                                updateItem(index, {
                                  productId: e.target.value,
                                  options: {},
                                })
                              }
                            >
                              <option value="">Selecciona producto/servicio</option>
                              {filteredProducts.map((product) => (
                                <option key={product.id} value={product.id}>
                                  {product.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div style={{ display: "grid", gap: "6px" }}>
                            <small className="helper-text">
                              Indica la cantidad necesaria para calcular el
                              precio.
                            </small>
                            <input
                              className="form-control light"
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) =>
                                updateItem(index, {
                                  quantity: Number(e.target.value),
                                })
                              }
                            />
                          </div>
                          <button
                            className="btn-half-height btn-remove-item"
                            onClick={() => removeItem(index)}
                          >
                            Eliminar
                          </button>
                        </div>

                        {optionData?.options?.length ? (
                          <div
                            style={{
                              marginTop: "8px",
                              display: "grid",
                              gap: "8px",
                            }}
                          >
                            {optionData.options.map((option) => {
                              const currentValue =
                                item.options[option.id] ?? "";
                              const values =
                                optionData.valuesByOptionId[option.id] ?? [];
                              if (option.optionType === "SELECT") {
                                return (
                                  <label key={option.id}>
                                    {option.name} {option.required ? "*" : ""}
                                    <select
                                      className="form-select light"
                                      value={currentValue}
                                      onChange={(e) =>
                                        updateItem(index, {
                                          options: {
                                            ...item.options,
                                            [option.id]: e.target.value,
                                          },
                                        })
                                      }
                                    >
                                      <option value="">Selecciona</option>
                                      {values.map((value) => (
                                        <option
                                          key={value.id}
                                          value={value.value ?? ""}
                                        >
                                          {value.value}
                                        </option>
                                      ))}
                                    </select>
                                    <small className="helper-text">
                                      Elige una de las opciones disponibles.
                                    </small>
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
                                        updateItem(index, {
                                          options: {
                                            ...item.options,
                                            [option.id]: e.target.value,
                                          },
                                        })
                                      }
                                    />
                                    <small className="helper-text">
                                      Introduce un valor numérico para esta
                                      opción.
                                    </small>
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
                                      updateItem(index, {
                                        options: {
                                          ...item.options,
                                          [option.id]: e.target.value,
                                        },
                                      })
                                    }
                                  >
                                    <option value="">Selecciona</option>
                                    <option value="true">true</option>
                                    <option value="false">false</option>
                                  </select>
                                  <small className="helper-text">
                                    Selecciona verdadero o falso.
                                  </small>
                                </label>
                              );
                            })}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                  <div className="button-center" style={{ marginTop: "22px" }}>
                    <button onClick={addItem} className="btn-add-item btn-icon">
                      <IconAdd />
                      Añadir item
                    </button>
                  </div>
                  <small className="helper-text text-center mt-2">
                    Agrega más productos/servicios si necesitas un presupuesto con varios
                    ítems.
                  </small>
                </>
              )}
              <div className="wizard-actions-row">
                <button
                  onClick={goPrevStep}
                  className="btn-icon btn-icon-circle"
                  aria-label="Volver"
                  title="Volver"
                >
                  <IconPrev />
                </button>
                <button
                  onClick={handleProcessStep}
                  className="btn-icon"
                  aria-label="Procesar"
                  title="Procesar"
                  disabled={!canProceedManual}
                >
                  Procesar
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 5 && (
          <motion.div key="step-5" {...motionVariants}>
            <div className="card" style={{ marginBottom: "16px" }}>
              <h3>5. Enviar solicitud</h3>
              <p className="helper-text">
                {createdQuote
                  ? "Tu presupuesto está listo."
                  : "Revisa tu información antes de enviar. El presupuesto se generará al instante."}
              </p>
              {submitMode === "ai" ? (
                <div>
                  {!createdQuote && (
                    <>
                      <strong>Modo:</strong> IA
                    </>
                  )}
                  {!createdQuote && (
                    <>
                      <div className="code-preview" style={{ marginTop: "8px" }}>
                        {submissionContext.requestText ? (
                          <ul className="chat-summary-list">
                            {submissionContext.requestText
                              .split("\n")
                              .map((line) => line.trim())
                              .filter(Boolean)
                              .map((line, index) => (
                                <li key={`${line}-${index}`}>{line}</li>
                              ))}
                          </ul>
                        ) : (
                          "Sin texto"
                        )}
                      </div>
                      {submissionContext.aiDraft ? (
                        <div style={{ marginTop: "8px", display: "grid", gap: "6px" }}>
                          <div className="helper-text">
                            Producto/Servicio: {submissionContext.aiDraft.productName}
                          </div>
                          <div className="helper-text">
                            Cantidad: {submissionContext.aiDraft.quantity}
                          </div>
                          {submissionContext.aiDraft.options.length > 0 && (
                            <div className="helper-text">
                              {submissionContext.aiDraft.options
                                .map(
                                  (opt) =>
                                    `${getOptionName(opt.optionId, submissionContext.aiDraft.productId)}: ${opt.value}`,
                                )
                                .join(" · ")}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="helper-text">
                          Aún no se ha completado el análisis. Vuelve al paso
                          anterior para enviar tu solicitud a la IA.
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : createdQuote ? null : (
                <div>
                  <strong>Modo:</strong> Manual
                  <div className="helper-text">
                    Items: {submissionContext.items.length}
                  </div>
                  <div
                    style={{
                      marginTop: "8px",
                      display: "flex",
                      flexWrap: "wrap",
                      justifyContent: "center",
                      gap: "8px",
                    }}
                  >
                    {submissionContext.items.map((item) => (
                      <div key={item.id} className="card summary-item-card">
                        <div>
                          <strong>{getProductName(item.productId)}</strong>
                        </div>
                        <div className="helper-text">
                          Cantidad: {item.quantity}
                        </div>
                        {Object.keys(item.options).length > 0 && (
                          <div
                            style={{
                              marginTop: "6px",
                              display: "grid",
                              gap: "4px",
                            }}
                          >
                            {Object.entries(item.options).map(
                              ([optionId, value]) => (
                                <div
                                  key={`${item.id}-${optionId}`}
                                  className="helper-text"
                                >
                                  {getOptionName(optionId, item.productId)}:{" "}
                                  {value}
                                </div>
                              ),
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="wizard-actions-row">
                {!createdQuote && (
                  <button
                    onClick={goPrevStep}
                    className="btn-icon btn-icon-circle"
                    aria-label="Volver"
                    title="Volver"
                  >
                    <IconPrev />
                  </button>
                )}
                <button
                  onClick={
                    submitMode === "ai" ? handleAiSubmit : handleManualSubmit
                  }
                  disabled={loading || !canSubmit}
                >
                  {createdQuote
                    ? "Presupuesto generado"
                    : loading
                      ? "Enviando..."
                      : "Enviar solicitud"}
                </button>
              </div>
              {error && <div className="auth-error">{error}</div>}
              {createdQuote && (
                <div className="quote-summary">
                  <div className="quote-summary-header">
                    <div>
                      <h4>Resumen del presupuesto</h4>
                      <div className="helper-text">
                        ID: {createdQuote.id} · Estado: {createdQuote.status}
                      </div>
                      {(() => {
                        const pdf = createdQuoteAttachments.find(
                          (att) =>
                            att.contentType?.includes("pdf") ||
                            att.fileName?.toLowerCase().endsWith(".pdf"),
                        );
                        return pdf ? (
                          <a
                            className="btn btn-outline-dark btn-sm"
                            href={pdf.url}
                            target="_blank"
                            rel="noreferrer"
                            style={{ marginTop: "8px", display: "inline-flex" }}
                          >
                            Descargar PDF
                          </a>
                        ) : (
                          <div className="helper-text" style={{ marginTop: "8px" }}>
                            Generando PDF...
                          </div>
                        );
                      })()}
                    </div>
                    <div className="quote-summary-total">
                      <span>Total</span>
                      <strong>
                        {formatMoney(createdQuote.totalPrice ?? 0)} €
                      </strong>
                    </div>
                  </div>
                  <div className="quote-summary-items">
                    {(createdQuote.items ?? []).map((item) => {
                      const lineTotal = calcLineTotal(item);
                      const frequencyInfo = getFrequencyInfo(item);
                      return (
                        <div key={item.id} className="quote-summary-item">
                          <div>
                            <strong>{getProductName(item.productId)}</strong>
                            <div className="helper-text">
                              Cantidad: {item.quantity ?? 1} · Unitario:{" "}
                              {formatMoney(item.unitPrice ?? 0)} €
                            </div>
                            {item.options && item.options.length > 0 && (
                              <div className="helper-text">
                                {item.options
                                  .map(
                                    (opt) =>
                                      `${getOptionName(opt.optionId, item.productId)}: ${opt.value ?? "-"}`,
                                  )
                                  .join(" · ")}
                              </div>
                            )}
                            {item.materials && item.materials.length > 0 && (
                              <div className="helper-text">
                                Materiales:{" "}
                                {item.materials
                                  .map(
                                    (mat) =>
                                      `${mat.materialName ?? mat.materialId} (${mat.quantity ?? 0} ${mat.unit ?? ""})`,
                                  )
                                  .join(" · ")}
                              </div>
                            )}
                            {frequencyInfo && (
                              <div className="helper-text">
                                Frecuencia: {frequencyInfo.label} · Precio por
                                visita: {formatMoney(lineTotal)} € · Estimado{" "}
                                {frequencyInfo.periodLabel}:{" "}
                                {formatMoney(
                                  lineTotal * frequencyInfo.multiplier,
                                )}{" "}
                                €
                              </div>
                            )}
                          </div>
                          <div className="quote-summary-line-total">
                            {formatMoney(lineTotal)} €
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {(() => {
                    const subtotal = (createdQuote.items ?? []).reduce(
                      (sum, item) => sum + calcLineTotal(item),
                      0,
                    );
                    const materialsTotal = (createdQuote.items ?? []).reduce(
                      (sum, item) =>
                        sum +
                        (item.materials ?? []).reduce((matSum, mat) => {
                          const total =
                            mat.totalCost ??
                            (mat.unitCost ?? 0) * (mat.quantity ?? 0);
                          return matSum + total;
                        }, 0),
                      0,
                    );
                    const discount = 0;
                    const vatRate = 0.21;
                    const vat = subtotal * vatRate;
                    const total = subtotal - discount + vat;
                    const hasFrequency = (createdQuote.items ?? []).some(
                      (item) => Boolean(getFrequencyInfo(item)),
                    );
                    const recurringSubtotal = hasFrequency
                      ? (createdQuote.items ?? []).reduce((sum, item) => {
                          const line = calcLineTotal(item);
                          const info = getFrequencyInfo(item);
                          const multiplier = info ? info.multiplier : 1;
                          return sum + line * multiplier;
                        }, 0)
                      : 0;
                    const recurringVat = recurringSubtotal * vatRate;
                    const recurringTotal =
                      recurringSubtotal - discount + recurringVat;
                    return (
                      <div className="quote-summary-breakdown">
                        <div>
                          <span>Subtotal</span>
                          <strong>{formatMoney(subtotal)} €</strong>
                        </div>
                        <div>
                          <span>Descuento</span>
                          <strong>{formatMoney(discount)} €</strong>
                        </div>
                        <div>
                          <span>Materiales total</span>
                          <strong>{formatMoney(materialsTotal)} €</strong>
                        </div>
                        <div>
                          <span>IVA (21%)</span>
                          <strong>{formatMoney(vat)} €</strong>
                        </div>
                        <div className="quote-summary-total-row">
                          <span>{hasFrequency ? "Total por visita" : "Total"}</span>
                          <strong>{formatMoney(total)} €</strong>
                        </div>
                        {hasFrequency && (
                          <div className="quote-summary-total-row">
                            <span>Estimado mensual (según frecuencia)</span>
                            <strong>{formatMoney(recurringTotal)} €</strong>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function QuantityLabelHint({
  sectorId,
  resolveProfile,
  sectorName,
}: {
  sectorId: string;
  resolveProfile: () => Promise<AiProfile | undefined>;
  sectorName: string;
}) {
  const [label, setLabel] = useState<string>("");

  useEffect(() => {
    let active = true;
    resolveProfile()
      .then((profile) => {
        if (!active) return;
        const profileLabel = profile?.quantityLabel?.trim() ?? "";
        if (profileLabel) {
          setLabel(profileLabel);
          return;
        }
        const normalizedSector = sectorName.toLowerCase();
        if (normalizedSector.includes("reformas") || normalizedSector.includes("pintura")) {
          setLabel("m²");
          return;
        }
        if (
          normalizedSector.includes("servicios") ||
          normalizedSector.includes("domest") ||
          normalizedSector.includes("limpieza")
        ) {
          setLabel("horas");
          return;
        }
        if (normalizedSector.includes("taller")) {
          setLabel("servicios");
          return;
        }
        if (normalizedSector.includes("imprenta")) {
          setLabel("unidades");
          return;
        }
        setLabel("");
      })
      .catch(() => {
        if (!active) return;
        setLabel("");
      });
    return () => {
      active = false;
    };
  }, [sectorId, resolveProfile, sectorName]);

  if (!label) return null;
  return (
    <div className="helper-text" style={{ marginBottom: "8px" }}>
      La cantidad se expresará en <strong>{label}</strong>.
    </div>
  );
}
