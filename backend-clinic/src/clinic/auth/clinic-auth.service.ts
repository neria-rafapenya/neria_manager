import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ClinicUserEntity } from "../entities/clinic-user.entity";
import { PasswordService } from "./password.service";

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
  ) {}

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
    const payload = {
      sub: user.id,
      tenantId: user.tenantId,
      role: "clinicflow",
      clinicRole: user.role,
    };
    const accessToken = await this.jwtService.signAsync(payload);
    const expiresRaw = this.jwtService.options.signOptions?.expiresIn ?? 0;
    const expiresIn = typeof expiresRaw === "string" ? Number(expiresRaw) : (expiresRaw as number);
    return {
      accessToken,
      expiresIn: Number.isNaN(expiresIn) ? 0 : expiresIn,
      user,
    };
  }
}
