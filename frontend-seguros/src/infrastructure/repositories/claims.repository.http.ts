import { httpGet, httpPost } from "@/adapters/http/http-client";
import type {
  Claim,
  ClaimDocument,
  ClaimDocumentRequest,
  CreateClaimInput,
} from "@/domain/models/claim";
import type { ClaimsRepository } from "@/domain/repositories/claims.repository";

export class HttpClaimsRepository implements ClaimsRepository {
  async list(): Promise<Claim[]> {
    return httpGet<Claim[]>("/api/claims");
  }

  async getById(id: string): Promise<Claim | null> {
    return httpGet<Claim>(`/api/claims/${id}`);
  }

  async create(input: CreateClaimInput): Promise<Claim> {
    return httpPost<Claim, CreateClaimInput>("/api/claims", input);
  }

  async listDocuments(claimId: string): Promise<ClaimDocument[]> {
    return httpGet<ClaimDocument[]>(`/api/claims/${claimId}/documents`);
  }

  async assign(claimId: string, agentId: string): Promise<Claim> {
    return httpPost<Claim, { agentId: string }>(`/api/claims/${claimId}/assign`, { agentId });
  }

  async requestDocument(
    claimId: string,
    payload: { kind: string; message?: string; aiMessage?: string },
  ): Promise<ClaimDocumentRequest> {
    return httpPost<ClaimDocumentRequest, { kind: string; message?: string; aiMessage?: string }>(
      `/api/claims/${claimId}/request-document`,
      payload,
    );
  }

  async previewDocumentRequest(
    claimId: string,
    payload: { kind: string; message?: string },
  ): Promise<{ message: string }> {
    return httpPost<{ message: string }, { kind: string; message?: string }>(
      `/api/claims/${claimId}/request-document/preview`,
      payload,
    );
  }

  async listDocumentRequests(): Promise<ClaimDocumentRequest[]> {
    return httpGet<ClaimDocumentRequest[]>("/api/claims/document-requests");
  }

  async listMyClaims(): Promise<Claim[]> {
    return httpGet<Claim[]>("/api/claims/my");
  }

  async getMyClaim(claimId: string): Promise<Claim | null> {
    return httpGet<Claim>(`/api/claims/my/${claimId}`);
  }

  async getSummary(claimId: string): Promise<{ summary: string }> {
    return httpPost<{ summary: string }, Record<string, never>>(`/api/claims/${claimId}/summary`, {});
  }

  async getUserExplanation(claimId: string): Promise<{ explanation: string }> {
    return httpGet<{ explanation: string }>(`/api/claims/my/${claimId}/explanation`);
  }

  async listMyDocumentRequests(claimId: string): Promise<ClaimDocumentRequest[]> {
    return httpGet<ClaimDocumentRequest[]>(`/api/claims/my/${claimId}/document-requests`);
  }

  async uploadDocument(
    claimId: string,
    payload: { kind: string; filename: string; mimeType: string; base64: string },
  ): Promise<ClaimDocument> {
    return httpPost<ClaimDocument, typeof payload>(`/api/claims/${claimId}/documents/upload`, payload);
  }
}
