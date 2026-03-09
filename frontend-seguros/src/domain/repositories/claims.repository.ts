import type { Claim, ClaimDocument, CreateClaimInput } from "../models/claim";

export interface ClaimsRepository {
  list(): Promise<Claim[]>;
  getById(id: string): Promise<Claim | null>;
  create(input: CreateClaimInput): Promise<Claim>;
  listDocuments(claimId: string): Promise<ClaimDocument[]>;
}
