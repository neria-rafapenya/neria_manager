import type { ClaimType, ClaimStatus, CompletenessStatus } from "../entities/claim";

export interface DocumentRequestAiInput {
  claimNumber: string;
  type: ClaimType;
  lossDate: Date | null;
  description: string | null;
  policyNumber: string | null;
  urgency: boolean;
  thirdPartyInvolved: boolean;
  documentKind: string;
  operatorNotes?: string | null;
}

export interface UserExplanationAiInput {
  claimNumber: string;
  type: ClaimType;
  status: ClaimStatus;
  completenessStatus: CompletenessStatus;
  lossDate: Date | null;
  pendingDocuments: string[];
}

export interface AiCommunicationRepository {
  generateDocumentRequestMessage(input: DocumentRequestAiInput): Promise<string>;
  generateUserExplanation(input: UserExplanationAiInput): Promise<string>;
}

