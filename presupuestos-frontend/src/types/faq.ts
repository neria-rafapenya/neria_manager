export interface Faq {
  id: string;
  tenantId: string;
  question: string;
  answer?: string;
  orderIndex?: number;
  createdAt?: string;
}

export interface FaqCreateRequest {
  question: string;
  answer?: string;
  orderIndex?: number;
}

export interface FaqUpdateRequest {
  question?: string;
  answer?: string;
  orderIndex?: number;
}
