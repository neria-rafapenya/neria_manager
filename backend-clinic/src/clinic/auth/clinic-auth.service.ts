import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ClinicUserEntity } from "../entities/clinic-user.entity";
import { PasswordService } from "./password.service";
import { randomUUID } from "crypto";
import type { StringValue } from "ms";

export interface ClinicLoginResponse {
  accessToken: string;
  expiresIn: number;
  user: ClinicUserEntity;
}

@Injectable()
export class ClinicAuthService {
  constructor(
    @InjectRepository(ClinicUserEntity)
    private readonly users: Repository<ClinicUserEntity>,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  private buildToken(user: ClinicUserEntity, expiresIn?: number | StringValue) {
    const payload = {
      sub: user.id,
      tenantId: user.tenantId,
      role: "clinicflow",
      clinicRole: user.role,
      name: user.name ?? user.email,
    };
    if (expiresIn) {
      return this.jwtService.signAsync(payload, { expiresIn });
    }
    return this.jwtService.signAsync(payload);
  }

  async login(tenantId: string, email: string, password: string): Promise<ClinicLoginResponse> {
    const user = await this.users.findOne({ where: { tenantId, email } });
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }
    if (user.status?.toLowerCase() !== "active") {
      throw new UnauthorizedException("User inactive");
    }
    if (!this.passwordService.matches(password, user.passwordHash)) {
      throw new UnauthorizedException("Invalid credentials");
    }
    const raw = this.config.get<string>("CLINIC_JWT_TTL", "7200");
    const expiresInValue: number | StringValue = /^\d+$/.test(raw)
      ? Number(raw)
      : (raw as StringValue);
    const accessToken = await this.buildToken(user, expiresInValue);
    const expiresInSeconds = /^\d+$/.test(raw) ? Number(raw) : 0;
    return {
      accessToken,
      expiresIn: expiresInSeconds,
      user,
    };
  }

  async register(
    tenantId: string,
    email: string,
    password: string,
    name?: string,
  ): Promise<ClinicLoginResponse> {
    const existing = await this.users.findOne({ where: { tenantId, email } });
    if (existing) {
      throw new ConflictException("Email already exists");
    }
    const user = this.users.create({
      id: randomUUID(),
      tenantId,
      email,
      name: name ?? null,
      role: "patient",
      status: "active",
      passwordHash: this.passwordService.hash(password),
      mustChangePassword: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await this.users.save(user);
    return this.login(tenantId, email, password);
  }

  async socialLogin(
    tenantId: string,
    email: string,
    name?: string,
  ): Promise<ClinicLoginResponse> {
    if (!email) {
      throw new UnauthorizedException("Missing email");
    }
    let user = await this.users.findOne({ where: { tenantId, email } });
    if (!user) {
      user = this.users.create({
        id: randomUUID(),
        tenantId,
        email,
        name: name ?? null,
        role: "patient",
        status: "active",
        passwordHash: null,
        mustChangePassword: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await this.users.save(user);
    }
    if (user.status?.toLowerCase() !== "active") {
      throw new UnauthorizedException("User inactive");
    }
    const raw = this.config.get<string>("CLINIC_JWT_TTL", "7200");
    const expiresInValue: number | StringValue = /^\d+$/.test(raw)
      ? Number(raw)
      : (raw as StringValue);
    const accessToken = await this.buildToken(user, expiresInValue);
    const expiresInSeconds = /^\d+$/.test(raw) ? Number(raw) : 0;
    return { accessToken, expiresIn: expiresInSeconds, user };
  }
}
