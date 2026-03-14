import { Inject, Injectable } from "@nestjs/common";
import { AI_COMMUNICATION_REPOSITORY, CLAIM_REPOSITORY } from "../../claims.constants";
import type { AiCommunicationRepository } from "../repositories/ai-communication.repository";
import type { Claim } from "../entities/claim";
import type { ClaimRepository } from "../repositories/claim.repository";
import crypto from "crypto";

@Injectable()
export class ClaimCommunicationService {
  constructor(
    @Inject(AI_COMMUNICATION_REPOSITORY)
    private readonly aiRepository: AiCommunicationRepository,
    @Inject(CLAIM_REPOSITORY)
    private readonly claimRepository: ClaimRepository,
  ) {}

  async generateUserExplanation(claim: Claim, pendingKinds: string[]) {
    const contextHash = this.buildContextHash(claim, pendingKinds);
    if (claim.userExplanation && claim.userExplanationContextHash === contextHash) {
      return claim.userExplanation;
    }

    return this.aiRepository.generateUserExplanation({
      claimNumber: claim.claimNumber,
      type: claim.type,
      status: claim.status,
      completenessStatus: claim.completenessStatus,
      lossDate: claim.lossDate,
      pendingDocuments: pendingKinds,
    });
  }

  async generateAndCacheUserExplanation(claim: Claim, pendingKinds: string[]) {
    const contextHash = this.buildContextHash(claim, pendingKinds);
    if (claim.userExplanation && claim.userExplanationContextHash === contextHash) {
      return claim.userExplanation;
    }

    const explanation = await this.aiRepository.generateUserExplanation({
      claimNumber: claim.claimNumber,
      type: claim.type,
      status: claim.status,
      completenessStatus: claim.completenessStatus,
      lossDate: claim.lossDate,
      pendingDocuments: pendingKinds,
    });

    if (explanation?.trim()) {
      await this.claimRepository.updateUserExplanationCache({
        id: claim.id,
        message: explanation.trim(),
        contextHash,
        updatedAt: new Date(),
      });
    }

    return explanation;
  }

  private buildContextHash(claim: Claim, pendingKinds: string[]) {
    const payload = JSON.stringify({
      status: claim.status,
      completeness: claim.completenessStatus,
      lossDate: claim.lossDate ? claim.lossDate.toISOString().slice(0, 10) : null,
      pending: [...pendingKinds].sort(),
    });
    return crypto.createHash("sha256").update(payload).digest("hex");
  }
}
