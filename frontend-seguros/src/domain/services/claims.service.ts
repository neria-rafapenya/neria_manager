import type { Claim, ClaimDocument, ClaimDocumentRequest, CreateClaimInput } from "../models/claim";
import type { ClaimsRepository } from "../repositories/claims.repository";

export class ClaimsService {
  private readonly repository: ClaimsRepository;

  constructor(repository: ClaimsRepository) {
    this.repository = repository;
  }

  listClaims(): Promise<Claim[]> {
    return this.repository.list();
  }

  getClaim(id: string): Promise<Claim | null> {
    return this.repository.getById(id);
  }

  createClaim(input: CreateClaimInput): Promise<Claim> {
    return this.repository.create(input);
  }

  listDocuments(claimId: string): Promise<ClaimDocument[]> {
    return this.repository.listDocuments(claimId);
  }

  assignClaim(claimId: string, agentId: string): Promise<Claim> {
    return this.repository.assign(claimId, agentId);
  }

  requestDocument(
    claimId: string,
    payload: { kind: string; message?: string; aiMessage?: string },
  ): Promise<ClaimDocumentRequest> {
    return this.repository.requestDocument(claimId, payload);
  }

  previewDocumentRequest(
    claimId: string,
    payload: { kind: string; message?: string },
  ): Promise<{ message: string }> {
    return this.repository.previewDocumentRequest(claimId, payload);
  }

  listDocumentRequests(): Promise<ClaimDocumentRequest[]> {
    return this.repository.listDocumentRequests();
  }

  listMyClaims(): Promise<Claim[]> {
    return this.repository.listMyClaims();
  }

  getMyClaim(claimId: string): Promise<Claim | null> {
    return this.repository.getMyClaim(claimId);
  }

  getSummary(claimId: string): Promise<{ summary: string }> {
    return this.repository.getSummary(claimId);
  }

  getUserExplanation(claimId: string): Promise<{ explanation: string }> {
    return this.repository.getUserExplanation(claimId);
  }

  listMyDocumentRequests(claimId: string): Promise<ClaimDocumentRequest[]> {
    return this.repository.listMyDocumentRequests(claimId);
  }

  uploadDocument(
    claimId: string,
    payload: { kind: string; filename: string; mimeType: string; base64: string },
  ): Promise<ClaimDocument> {
    return this.repository.uploadDocument(claimId, payload);
  }
}
