import type { Claim, ClaimDocument, CreateClaimInput } from "../models/claim";
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
}
