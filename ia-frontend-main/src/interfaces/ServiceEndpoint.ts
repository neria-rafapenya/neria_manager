export interface ServiceEndpoint {
  id: string;
  tenantId: string;
  serviceCode: string;
  slug: string;
  method: string;
  path: string;
  baseUrl?: string | null;
  enabled: boolean;
  headers?: Record<string, string> | null;
  createdAt?: string;
  updatedAt?: string;
}
