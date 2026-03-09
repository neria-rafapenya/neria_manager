import { httpGet, httpPost } from "@/adapters/http/http-client";
import type { Claim, ClaimDocument, CreateClaimInput } from "@/domain/models/claim";
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
}
