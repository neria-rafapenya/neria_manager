import { Inject, Injectable } from "@nestjs/common";
import { AI_SUMMARY_REPOSITORY, CLAIM_DOCUMENT_REPOSITORY, CLAIM_REPOSITORY } from "../../claims.constants";
import type { AiSummaryRepository } from "../repositories/ai-summary.repository";
import type { ClaimDocumentRepository } from "../repositories/claim-document.repository";
import type { ClaimRepository } from "../repositories/claim.repository";

@Injectable()
export class ClaimSummaryService {
  constructor(
    @Inject(CLAIM_REPOSITORY)
    private readonly claimRepository: ClaimRepository,
    @Inject(CLAIM_DOCUMENT_REPOSITORY)
    private readonly documentRepository: ClaimDocumentRepository,
    @Inject(AI_SUMMARY_REPOSITORY)
    private readonly aiRepository: AiSummaryRepository,
  ) {}

  async generate(claimId: string) {
    const claim = await this.claimRepository.findById(claimId);
    if (!claim) {
      return null;
    }

    const documents = await this.documentRepository.listByClaim(claimId);
    const docList = documents.map((doc) => ({
      kind: doc.kind,
      filename: doc.filename,
    }));

    return this.aiRepository.summarizeClaim({
      claimNumber: claim.claimNumber,
      type: claim.type,
      lossDate: claim.lossDate,
      description: claim.description,
      documents: docList,
    });
  }
}
