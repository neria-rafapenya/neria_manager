export type DemoRuntimeConfig = {
  demoCode?: string;
  name?: string;
  description?: string;
  mode?: "chat" | "email" | "surveys" | "embed";
  serviceMode?: "chat" | "email";
  apiBaseUrl?: string;
  apiUrl?: string;
  apiKey?: string;
  tenantId?: string;
  serviceCode?: string;
  serviceId?: string;
  providerId?: string;
  model?: string;
  chatEndpoint?: string;
  chatAuthMode?: "local" | "none";
  chatbotRestricted?: boolean;
  chatbotOpened?: boolean;
  captchaEnabled?: boolean;
  recaptchaSiteKey?: string;
  embedUrl?: string;
};

let runtimeConfig: DemoRuntimeConfig | null = null;

export const setRuntimeConfig = (config: DemoRuntimeConfig | null) => {
  runtimeConfig = config;
};

export const getRuntimeConfig = (): DemoRuntimeConfig | null => runtimeConfig;
