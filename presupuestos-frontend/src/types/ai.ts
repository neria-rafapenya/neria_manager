export interface AiParseRequest {
  text: string;
  sector?: string;
  sectorId?: string;
}

export interface AiParseResponse {
  product?: string;
  productId?: string;
  quantity?: number;
  options?: Record<string, string | null>;
  confidence?: number;
  missingFields?: string[];
  optionSuggestions?: Record<string, string[]>;
  formulaSuggestions?: string[];
}

export interface AiRequestLog {
  id: string;
  tenantId?: string;
  inputText?: string;
  parsedJson?: string;
  confidence?: number;
  errorMessage?: string;
  createdAt?: string;
}

export interface AiProfile {
  id: string;
  tenantId?: string;
  sectorId?: string;
  sectorName?: string;
  productId?: string;
  productName?: string;
  requiredOptionNames?: string[];
  promptInstructions?: string;
  quantityLabel?: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
