import { Inject, Injectable } from "@nestjs/common";
import {
  CLAIM_DOCUMENT_REPOSITORY,
  CLAIM_DOCUMENT_REQUEST_REPOSITORY,
  STORAGE_REPOSITORY,
} from "../../claims.constants";
import type {
  ClaimDocumentRepository,
  CreateClaimDocumentInput,
} from "../repositories/claim-document.repository";
import type { StorageRepository } from "../repositories/storage.repository";
import type { ClaimDocumentRequestRepository } from "../repositories/claim-document-request.repository";
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
    @Inject(CLAIM_DOCUMENT_REQUEST_REPOSITORY)
    private readonly requestRepository: ClaimDocumentRequestRepository,
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

    const document = await this.documentRepository.create(input);
    await this.requestRepository.markResolvedByClaimAndKind(payload.claimId, payload.kind);
    return document;
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

    const document = await this.documentRepository.create(input);
    await this.requestRepository.markResolvedByClaimAndKind(payload.claimId, payload.kind);
    return document;
  }
}
