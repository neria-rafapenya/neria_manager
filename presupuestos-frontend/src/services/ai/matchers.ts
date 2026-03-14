import { OptionValue, ProductOption } from "../../types/product";
import {
  AiManualData,
  isBindingOptionName,
  isColorOptionName,
  isPaperOptionName,
  isPageOptionName,
  isQuantityOptionName,
  isSizeOptionName,
  normalize,
} from "./rules";

export function buildOptionSuggestions(
  option: ProductOption,
  values?: OptionValue[],
) {
  if (option.optionType === "BOOLEAN") {
    const list = (values ?? [])
      .map((value) => value.value ?? "")
      .map((value) => value.trim())
      .filter((value) => value.length > 0);
    return list.length > 0 ? list : ["true", "false"];
  }
  if (option.optionType !== "SELECT") return [];
  return (values ?? [])
    .map((value) => value.value ?? "")
    .filter((value) => value.trim().length > 0);
}

export function filterMissingFields(
  missingFields: string[],
  manualData: AiManualData,
) {
  return missingFields.filter((field) => {
    if (field === "quantity") return !manualData.quantity;
    if (field === "formula") return !manualData.formula;
    if (field.startsWith("option:")) {
      const name = field.replace("option:", "").trim();
      return !manualData.options?.[name];
    }
    return true;
  });
}

export function extractManualData(
  text: string,
  missingFields: string[],
  optionSuggestions?: Record<string, string[]>,
  formulaSuggestions?: string[],
): AiManualData {
  const data: AiManualData = { options: {} };
  const normalizedText = normalize(text);
  const detected = detectOptionTokens(text);
  const numberCandidates = extractNumbers(text);
  const explicitPages = extractExplicitPages(text);
  const explicitQuantity = extractExplicitQuantity(text);

  if (missingFields.includes("quantity")) {
    if (explicitQuantity) {
      data.quantity = explicitQuantity;
    } else if (numberCandidates.length > 0) {
      data.quantity = numberCandidates[0];
    }
  }

  const optionMissing = missingFields
    .filter((field) => field.startsWith("option:"))
    .map((field) => field.replace("option:", "").trim())
    .filter(Boolean)
    .filter((name) => !isQuantityOptionName(name));

  const quantityOptionMissing = missingFields
    .filter((field) => field.startsWith("option:"))
    .map((field) => field.replace("option:", "").trim())
    .filter(Boolean)
    .filter((name) => isQuantityOptionName(name));

  if (quantityOptionMissing.length > 0 && (explicitQuantity || numberCandidates.length > 0)) {
    const quantityValue = explicitQuantity ?? numberCandidates[0];
    if (!data.quantity) {
      data.quantity = quantityValue;
    }
    quantityOptionMissing.forEach((optionName) => {
      data.options[optionName] = String(quantityValue);
    });
  }

  const pageOptionMissing = missingFields
    .filter((field) => field.startsWith("option:"))
    .map((field) => field.replace("option:", "").trim())
    .filter(Boolean)
    .filter((name) => isPageOptionName(name));

  if (pageOptionMissing.length > 0 && explicitPages) {
    pageOptionMissing.forEach((optionName) => {
      data.options[optionName] = String(explicitPages);
    });
  } else if (quantityOptionMissing.length > 0 && pageOptionMissing.length > 0) {
    if (numberCandidates.length >= 2) {
      const [first, second] = numberCandidates;
      quantityOptionMissing.forEach((optionName) => {
        data.options[optionName] = String(first);
      });
      pageOptionMissing.forEach((optionName) => {
        data.options[optionName] = String(second);
      });
    }
  } else if (pageOptionMissing.length > 0 && numberCandidates.length === 1) {
    const only = numberCandidates[0];
    pageOptionMissing.forEach((optionName) => {
      data.options[optionName] = String(only);
    });
  }

  optionMissing.forEach((optionName) => {
    if (data.options?.[optionName]) {
      return;
    }
    const suggestions = optionSuggestions?.[optionName] ?? [];
    const suggestionMatch = suggestions.find((suggestion) =>
      normalizedText.includes(normalize(suggestion)),
    );
    if (suggestionMatch) {
      data.options[optionName] = suggestionMatch;
      return;
    }
    const extracted = extractOptionValueFromText(optionName, text);
    if (extracted) {
      data.options[optionName] = extracted;
      return;
    }
    if (detected.binding && isBindingOptionName(optionName)) {
      data.options[optionName] = detected.binding;
      return;
    }
    if (detected.size && isSizeOptionName(optionName)) {
      data.options[optionName] = detected.size;
      return;
    }
    if (detected.paper && isPaperOptionName(optionName)) {
      data.options[optionName] = detected.paper;
      return;
    }
    if (detected.color && isColorOptionName(optionName)) {
      data.options[optionName] = detected.color;
    }
  });

  if (missingFields.includes("formula") && formulaSuggestions) {
    const match = formulaSuggestions.find((formula) =>
      normalizedText.includes(normalize(formula)),
    );
    if (match) {
      data.formula = match;
    }
  }

  return data;
}

