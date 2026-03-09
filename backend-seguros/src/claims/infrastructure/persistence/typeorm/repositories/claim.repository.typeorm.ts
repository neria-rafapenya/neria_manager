import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Like, Repository } from "typeorm";
import { Claim } from "../../../../domain/entities/claim";
import {
  ClaimListFilters,
  ClaimRepository,
  CreateClaimInput,
  UpdateClaimStatusInput,
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

    const entities = await this.repository.find({
      where,
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
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }
}
