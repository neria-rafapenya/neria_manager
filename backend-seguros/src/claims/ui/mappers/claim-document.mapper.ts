import { ClaimDocument } from "../../domain/entities/claim-document";

export interface ClaimDocumentResponse {
  id: string;
  claimId: string;
  kind: string;
  filename: string;
  mimeType: string;
  storageKey: string;
  sizeBytes: number;
  extractedFields: Record<string, unknown> | null;
  evidence: Record<string, unknown> | null;
  createdAt: string;
}

export const ClaimDocumentMapper = {
  toResponse(document: ClaimDocument): ClaimDocumentResponse {
    const data = document.toPrimitives();
    return {
      id: data.id,
      claimId: data.claimId,
      kind: data.kind,
      filename: data.filename,
      mimeType: data.mimeType,
      storageKey: data.storageKey,
      sizeBytes: data.sizeBytes,
      extractedFields: data.extractedFields ?? null,
      evidence: data.evidence ?? null,
      createdAt: data.createdAt.toISOString(),
    };
  },
};
