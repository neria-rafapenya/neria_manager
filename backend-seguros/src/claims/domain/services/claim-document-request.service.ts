import { Inject, Injectable } from "@nestjs/common";
import { AI_COMMUNICATION_REPOSITORY, CLAIM_DOCUMENT_REQUEST_REPOSITORY } from "../../claims.constants";
import type {
  ClaimDocumentRequestRepository,
  CreateClaimDocumentRequestInput,
} from "../repositories/claim-document-request.repository";
import type { ClaimDocumentKind } from "../entities/claim-document";
import type { AiCommunicationRepository } from "../repositories/ai-communication.repository";
import type { Claim } from "../entities/claim";

@Injectable()
export class ClaimDocumentRequestService {
  constructor(
    @Inject(CLAIM_DOCUMENT_REQUEST_REPOSITORY)
    private readonly requestRepository: ClaimDocumentRequestRepository,
    @Inject(AI_COMMUNICATION_REPOSITORY)
    private readonly aiRepository: AiCommunicationRepository,
  ) {}

  async create(input: {
    claim: Claim;
    kind: ClaimDocumentKind;
    operatorNotes?: string | null;
    aiMessageOverride?: string | null;
    requestedBy: string;
  }) {
    const aiMessage = input.aiMessageOverride?.trim() ?? (await this.previewMessage(input));
    const finalMessage =
      aiMessage?.trim() ||
      input.operatorNotes?.trim() ||
      `Por favor aporta el documento ${input.kind} para continuar con el expediente.`;

    const payload: CreateClaimDocumentRequestInput = {
      claimId: input.claim.id,
      kind: input.kind,
      message: finalMessage,
      status: "pendiente",
      requestedBy: input.requestedBy,
      createdAt: new Date(),
      resolvedAt: null,
    };
    return this.requestRepository.create(payload);
  }

  async previewMessage(input: {
    claim: Claim;
    kind: ClaimDocumentKind;
    operatorNotes?: string | null;
  }) {
    let aiMessage = "";
    try {
      aiMessage = await this.aiRepository.generateDocumentRequestMessage({
        claimNumber: input.claim.claimNumber,
        type: input.claim.type,
        lossDate: input.claim.lossDate,
        description: input.claim.description,
        policyNumber: input.claim.policyNumber,
        urgency: input.claim.urgency,
        thirdPartyInvolved: input.claim.thirdPartyInvolved,
        documentKind: input.kind,
        operatorNotes: input.operatorNotes ?? null,
      });
    } catch {
      aiMessage = "";
    }
    return aiMessage;
  }

  async listByClaim(claimId: string) {
    return this.requestRepository.listByClaim(claimId);
  }

  async listPendingByClaim(claimId: string) {
    return this.requestRepository.listPendingByClaim(claimId);
  }

  async listAll() {
    return this.requestRepository.listAll();
  }

  async markResolvedByClaimAndKind(claimId: string, kind: ClaimDocumentKind) {
    await this.requestRepository.markResolvedByClaimAndKind(claimId, kind);
  }
}
