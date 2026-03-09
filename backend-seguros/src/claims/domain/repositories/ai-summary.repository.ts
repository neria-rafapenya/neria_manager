import { ClaimType } from "../entities/claim";

export interface ClaimSummaryInput {
  claimNumber: string;
  type: ClaimType;
  lossDate: Date | null;
  description: string | null;
  documents: Array<{ kind: string; filename: string }>;
}

export interface AiSummaryRepository {
  summarizeClaim(input: ClaimSummaryInput): Promise<string>;
}
