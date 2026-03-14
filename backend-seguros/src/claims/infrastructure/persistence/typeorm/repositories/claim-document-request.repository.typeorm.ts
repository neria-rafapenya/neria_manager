import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ClaimDocumentRequest } from "../../../../domain/entities/claim-document-request";
import type { ClaimDocumentKind } from "../../../../domain/entities/claim-document";
import type {
  ClaimDocumentRequestRepository,
  CreateClaimDocumentRequestInput,
} from "../../../../domain/repositories/claim-document-request.repository";
import { ClaimDocumentRequestEntity } from "../entities/claim-document-request.entity";

@Injectable()
export class ClaimDocumentRequestRepositoryTypeOrm implements ClaimDocumentRequestRepository {
  constructor(
    @InjectRepository(ClaimDocumentRequestEntity)
    private readonly repository: Repository<ClaimDocumentRequestEntity>,
  ) {}

  async create(input: CreateClaimDocumentRequestInput): Promise<ClaimDocumentRequest> {
    const entity = this.repository.create({
      claimId: input.claimId,
      kind: input.kind,
      message: input.message,
      status: input.status,
      requestedBy: input.requestedBy,
      createdAt: input.createdAt,
      resolvedAt: input.resolvedAt,
    });
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async listByClaim(claimId: string): Promise<ClaimDocumentRequest[]> {
    const entities = await this.repository.find({
      where: { claimId },
      order: { createdAt: "DESC" },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  async listPendingByClaim(claimId: string): Promise<ClaimDocumentRequest[]> {
    const entities = await this.repository.find({
      where: { claimId, status: "pendiente" },
      order: { createdAt: "DESC" },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  async listAll(): Promise<ClaimDocumentRequest[]> {
    const entities = await this.repository.find({
      order: { createdAt: "DESC" },
      take: 200,
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  async markResolvedByClaimAndKind(claimId: string, kind: ClaimDocumentKind): Promise<void> {
    await this.repository.update(
      { claimId, kind: kind as any, status: "pendiente" },
      { status: "completado", resolvedAt: new Date() },
    );
  }

  private toDomain(entity: ClaimDocumentRequestEntity): ClaimDocumentRequest {
    return new ClaimDocumentRequest({
      id: entity.id,
      claimId: entity.claimId,
      kind: entity.kind as any,
      message: entity.message,
      status: entity.status as any,
      requestedBy: entity.requestedBy,
      createdAt: entity.createdAt,
      resolvedAt: entity.resolvedAt,
    });
  }
}
