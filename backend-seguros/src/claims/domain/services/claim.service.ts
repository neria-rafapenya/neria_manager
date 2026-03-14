import { Inject, Injectable } from "@nestjs/common";
import { CLAIM_REPOSITORY } from "../../claims.constants";
import type {
  ClaimRepository,
  ClaimListFilters,
  CreateClaimInput,
  UpdateClaimStatusInput,
  AssignClaimInput,
} from "../repositories/claim.repository";
import { ClaimStatus, ClaimType, CompletenessStatus } from "../entities/claim";
import { UserService } from "../../../auth/domain/services/user.service";

export interface CreateClaimPayload {
  type: ClaimType;
  policyNumber?: string | null;
  lossDate?: Date | null;
  description?: string | null;
  urgency?: boolean;
  thirdPartyInvolved?: boolean;
  customerUserId?: string | null;
}

@Injectable()
export class ClaimService {
  constructor(
    @Inject(CLAIM_REPOSITORY)
    private readonly claimRepository: ClaimRepository,
    private readonly userService: UserService,
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
      assignedAgentId: null,
      assignedAt: null,
      assignedBy: null,
      customerUserId: payload.customerUserId ?? null,
      userExplanation: null,
      userExplanationContextHash: null,
      userExplanationUpdatedAt: null,
    };

    return this.claimRepository.create(input);
  }

  async list(filters: ClaimListFilters) {
    return this.claimRepository.list(filters);
  }

  async listByCustomerUserId(customerUserId: string) {
    return this.claimRepository.listByCustomerUserId(customerUserId);
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

  async assign(id: string, assignedAgentId: string | null, assignedBy: string | null) {
    if (assignedAgentId) {
      const agent = await this.userService.findById(assignedAgentId);
      if (!agent || agent.role !== "agente") {
        return null;
      }
    }

    const input: AssignClaimInput = {
      id,
      assignedAgentId,
      assignedBy,
      assignedAt: new Date(),
    };

    return this.claimRepository.assign(input);
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
