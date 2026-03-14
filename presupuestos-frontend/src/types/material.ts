export type MaterialRuleType =
  | "FLOOR_AREA"
  | "WALL_AREA"
  | "LINEAR"
  | "PER_UNIT"
  | "FIXED";

export interface Material {
  id: string;
  tenantId?: string;
  sectorId?: string;
  name: string;
  unit: string;
  costPerUnit: number;
  active?: boolean;
  createdAt?: string;
}

export interface MaterialCreateRequest {
  sectorId: string;
  name: string;
  unit: string;
  costPerUnit?: number;
  active?: boolean;
}

export interface MaterialUpdateRequest {
  sectorId?: string;
  name?: string;
  unit?: string;
  costPerUnit?: number;
  active?: boolean;
}

export interface ProductMaterialRule {
  id: string;
  tenantId?: string;
  productId: string;
  materialId: string;
  materialName?: string;
  unit?: string;
  ruleType: MaterialRuleType;
  quantityFactor?: number;
  wastePercent?: number;
  qualityTier?: string;
  active?: boolean;
  createdAt?: string;
}

export interface ProductMaterialCreateRequest {
  materialId: string;
  ruleType: MaterialRuleType;
  quantityFactor?: number;
  wastePercent?: number;
  qualityTier?: string;
  active?: boolean;
}

export interface ProductMaterialUpdateRequest {
  materialId?: string;
  ruleType?: MaterialRuleType;
  quantityFactor?: number;
  wastePercent?: number;
  qualityTier?: string;
  active?: boolean;
}

export interface QuoteMaterial {
  id: string;
  quoteItemId: string;
  materialId: string;
  materialName?: string;
  unit?: string;
  quantity?: number;
  unitCost?: number;
  totalCost?: number;
}
