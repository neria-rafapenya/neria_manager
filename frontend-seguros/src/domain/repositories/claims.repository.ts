import type { Claim, ClaimDocument, ClaimDocumentRequest, CreateClaimInput } from "../models/claim";

export interface ClaimsRepository {
  list(): Promise<Claim[]>;
  getById(id: string): Promise<Claim | null>;
  create(input: CreateClaimInput): Promise<Claim>;
  listDocuments(claimId: string): Promise<ClaimDocument[]>;
  assign(claimId: string, agentId: string): Promise<Claim>;
  requestDocument(
    claimId: string,
    payload: { kind: string; message?: string; aiMessage?: string },
  ): Promise<ClaimDocumentRequest>;
  previewDocumentRequest(
    claimId: string,
    payload: { kind: string; message?: string },
  ): Promise<{ message: string }>;
  listDocumentRequests(): Promise<ClaimDocumentRequest[]>;
  listMyClaims(): Promise<Claim[]>;
  getMyClaim(claimId: string): Promise<Claim | null>;
  getSummary(claimId: string): Promise<{ summary: string }>;
  getUserExplanation(claimId: string): Promise<{ explanation: string }>;
  listMyDocumentRequests(claimId: string): Promise<ClaimDocumentRequest[]>;
  uploadDocument(
    claimId: string,
    payload: { kind: string; filename: string; mimeType: string; base64: string },
  ): Promise<ClaimDocument>;
}
