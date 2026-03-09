import { ClaimDocument, ClaimDocumentKind } from "../entities/claim-document";

export interface CreateClaimDocumentInput {
  claimId: string;
  kind: ClaimDocumentKind;
  filename: string;
  mimeType: string;
  storageKey: string;
  sizeBytes: number;
  extractedFields: Record<string, unknown> | null;
  evidence: Record<string, unknown> | null;
}

export interface ClaimDocumentRepository {
  create(input: CreateClaimDocumentInput): Promise<ClaimDocument>;
  listByClaim(claimId: string): Promise<ClaimDocument[]>;
}
