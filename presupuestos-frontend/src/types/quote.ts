import { PricingType } from "./product";

export type QuoteStatus = "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED";

export interface QuoteItemOption {
  id: string;
  quoteItemId: string;
  optionId: string;
  value?: string;
  priceModifier?: number;
}

export interface QuoteItemOptionCreateRequest {
  optionId: string;
  value?: string;
  priceModifier?: number;
}

export interface QuoteItem {
  id: string;
  quoteId: string;
  productId: string;
  formulaId?: string;
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
  options?: QuoteItemOption[];
  materials?: import("./material").QuoteMaterial[];
}

export interface QuoteItemCreateRequest {
  productId: string;
  quantity?: number;
  options?: QuoteItemOptionCreateRequest[];
  formulaId?: string;
  formulaName?: string;
}

export interface Quote {
  id: string;
  tenantId: string;
  customerId?: string;
  sector?: string;
  status: QuoteStatus;
  totalPrice?: number;
  createdAt?: string;
  items?: QuoteItem[];
}

export interface QuoteCreateRequest {
  customerId?: string;
  sector?: string;
  items?: QuoteItemCreateRequest[];
}

export interface QuoteUpdateRequest {
  status?: QuoteStatus;
  sector?: string;
  items?: QuoteItemCreateRequest[];
}

export interface QuoteCalculationRequest {
  productId: string;
  quantity: number;
  options?: Record<string, string>;
}

export interface PriceResult {
  basePrice?: number;
  modifiers?: number;
  total?: number;
}

export interface QuoteCalculationResponse {
  totalPrice?: number;
  breakdown?: PriceResult;
}

export interface PricingStrategyDescriptor {
  pricingType: PricingType;
}

export interface QuoteAttachment {
  id: string;
  tenantId: string;
  quoteId: string;
  url: string;
  fileName?: string;
  contentType?: string;
  createdAt?: string;
}

export interface QuoteAttachmentCreateRequest {
  url: string;
  fileName?: string;
  contentType?: string;
}
