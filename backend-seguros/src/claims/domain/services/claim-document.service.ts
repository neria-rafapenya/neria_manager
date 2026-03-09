import { Inject, Injectable } from "@nestjs/common";
import { CLAIM_DOCUMENT_REPOSITORY, STORAGE_REPOSITORY } from "../../claims.constants";
import type {
  ClaimDocumentRepository,
  CreateClaimDocumentInput,
} from "../repositories/claim-document.repository";
import type { StorageRepository } from "../repositories/storage.repository";
import { ClaimDocumentKind } from "../entities/claim-document";

export interface CreateClaimDocumentPayload {
  claimId: string;
  kind: ClaimDocumentKind;
  filename: string;
  mimeType: string;
  storageKey: string;
  sizeBytes: number;
  extractedFields?: Record<string, unknown> | null;
  evidence?: Record<string, unknown> | null;
}

export interface UploadClaimDocumentPayload {
  claimId: string;
  kind: ClaimDocumentKind;
  filename: string;
  mimeType: string;
  base64: string;
}

@Injectable()
export class ClaimDocumentService {
  constructor(
    @Inject(CLAIM_DOCUMENT_REPOSITORY)
    private readonly documentRepository: ClaimDocumentRepository,
    @Inject(STORAGE_REPOSITORY)
    private readonly storageRepository: StorageRepository,
  ) {}

  async create(payload: CreateClaimDocumentPayload) {
    const input: CreateClaimDocumentInput = {
      claimId: payload.claimId,
      kind: payload.kind,
      filename: payload.filename,
      mimeType: payload.mimeType,
      storageKey: payload.storageKey,
      sizeBytes: payload.sizeBytes,
      extractedFields: payload.extractedFields ?? null,
      evidence: payload.evidence ?? null,
    };

    return this.documentRepository.create(input);
  }

  async listByClaim(claimId: string) {
    return this.documentRepository.listByClaim(claimId);
  }

  async uploadAndCreate(payload: UploadClaimDocumentPayload) {
    const upload = await this.storageRepository.uploadBase64({
      base64: payload.base64,
      filename: payload.filename,
      mimeType: payload.mimeType,
    });

    const input: CreateClaimDocumentInput = {
      claimId: payload.claimId,
      kind: payload.kind,
      filename: payload.filename,
      mimeType: payload.mimeType,
      storageKey: upload.storageKey,
      sizeBytes: upload.sizeBytes,
      extractedFields: {
        storageUrl: upload.url,
        provider: "cloudinary",
      },
      evidence: null,
    };

    return this.documentRepository.create(input);
  }
}
