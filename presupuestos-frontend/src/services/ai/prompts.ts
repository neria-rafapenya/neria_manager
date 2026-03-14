import { isQuantityOptionName } from "./rules";

export function buildMissingPrompt(
  missingFields: string[],
  optionSuggestions: Record<string, string[]> | undefined,
  formulaSuggestions: string[] | undefined,
  hasOptionChips: boolean,
  hasFormulaChips: boolean,
  quantityPrompt?: string,
  optionQuestionMap?: Record<string, string>,
  optionalQuestions?: string[],
) {
  const actionableMissing = missingFields.filter((field) => {
    if (field.startsWith("option:")) {
      const name = field.replace("option:", "").trim();
      return name && !isQuantityOptionName(name);
    }
    return true;
  });

  if (!actionableMissing.length) {
    return "Perfecto, ya tengo todo. Pulsa Procesar para continuar.";
  }

  const parts: string[] = [
    "Necesito algunos datos para completar el presupuesto.",
  ];
  if (actionableMissing.includes("product")) {
    parts.push("¿Qué producto/servicio necesitas?");
  }
  if (actionableMissing.includes("quantity")) {
    parts.push(quantityPrompt ?? "¿Qué cantidad necesitas?");
  }
  const optionMissing = actionableMissing
    .filter((field) => field.startsWith("option:"))
    .map((field) => field.replace("option:", "").trim())
    .filter(Boolean)
    .filter((name) => !isQuantityOptionName(name));
  if (optionMissing.length) {
    const questions =
      optionQuestionMap && Object.keys(optionQuestionMap).length > 0
        ? optionMissing.map(
            (name) => optionQuestionMap[name] ?? `¿Puedes indicar ${name}?`,
          )
        : [];
    if (questions.length) {
      parts.push(questions.join(" "));
      if (hasOptionChips) {
        parts.push("También puedes usar los chips.");
      }
    } else if (hasOptionChips) {
      parts.push("Completa las opciones pendientes usando los chips.");
    } else {
      parts.push(`Indica: ${optionMissing.join(", ")}.`);
    }
  }
  if (actionableMissing.includes("formula")) {
    if (hasFormulaChips) {
      parts.push("Selecciona una fórmula usando los chips.");
    } else if (formulaSuggestions && formulaSuggestions.length > 0) {
      parts.push(`Elige una fórmula: ${formulaSuggestions.join(", ")}.`);
    } else {
      parts.push("Indica la fórmula a aplicar.");
    }
  }
  if (optionalQuestions && optionalQuestions.length) {
    parts.push(optionalQuestions.join(" "));
  }
  parts.push("Escríbelo y lo preparo.");
  return parts.join(" ");
}

export function buildSuggestionChips(
  missingFields: string[],
  optionSuggestions?: Record<string, string[]>,
  formulaSuggestions?: string[],
) {
  const chips: { id: string; label: string; value: string }[] = [];
  const optionMissing = missingFields
    .filter((field) => field.startsWith("option:"))
    .map((field) => field.replace("option:", "").trim())
    .filter(Boolean)
    .filter((name) => !isQuantityOptionName(name));
  optionMissing.forEach((optionName) => {
    const suggestions = optionSuggestions?.[optionName] ?? [];
    suggestions.forEach((suggestion) => {
      const value = `${optionName}: ${suggestion}`;
      chips.push({
        id: `opt-${optionName}-${suggestion}`,
        label: value,
        value,
      });
    });
  });
  if (missingFields.includes("formula")) {
    (formulaSuggestions ?? []).forEach((formula) => {
      const value = `Fórmula: ${formula}`;
      chips.push({
        id: `formula-${formula}`,
        label: value,
        value,
      });
    });
  }
  return chips.sort((a, b) => a.label.localeCompare(b.label, "es"));
}
