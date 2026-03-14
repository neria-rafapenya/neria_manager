export interface Tenant {
  id: string;
  name: string;
  sector?: string;
  companyEmail?: string;
  companyPhone?: string;
  companyAddress?: string;
  logoUrl?: string;
  active: boolean;
  createdAt: string;
}

export interface TenantUpdateRequest {
  name?: string;
  sector?: string;
  companyEmail?: string;
  companyPhone?: string;
  companyAddress?: string;
  logoUrl?: string;
  active?: boolean;
}