export function extractOptionValueFromText(optionName: string, text: string) {
  const normalizedName = normalize(optionName);
  const normalizedText = normalize(text);
  const trimmed = text.trim();
  const numericOnly = trimmed.match(/^(\d{1,6})$/);
  if (numericOnly && isPageOptionName(optionName)) {
    return numericOnly[1];
  }
  if (
    normalizedName.includes("ejemplar") ||
    normalizedName.includes("copia") ||
    normalizedName.includes("unidad")
  ) {
    const copiesMatch =
      text.match(/(\d{1,9})[\s,.]*?(?:ejemplares|copias|unidades|uds|ud)\b/i) ??
      text.match(/(?:ejemplares|copias|unidades|uds|ud)[\s,.]*?(\d{1,9})/i);
    if (copiesMatch) {
      const copies = Number(copiesMatch[1]);
      if (!Number.isNaN(copies) && copies > 0) {
        return String(copies);
      }
    }
  }
  if (normalizedName.includes("pagin") || normalizedName.includes("hoja")) {
    const pagesMatch =
      text.match(/(?:p[aá]ginas|paginas|hojas)[\s,.]*?(\d{1,6})/i) ??
      text.match(/(\d{1,6})[\s,.]*?(?:p[aá]ginas|paginas|hojas)/i) ??
      text.match(/\b(?:de|con)[\s,.]*?(\d{1,6})[\s,.]*?(?:p[aá]ginas|paginas|hojas)\b/i);
    if (pagesMatch) {
      const pages = Number(pagesMatch[1]);
      if (!Number.isNaN(pages) && pages > 0) {
        return String(pages);
      }
    }
  }
  if (normalizedName.includes("papel")) {
    const match = text.match(/(\d{2,3}\s?g)\b/i);
    if (match) {
      return match[1].replace(/\s+/g, "");
    }
  }
  if (
    normalizedName.includes("formato") ||
    normalizedName.includes("tamaño") ||
    normalizedName.includes("tamano")
  ) {
    const match = text.match(/\b(A|B)\s?(\d)\b/i);
    if (match) {
      return `${match[1].toUpperCase()}${match[2]}`;
    }
  }
  if (normalizedName.includes("encuadern")) {
    if (normalizedText.includes("tapa dura")) return "Tapa dura";
    if (normalizedText.includes("tapa blanda")) return "Tapa blanda";
  }
  if (normalizedName.includes("color")) {
    if (normalizedText.includes("b/n") || normalizedText.includes("bn")) {
      return "B/N";
    }
    if (normalizedText.includes("color")) {
      return "Color";
    }
  }
  if (normalizedText.includes(normalizedName)) {
    return optionName;
  }
  return null;
}

