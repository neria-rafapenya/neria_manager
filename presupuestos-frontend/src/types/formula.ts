export interface Formula {
  id: string;
  tenantId?: string;
  sectorId?: string;
  sectorName?: string;
  productId?: string;
  productName?: string;
  name: string;
  description?: string;
  basePrice?: number;
  unitPrice?: number;
  active: boolean;
  createdAt?: string;
}

export interface FormulaCreateRequest {
  sectorId: string;
  productId?: string;
  name: string;
  description?: string;
  basePrice?: number;
  unitPrice?: number;
  active?: boolean;
}

export interface FormulaUpdateRequest {
  sectorId?: string;
  productId?: string;
  name?: string;
  description?: string;
  basePrice?: number;
  unitPrice?: number;
  active?: boolean;
}
