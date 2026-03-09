export type ClaimType = "auto" | "hogar" | "salud" | "vida" | "multirriesgo";
export type ClaimStatus =
  | "nuevo"
  | "en_revision"
  | "pendiente_documentos"
  | "peritaje"
  | "resuelto"
  | "cerrado";

export type CompletenessStatus = "incompleto" | "parcial" | "completo";

export interface Claim {
  id: string;
  claimNumber: string;
  type: ClaimType;
  status: ClaimStatus;
  policyNumber: string | null;
  lossDate: string | null;
  reportedAt: string;
  description: string | null;
  urgency: boolean;
  thirdPartyInvolved: boolean;
  completenessStatus: CompletenessStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ClaimDocument {
  id: string;
  claimId: string;
  kind: string;
  filename: string;
  mimeType: string;
  storageKey: string;
  sizeBytes: number;
  extractedFields?: Record<string, unknown> | null;
  evidence?: Record<string, unknown> | null;
  createdAt: string;
}

export interface CreateClaimInput {
  type: ClaimType;
  policyNumber?: string;
  lossDate?: string;
  description?: string;
  urgency?: boolean;
  thirdPartyInvolved?: boolean;
}
