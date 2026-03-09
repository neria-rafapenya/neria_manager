import { Inject, Injectable } from "@nestjs/common";
import { CLAIM_REPOSITORY } from "../../claims.constants";
import type {
  ClaimRepository,
  ClaimListFilters,
  CreateClaimInput,
  UpdateClaimStatusInput,
} from "../repositories/claim.repository";
import { ClaimStatus, ClaimType, CompletenessStatus } from "../entities/claim";

export interface CreateClaimPayload {
  type: ClaimType;
  policyNumber?: string | null;
  lossDate?: Date | null;
  description?: string | null;
  urgency?: boolean;
  thirdPartyInvolved?: boolean;
}

@Injectable()
export class ClaimService {
  constructor(
    @Inject(CLAIM_REPOSITORY)
    private readonly claimRepository: ClaimRepository,
  ) {}

  async create(payload: CreateClaimPayload) {
    const input: CreateClaimInput = {
      claimNumber: this.generateClaimNumber(),
      type: payload.type,
      status: "nuevo",
      policyNumber: payload.policyNumber ?? null,
      lossDate: payload.lossDate ?? null,
      reportedAt: new Date(),
      description: payload.description ?? null,
      urgency: payload.urgency ?? false,
      thirdPartyInvolved: payload.thirdPartyInvolved ?? false,
      completenessStatus: "incompleto",
    };

    return this.claimRepository.create(input);
  }

  async list(filters: ClaimListFilters) {
    return this.claimRepository.list(filters);
  }

  async findById(id: string) {
    return this.claimRepository.findById(id);
  }

  async updateStatus(input: UpdateClaimStatusInput) {
    return this.claimRepository.updateStatus(input);
  }

  async markCompleteness(id: string, completeness: CompletenessStatus) {
    return this.claimRepository.updateStatus({ id, status: "en_revision", completenessStatus: completeness });
  }

  private generateClaimNumber() {
    const now = new Date();
    const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
      now.getDate(),
    ).padStart(2, "0")}`;
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    return `CF-${datePart}-${randomPart}`;
  }
}
