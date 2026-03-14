import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Like, Repository } from "typeorm";
import { Claim } from "../../../../domain/entities/claim";
import {
  ClaimListFilters,
  ClaimRepository,
  CreateClaimInput,
  UpdateClaimStatusInput,
  AssignClaimInput,
} from "../../../../domain/repositories/claim.repository";
import { ClaimEntity } from "../entities/claim.entity";

@Injectable()
export class ClaimRepositoryTypeOrm implements ClaimRepository {
  constructor(
    @InjectRepository(ClaimEntity)
    private readonly repository: Repository<ClaimEntity>,
  ) {}

  async create(input: CreateClaimInput): Promise<Claim> {
    const entity = this.repository.create({
      claimNumber: input.claimNumber,
      type: input.type,
      status: input.status,
      policyNumber: input.policyNumber,
      lossDate: input.lossDate,
      reportedAt: input.reportedAt,
      description: input.description,
      urgency: input.urgency,
      thirdPartyInvolved: input.thirdPartyInvolved,
      completenessStatus: input.completenessStatus,
      assignedAgentId: input.assignedAgentId,
      assignedAt: input.assignedAt,
      assignedBy: input.assignedBy,
      customerUserId: input.customerUserId,
      userExplanation: input.userExplanation,
      userExplanationContextHash: input.userExplanationContextHash,
      userExplanationUpdatedAt: input.userExplanationUpdatedAt,
    });

    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<Claim | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async list(filters: ClaimListFilters): Promise<Claim[]> {
    const where: Record<string, unknown> = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.search) {
      where.claimNumber = Like(`%${filters.search}%`);
    }

    if (filters.assignedAgentId) {
      where.assignedAgentId = filters.assignedAgentId;
    }

    const entities = await this.repository.find({
      where,
      order: { createdAt: "DESC" },
      take: 200,
    });

    return entities.map((entity) => this.toDomain(entity));
  }

  async listByCustomerUserId(customerUserId: string): Promise<Claim[]> {
    const entities = await this.repository.find({
      where: { customerUserId },
      order: { createdAt: "DESC" },
      take: 200,
    });

    return entities.map((entity) => this.toDomain(entity));
  }

  async updateStatus(input: UpdateClaimStatusInput): Promise<Claim | null> {
    const entity = await this.repository.findOne({ where: { id: input.id } });
    if (!entity) {
      return null;
    }

    entity.status = input.status;
    if (input.completenessStatus) {
      entity.completenessStatus = input.completenessStatus;
    }

    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async updateUserExplanationCache(input: {
    id: string;
    message: string;
    contextHash: string;
    updatedAt: Date;
  }): Promise<void> {
    await this.repository.update(
      { id: input.id },
      {
        userExplanation: input.message,
        userExplanationContextHash: input.contextHash,
        userExplanationUpdatedAt: input.updatedAt,
      },
    );
  }

  async assign(input: AssignClaimInput): Promise<Claim | null> {
    const entity = await this.repository.findOne({ where: { id: input.id } });
    if (!entity) {
      return null;
    }

    entity.assignedAgentId = input.assignedAgentId;
    entity.assignedAt = input.assignedAt;
    entity.assignedBy = input.assignedBy;

    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  private toDomain(entity: ClaimEntity): Claim {
    return new Claim({
      id: entity.id,
      claimNumber: entity.claimNumber,
      type: entity.type as any,
      status: entity.status as any,
      policyNumber: entity.policyNumber,
      lossDate: entity.lossDate,
      reportedAt: entity.reportedAt,
      description: entity.description,
      urgency: entity.urgency,
      thirdPartyInvolved: entity.thirdPartyInvolved,
      completenessStatus: entity.completenessStatus as any,
      assignedAgentId: entity.assignedAgentId ?? null,
      assignedAt: entity.assignedAt ?? null,
      assignedBy: entity.assignedBy ?? null,
      customerUserId: entity.customerUserId ?? null,
      userExplanation: entity.userExplanation ?? null,
      userExplanationContextHash: entity.userExplanationContextHash ?? null,
      userExplanationUpdatedAt: entity.userExplanationUpdatedAt ?? null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }
}
