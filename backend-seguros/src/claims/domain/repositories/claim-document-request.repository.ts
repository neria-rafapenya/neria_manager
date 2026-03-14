import type { ClaimDocumentKind } from "../entities/claim-document";
import type { ClaimDocumentRequest, ClaimDocumentRequestStatus } from "../entities/claim-document-request";

export interface CreateClaimDocumentRequestInput {
  claimId: string;
  kind: ClaimDocumentKind;
  message: string;
  status: ClaimDocumentRequestStatus;
  requestedBy: string;
  createdAt: Date;
  resolvedAt: Date | null;
}

export interface ClaimDocumentRequestRepository {
  create(input: CreateClaimDocumentRequestInput): Promise<ClaimDocumentRequest>;
  listByClaim(claimId: string): Promise<ClaimDocumentRequest[]>;
  listAll(): Promise<ClaimDocumentRequest[]>;
  listPendingByClaim(claimId: string): Promise<ClaimDocumentRequest[]>;
  markResolvedByClaimAndKind(claimId: string, kind: ClaimDocumentKind): Promise<void>;
}
