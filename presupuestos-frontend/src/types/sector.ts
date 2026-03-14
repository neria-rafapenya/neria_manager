export interface Sector {
  id: string;
  tenantId?: string;
  name: string;
  active: boolean;
  catalogType?: "INTERNAL" | "EXTERNAL";
  externalApiBaseUrl?: string;
  externalProductsEndpoint?: string;
  externalProductEndpoint?: string;
  externalProductOptionsEndpoint?: string;
  externalOptionValuesEndpoint?: string;
  createdAt?: string;
}

export interface SectorCreateRequest {
  name: string;
  active?: boolean;
  catalogType?: "INTERNAL" | "EXTERNAL";
  externalApiBaseUrl?: string;
  externalApiToken?: string;
  externalProductsEndpoint?: string;
  externalProductEndpoint?: string;
  externalProductOptionsEndpoint?: string;
  externalOptionValuesEndpoint?: string;
}

export interface SectorUpdateRequest {
  name?: string;
  active?: boolean;
  catalogType?: "INTERNAL" | "EXTERNAL";
  externalApiBaseUrl?: string;
  externalApiToken?: string;
  externalProductsEndpoint?: string;
  externalProductEndpoint?: string;
  externalProductOptionsEndpoint?: string;
  externalOptionValuesEndpoint?: string;
}
