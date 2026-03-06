import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { ClinicUserEntity } from "./entities/clinic-user.entity";
import { PasswordService } from "./auth/password.service";
import { randomUUID } from "crypto";

export interface ClinicUserCreateDto {
  name?: string;
  email: string;
  role?: string;
  status?: string;
  password?: string;
  mustChangePassword?: boolean;
}

export interface ClinicUserUpdateDto {
  name?: string;
  email?: string;
  avatarUrl?: string | null;
  role?: string;
  status?: string;
  mustChangePassword?: boolean;
}

export interface ClinicUserResetDto {
  password: string;
  mustChangePassword?: boolean;
}

@Injectable()
export class ClinicUserService {
  constructor(
    @InjectRepository(ClinicUserEntity)
    private readonly users: Repository<ClinicUserEntity>,
    private readonly passwordService: PasswordService,
  ) {}

  async list(tenantId: string) {
    return this.users.find({ where: { tenantId }, order: { createdAt: "DESC" } });
  }

  async listPatients(tenantId: string) {
    const rows = await this.users.find({ where: { tenantId }, order: { createdAt: "DESC" } });
    return rows.filter((user) => user.role?.toLowerCase() === "patient");
  }

  async searchPatients(tenantId: string, query: string, limit = 12) {
    const term = query.trim().toLowerCase();
    if (!term) return [];
    const like = `%${term}%`;
    return this.users
      .createQueryBuilder("u")
      .where("u.tenantId = :tenantId", { tenantId })
      .andWhere("LOWER(u.role) = 'patient'")
      .andWhere("(LOWER(u.name) LIKE :like OR LOWER(u.email) LIKE :like)", { like })
      .orderBy("u.createdAt", "DESC")
      .limit(limit)
      .getMany();
  }

  async create(tenantId: string, dto: ClinicUserCreateDto) {
    if (!dto?.email) {
      throw new BadRequestException("Email required");
    }
    const email = dto.email.trim().toLowerCase();
    const existing = await this.users.findOne({ where: { tenantId, email } });
    if (existing) {
      throw new ConflictException("Email already exists");
    }
    if (!dto.password) {
      throw new BadRequestException("Password required");
    }
    const user = this.users.create({
      id: randomUUID(),
      tenantId,
      email,
      name: dto.name ?? null,
      role: dto.role || "staff",
      status: dto.status || "active",
      passwordHash: this.passwordService.hash(dto.password),
      mustChangePassword: Boolean(dto.mustChangePassword),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return this.users.save(user);
  }

  async update(tenantId: string, id: string, dto: ClinicUserUpdateDto) {
    const user = await this.users.findOne({ where: { tenantId, id } });
    if (!user) {
      throw new NotFoundException("User not found");
    }
    if (dto.email) {
      const email = dto.email.trim().toLowerCase();
      if (email !== user.email) {
        const exists = await this.users.findOne({ where: { tenantId, email } });
        if (exists) {
          throw new ConflictException("Email already exists");
        }
        user.email = email;
      }
    }
    if (dto.name !== undefined) user.name = dto.name ?? null;
    if (dto.avatarUrl !== undefined) user.avatarUrl = dto.avatarUrl ?? null;
    if (dto.role) user.role = dto.role;
    if (dto.status) user.status = dto.status;
    if (dto.mustChangePassword !== undefined) {
      user.mustChangePassword = Boolean(dto.mustChangePassword);
    }
    user.updatedAt = new Date();
    return this.users.save(user);
  }

  async resetPassword(tenantId: string, id: string, dto: ClinicUserResetDto) {
    if (!dto?.password) {
      throw new BadRequestException("Password required");
    }
    const user = await this.users.findOne({ where: { tenantId, id } });
    if (!user) {
      throw new NotFoundException("User not found");
    }
    user.passwordHash = this.passwordService.hash(dto.password);
    user.mustChangePassword = Boolean(dto.mustChangePassword);
    user.updatedAt = new Date();
    return this.users.save(user);
  }

  async changePassword(
    tenantId: string,
    id: string,
    currentPassword: string,
    newPassword: string,
  ) {
    if (!currentPassword || !newPassword) {
      throw new BadRequestException("Missing password");
    }
    const user = await this.users.findOne({ where: { tenantId, id } });
    if (!user) {
      throw new NotFoundException("User not found");
    }
    if (!this.passwordService.matches(currentPassword, user.passwordHash)) {
      throw new BadRequestException("Invalid password");
    }
    user.passwordHash = this.passwordService.hash(newPassword);
    user.mustChangePassword = false;
    user.updatedAt = new Date();
    return this.users.save(user);
  }

  async delete(tenantId: string, id: string) {
    const user = await this.users.findOne({ where: { tenantId, id } });
    if (!user) {
      throw new NotFoundException("User not found");
    }
    await this.users.remove(user);
  }

  async getById(tenantId: string, id: string) {
    const user = await this.users.findOne({ where: { tenantId, id } });
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return user;
  }

  async listByIds(tenantId: string, ids: string[]) {
    if (!ids.length) return [];
    return this.users.find({ where: { tenantId, id: In(ids) } });
  }
}
