import { Claim, ClaimStatus, ClaimType, CompletenessStatus } from "../entities/claim";

export interface CreateClaimInput {
  claimNumber: string;
  type: ClaimType;
  status: ClaimStatus;
  policyNumber: string | null;
  lossDate: Date | null;
  reportedAt: Date;
  description: string | null;
  urgency: boolean;
  thirdPartyInvolved: boolean;
  completenessStatus: CompletenessStatus;
}

export interface UpdateClaimStatusInput {
  id: string;
  status: ClaimStatus;
  completenessStatus?: CompletenessStatus;
}

export interface ClaimListFilters {
  status?: ClaimStatus;
  type?: ClaimType;
  search?: string;
}

export interface ClaimRepository {
  create(input: CreateClaimInput): Promise<Claim>;
  findById(id: string): Promise<Claim | null>;
  list(filters: ClaimListFilters): Promise<Claim[]>;
  updateStatus(input: UpdateClaimStatusInput): Promise<Claim | null>;
}
