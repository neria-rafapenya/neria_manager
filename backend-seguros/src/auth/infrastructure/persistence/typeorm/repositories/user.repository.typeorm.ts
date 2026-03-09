import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "../../../../domain/entities/user";
import type { CreateUserInput, UserRepository } from "../../../../domain/repositories/user.repository";
import { UserEntity } from "../entities/user.entity";

@Injectable()
export class UserRepositoryTypeOrm implements UserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repository: Repository<UserEntity>,
  ) {}

  async create(input: CreateUserInput): Promise<User> {
    const entity = this.repository.create({
      email: input.email,
      role: input.role,
      passwordHash: input.passwordHash,
      isActive: input.isActive,
    });

    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async findByEmail(email: string): Promise<User | null> {
    const entity = await this.repository.findOne({ where: { email } });
    return entity ? this.toDomain(entity) : null;
  }

  async findById(id: string): Promise<User | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.repository.update({ id }, { lastLoginAt: new Date() });
  }

  private toDomain(entity: UserEntity): User {
    return new User({
      id: entity.id,
      email: entity.email,
      role: entity.role as any,
      passwordHash: entity.passwordHash,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      lastLoginAt: entity.lastLoginAt,
    });
  }
}