export function detectOptionTokens(text: string) {
  const normalizedText = normalize(text);
  let size: string | null = null;
  let binding: string | null = null;
  let paper: string | null = null;
  let color: string | null = null;

  const sizeMatch = text.match(/\b(A|B)\s?(\d)\b/i);
  if (sizeMatch) {
    size = `${sizeMatch[1].toUpperCase()}${sizeMatch[2]}`;
  }
  if (normalizedText.includes("tapa dura")) binding = "Tapa dura";
  if (normalizedText.includes("tapa blanda")) binding = "Tapa blanda";

  const paperMatch = text.match(/(\d{2,3}\s?g)\b/i);
  if (paperMatch) {
    paper = paperMatch[1].replace(/\s+/g, "");
  }

  if (normalizedText.includes("b/n") || normalizedText.includes("bn")) {
    color = "B/N";
  } else if (normalizedText.includes("color")) {
    color = "Color";
  }

  return { size, binding, paper, color };
}

function extractExplicitPages(text: string) {
  const match =
    text.match(/(?:p[aá]ginas|paginas|hojas)[\s,.]*?(\d{1,6})/i) ??
    text.match(/(\d{1,6})[\s,.]*?(?:p[aá]ginas|paginas|hojas)/i) ??
    text.match(/\b(?:de|con)[\s,.]*?(\d{1,6})[\s,.]*?(?:p[aá]ginas|paginas|hojas)\b/i);
  if (!match) return null;
  const pages = Number(match[1]);
  return !Number.isNaN(pages) && pages > 0 ? pages : null;
}

function extractExplicitQuantity(text: string) {
  const match =
    text.match(/(\d{1,9})[\s,.]*?(?:ejemplares|copias|unidades|uds|ud)\b/i) ??
    text.match(/(?:ejemplares|copias|unidades|uds|ud)[\s,.]*?(\d{1,9})/i);
  if (!match) return null;
  const qty = Number(match[1]);
  return !Number.isNaN(qty) && qty > 0 ? qty : null;
}

function extractNumbers(text: string) {
  const matches = Array.from(
    text.matchAll(/\d{1,3}(?:[.,]\d{3})+|\d{1,9}/g),
  );
  return matches
    .map((match) => {
      const raw = match[0];
      const index = match.index ?? 0;
      const before = text.slice(Math.max(0, index - 1), index);
      const after = text.slice(index + raw.length);
      if (/[aAbB]/.test(before)) {
        return null;
      }
      if (/^\s*(g|gr|grs|gramos)\b/i.test(after)) {
        return null;
      }
      const normalized = raw.replace(/[.,]/g, "");
      const num = Number(normalized);
      return !Number.isNaN(num) && num > 0 ? num : null;
    })
    .filter((num): num is number => num !== null);
}

export function resolveRequiredOptionNames(
  options: ProductOption[],
  requiredOptions: string[],
) {
  const resolved = new Map<string, string>();
  requiredOptions.forEach((required) => {
    const normalizedRequired = normalize(required);
    let match: ProductOption | undefined;
    if (isPageOptionName(required)) {
      match = options.find((option) => isPageOptionName(option.name ?? ""));
    } else if (isSizeOptionName(required)) {
      match = options.find((option) => isSizeOptionName(option.name ?? ""));
    } else if (isBindingOptionName(required)) {
      match = options.find((option) => isBindingOptionName(option.name ?? ""));
    } else if (isPaperOptionName(required)) {
      match = options.find((option) => isPaperOptionName(option.name ?? ""));
    } else if (isColorOptionName(required)) {
      match = options.find((option) => isColorOptionName(option.name ?? ""));
    } else {
      match =
        options.find(
          (option) => normalize(option.name ?? "") === normalizedRequired,
        ) ??
        options.find((option) =>
          normalize(option.name ?? "").includes(normalizedRequired),
        );
    }
    if (match?.name) {
      resolved.set(normalize(match.name), match.name);
    }
  });
  return Array.from(resolved.values());
}
