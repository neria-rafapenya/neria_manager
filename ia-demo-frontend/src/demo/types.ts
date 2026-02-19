export type DemoConfig = {
  code: string;
  name: string;
  description?: string | null;
  mode?: "chat" | "email" | "surveys" | "embed" | "financial";
  serviceMode?: "chat" | "email" | "financial";
  apiBaseUrl?: string | null;
  apiUrl?: string | null;
  apiKey?: string | null;
  tenantId?: string | null;
  serviceCode?: string | null;
  serviceId?: string | null;
  providerId?: string | null;
  model?: string | null;
  chatEndpoint?: string | null;
  chatAuthMode?: "local" | "none";
  chatbotRestricted?: boolean;
  chatbotOpened?: boolean;
  captchaEnabled?: boolean;
  recaptchaSiteKey?: string | null;
  embedUrl?: string | null;
};

export type DemoConfigResponse = DemoConfig[] | { demos: DemoConfig[] };
