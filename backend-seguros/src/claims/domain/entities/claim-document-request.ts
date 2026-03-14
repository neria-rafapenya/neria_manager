import type { ClaimDocumentKind } from "./claim-document";

export const CLAIM_DOCUMENT_REQUEST_STATUSES = ["pendiente", "completado", "cancelado"] as const;
export type ClaimDocumentRequestStatus = (typeof CLAIM_DOCUMENT_REQUEST_STATUSES)[number];

export interface ClaimDocumentRequestProps {
  id: string;
  claimId: string;
  kind: ClaimDocumentKind;
  message: string;
  status: ClaimDocumentRequestStatus;
  requestedBy: string;
  createdAt: Date;
  resolvedAt: Date | null;
}

export class ClaimDocumentRequest {
  constructor(private readonly props: ClaimDocumentRequestProps) {}

  get id() {
    return this.props.id;
  }

  get claimId() {
    return this.props.claimId;
  }

  get kind() {
    return this.props.kind;
  }

  get message() {
    return this.props.message;
  }

  get status() {
    return this.props.status;
  }

  get requestedBy() {
    return this.props.requestedBy;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get resolvedAt() {
    return this.props.resolvedAt;
  }

  toPrimitives(): ClaimDocumentRequestProps {
    return { ...this.props };
  }
}

