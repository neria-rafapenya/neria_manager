import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ClaimDocument } from "../../../../domain/entities/claim-document";
import {
  ClaimDocumentRepository,
  CreateClaimDocumentInput,
} from "../../../../domain/repositories/claim-document.repository";
import { ClaimDocumentEntity } from "../entities/claim-document.entity";

@Injectable()
export class ClaimDocumentRepositoryTypeOrm implements ClaimDocumentRepository {
  constructor(
    @InjectRepository(ClaimDocumentEntity)
    private readonly repository: Repository<ClaimDocumentEntity>,
  ) {}

  async create(input: CreateClaimDocumentInput): Promise<ClaimDocument> {
    const entity = this.repository.create({
      claimId: input.claimId,
      kind: input.kind,
      filename: input.filename,
      mimeType: input.mimeType,
      storageKey: input.storageKey,
      sizeBytes: input.sizeBytes,
      extractedFields: input.extractedFields,
      evidence: input.evidence,
    });

    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async listByClaim(claimId: string): Promise<ClaimDocument[]> {
    const entities = await this.repository.find({
      where: { claimId },
      order: { createdAt: "DESC" },
    });

    return entities.map((entity) => this.toDomain(entity));
  }

  private toDomain(entity: ClaimDocumentEntity): ClaimDocument {
    return new ClaimDocument({
      id: entity.id,
      claimId: entity.claimId,
      kind: entity.kind as any,
      filename: entity.filename,
      mimeType: entity.mimeType,
      storageKey: entity.storageKey,
      sizeBytes: entity.sizeBytes,
      extractedFields: entity.extractedFields,
      evidence: entity.evidence,
      createdAt: entity.createdAt,
    });
  }
}
