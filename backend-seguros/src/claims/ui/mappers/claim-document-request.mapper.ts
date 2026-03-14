import { ClaimDocumentRequest } from "../../domain/entities/claim-document-request";

export interface ClaimDocumentRequestResponse {
  id: string;
  claimId: string;
  claimNumber: string | null;
  kind: string;
  message: string;
  status: string;
  requestedBy: string;
  createdAt: string;
  resolvedAt: string | null;
}

export const ClaimDocumentRequestMapper = {
  toResponse(request: ClaimDocumentRequest, claimNumber: string | null): ClaimDocumentRequestResponse {
    const data = request.toPrimitives();
    const createdAt = data.createdAt instanceof Date ? data.createdAt : new Date(data.createdAt);
    const resolvedAt = data.resolvedAt
      ? data.resolvedAt instanceof Date
        ? data.resolvedAt
        : new Date(data.resolvedAt)
      : null;

    return {
      id: data.id,
      claimId: data.claimId,
      claimNumber,
      kind: data.kind,
      message: data.message,
      status: data.status,
      requestedBy: data.requestedBy,
      createdAt: createdAt.toISOString(),
      resolvedAt: resolvedAt ? resolvedAt.toISOString() : null,
    };
  },
};

