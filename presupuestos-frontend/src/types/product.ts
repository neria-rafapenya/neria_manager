export type PricingType = "FIXED" | "UNIT" | "FORMULA";
export type OptionType = "SELECT" | "NUMBER" | "BOOLEAN";

export interface Product {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  sectorId?: string;
  sectorName?: string;
  pricingType?: PricingType;
  formulaId?: string;
  formulaName?: string;
  basePrice?: number;
  active: boolean;
  createdAt?: string;
}

export interface ProductCreateRequest {
  name: string;
  description?: string;
  sectorId?: string;
  pricingType?: PricingType;
  formulaId?: string;
  basePrice?: number;
  active?: boolean;
}

export interface ProductUpdateRequest {
  name?: string;
  description?: string;
  sectorId?: string;
  pricingType?: PricingType;
  formulaId?: string;
  basePrice?: number;
  active?: boolean;
}

export interface ProductOption {
  id: string;
  productId: string;
  name: string;
  optionType?: OptionType;
  required: boolean;
}

export interface ProductOptionCreateRequest {
  name: string;
  optionType?: OptionType;
  required?: boolean;
}

export interface ProductOptionUpdateRequest {
  name?: string;
  optionType?: OptionType;
  required?: boolean;
}

export interface OptionValue {
  id: string;
  optionId: string;
  value?: string;
  priceModifier?: number;
}

export interface OptionValueCreateRequest {
  value?: string;
  priceModifier?: number;
}

export interface OptionValueUpdateRequest {
  value?: string;
  priceModifier?: number;
}
