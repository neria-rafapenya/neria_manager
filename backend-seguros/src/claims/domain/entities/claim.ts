export const CLAIM_TYPES = ["auto", "hogar", "salud", "vida", "multirriesgo"] as const;
export type ClaimType = (typeof CLAIM_TYPES)[number];

export const CLAIM_STATUSES = [
  "nuevo",
  "en_revision",
  "pendiente_documentos",
  "peritaje",
  "resuelto",
  "cerrado",
] as const;
export type ClaimStatus = (typeof CLAIM_STATUSES)[number];

export const COMPLETENESS_STATUSES = ["incompleto", "parcial", "completo"] as const;
export type CompletenessStatus = (typeof COMPLETENESS_STATUSES)[number];

export interface ClaimProps {
  id: string;
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
  createdAt: Date;
  updatedAt: Date;
}

export class Claim {
  constructor(private readonly props: ClaimProps) {}

  get id() {
    return this.props.id;
  }

  get claimNumber() {
    return this.props.claimNumber;
  }

  get type() {
    return this.props.type;
  }

  get status() {
    return this.props.status;
  }

  get policyNumber() {
    return this.props.policyNumber;
  }

  get lossDate() {
    return this.props.lossDate;
  }

  get reportedAt() {
    return this.props.reportedAt;
  }

  get description() {
    return this.props.description;
  }

  get urgency() {
    return this.props.urgency;
  }

  get thirdPartyInvolved() {
    return this.props.thirdPartyInvolved;
  }

  get completenessStatus() {
    return this.props.completenessStatus;
  }

  get assignedAgentId() {
    return this.props.assignedAgentId;
  }

  get assignedAt() {
    return this.props.assignedAt;
  }

  get assignedBy() {
    return this.props.assignedBy;
  }

  get customerUserId() {
    return this.props.customerUserId;
  }

  get userExplanation() {
    return this.props.userExplanation;
  }

  get userExplanationContextHash() {
    return this.props.userExplanationContextHash;
  }

  get userExplanationUpdatedAt() {
    return this.props.userExplanationUpdatedAt;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  toPrimitives(): ClaimProps {
    return { ...this.props };
  }
}
