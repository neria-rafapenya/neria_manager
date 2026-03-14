export interface Customer {
  id: string;
  tenantId: string;
  name?: string;
  email?: string;
  phone?: string;
  userId?: string;
  createdAt: string;
}

export interface CustomerCreateRequest {
  name?: string;
  email?: string;
  phone?: string;
}

export interface CustomerUpdateRequest {
  name?: string;
  email?: string;
  phone?: string;
}
