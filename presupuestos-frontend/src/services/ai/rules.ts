export type AiManualData = {
  quantity?: number;
  options: Record<string, string>;
  formula?: string;
};

export function normalize(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function isQuantityOptionName(value?: string | null) {
  if (!value) return false;
  const normalized = normalize(value);
  return [
    "cantidad",
    "qty",
    "unidades",
    "units",
    "cantidad total",
    "ejemplares",
    "ejemplar",
    "numero de ejemplares",
    "cantidad de ejemplares",
    "copias",
    "numero de copias",
  ].includes(normalized);
}

export function isSizeOptionName(optionName: string) {
  const normalized = normalize(optionName);
  return (
    normalized.includes("formato") ||
    normalized.includes("tamaño") ||
    normalized.includes("tamano")
  );
}

export function isBindingOptionName(optionName: string) {
  const normalized = normalize(optionName);
  return normalized.includes("encuadern");
}

export function isPaperOptionName(optionName: string) {
  const normalized = normalize(optionName);
  return normalized.includes("papel");
}

export function isColorOptionName(optionName: string) {
  const normalized = normalize(optionName);
  return normalized.includes("color");
}

export function isPageOptionName(optionName: string) {
  const normalized = normalize(optionName);
  return normalized.includes("pagin") || normalized.includes("hoja");
}
