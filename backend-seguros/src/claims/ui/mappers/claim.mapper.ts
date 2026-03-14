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
  assignedAgentId: string | null;
  assignedAt: string | null;
  assignedBy: string | null;
  customerUserId?: string | null;
  pendingDocumentRequests?: number;
  createdAt: string;
  updatedAt: string;
}

export const ClaimMapper = {
  toResponse(claim: Claim): ClaimResponse {
    const data = claim.toPrimitives();
    const toDate = (value: Date | string | null) => {
      if (!value) {
        return null;
      }
      const date = value instanceof Date ? value : new Date(value);
      if (Number.isNaN(date.getTime())) {
        return null;
      }
      return date;
    };

    const lossDate = toDate(data.lossDate);
    const reportedAt = toDate(data.reportedAt);
    const createdAt = toDate(data.createdAt);
    const updatedAt = toDate(data.updatedAt);
    const assignedAt = toDate(data.assignedAt);

    return {
      id: data.id,
      claimNumber: data.claimNumber,
      type: data.type,
      status: data.status,
      policyNumber: data.policyNumber,
      lossDate: lossDate ? lossDate.toISOString().slice(0, 10) : null,
      reportedAt: reportedAt ? reportedAt.toISOString() : new Date().toISOString(),
      description: data.description,
      urgency: data.urgency,
      thirdPartyInvolved: data.thirdPartyInvolved,
      completenessStatus: data.completenessStatus,
      assignedAgentId: data.assignedAgentId,
      assignedAt: assignedAt ? assignedAt.toISOString() : null,
      assignedBy: data.assignedBy,
      customerUserId: data.customerUserId ?? null,
      createdAt: createdAt ? createdAt.toISOString() : new Date().toISOString(),
      updatedAt: updatedAt ? updatedAt.toISOString() : new Date().toISOString(),
    };
  },
};
