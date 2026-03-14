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
  assignedAgentId: string | null;
  assignedAt: Date | null;
  assignedBy: string | null;
  customerUserId: string | null;
  userExplanation: string | null;
  userExplanationContextHash: string | null;
  userExplanationUpdatedAt: Date | null;
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
  assignedAgentId?: string | null;
}

export interface AssignClaimInput {
  id: string;
  assignedAgentId: string | null;
  assignedBy: string | null;
  assignedAt: Date;
}

export interface ClaimRepository {
  create(input: CreateClaimInput): Promise<Claim>;
  findById(id: string): Promise<Claim | null>;
  list(filters: ClaimListFilters): Promise<Claim[]>;
  listByCustomerUserId(customerUserId: string): Promise<Claim[]>;
  updateStatus(input: UpdateClaimStatusInput): Promise<Claim | null>;
  assign(input: AssignClaimInput): Promise<Claim | null>;
  updateUserExplanationCache(input: {
    id: string;
    message: string;
    contextHash: string;
    updatedAt: Date;
  }): Promise<void>;
}
