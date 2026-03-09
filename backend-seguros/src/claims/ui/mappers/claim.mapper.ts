import { Claim } from "../../domain/entities/claim";

export interface ClaimResponse {
  id: string;
  claimNumber: string;
  type: string;
  status: string;
  policyNumber: string | null;
  lossDate: string | null;
  reportedAt: string;
  description: string | null;
  urgency: boolean;
  thirdPartyInvolved: boolean;
  completenessStatus: string;
  createdAt: string;
  updatedAt: string;
}

export const ClaimMapper = {
  toResponse(claim: Claim): ClaimResponse {
    const data = claim.toPrimitives();
    return {
      id: data.id,
      claimNumber: data.claimNumber,
      type: data.type,
      status: data.status,
      policyNumber: data.policyNumber,
      lossDate: data.lossDate ? data.lossDate.toISOString().slice(0, 10) : null,
      reportedAt: data.reportedAt.toISOString(),
      description: data.description,
      urgency: data.urgency,
      thirdPartyInvolved: data.thirdPartyInvolved,
      completenessStatus: data.completenessStatus,
      createdAt: data.createdAt.toISOString(),
      updatedAt: data.updatedAt.toISOString(),
    };
  },
};
