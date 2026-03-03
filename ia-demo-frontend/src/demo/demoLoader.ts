import type { DemoConfig, DemoConfigResponse } from "./types";

const sanitize = (value?: string): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (
    (trimmed.startsWith("\"") && trimmed.endsWith("\"")) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
};

const DEMO_CONFIG_URL = sanitize(import.meta.env.VITE_DEMO_CONFIG_URL as string | undefined);
const DEMO_CONFIG_JSON = sanitize(import.meta.env.VITE_DEMO_CONFIG as string | undefined);
const DEMO_CONFIG_PATH =
  sanitize(import.meta.env.VITE_DEMO_CONFIG_PATH as string | undefined) || "/demos.json";
const DEMO_API_BASE_URL = sanitize(
  (import.meta.env.VITE_DEMO_API_BASE_URL as string | undefined)
    || (import.meta.env.VITE_API_BASE_URL as string | undefined)
);

const normalize = (data: DemoConfigResponse): DemoConfig[] => {
  const applyBaseUrl = (items: DemoConfig[]) => {
    if (!DEMO_API_BASE_URL) return items;
    return items.map((demo) => ({
      ...demo,
      apiBaseUrl: DEMO_API_BASE_URL,
      apiUrl: DEMO_API_BASE_URL,
    }));
  };

  if (Array.isArray(data)) {
    return applyBaseUrl(data);
  }
  if (data && Array.isArray((data as any).demos)) {
    return applyBaseUrl((data as any).demos as DemoConfig[]);
  }
  return [];
};

export const loadDemos = async (): Promise<DemoConfig[]> => {
  if (DEMO_CONFIG_URL) {
    const response = await fetch(DEMO_CONFIG_URL);
    if (!response.ok) {
      throw new Error(`No se pudo cargar demos (${response.status})`);
    }
    const data = (await response.json()) as DemoConfigResponse;
    return normalize(data);
  }

  if (DEMO_CONFIG_JSON) {
    const parsed = JSON.parse(DEMO_CONFIG_JSON) as DemoConfigResponse;
    return normalize(parsed);
  }

  const response = await fetch(DEMO_CONFIG_PATH);
  if (!response.ok) {
    return [];
  }
  const data = (await response.json()) as DemoConfigResponse;
  return normalize(data);
};
