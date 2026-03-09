import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { UserService } from "./user.service";
import { UserRole } from "../entities/user";

export interface AuthTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
}

@Injectable()
export class AuthService {
  private readonly jwtSecret: string;
  private readonly jwtTtl: number;
  private readonly passwordSalt: string;

  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {
    this.jwtSecret = this.configService.get<string>("SEGUROS_JWT_SECRET", "");
    this.jwtTtl = parseInt(this.configService.get<string>("SEGUROS_JWT_TTL", "7200"), 10);
    this.passwordSalt = this.configService.get<string>("SEGUROS_PASSWORD_SALT", "");
  }

  async login(email: string, password: string) {
    const user = await this.userService.findByEmail(email);
    if (!user || !user.isActive) {
      throw new UnauthorizedException("Credenciales invalidas");
    }

    const passwordHash = this.hashPassword(password);
    if (passwordHash !== user.passwordHash) {
      throw new UnauthorizedException("Credenciales invalidas");
    }

    await this.userService.markLogin(user.id);

    const token = this.signToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      accessToken: token,
      expiresIn: this.jwtTtl,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  async createUser(email: string, role: UserRole, password: string) {
    const passwordHash = this.hashPassword(password);
    return this.userService.create(email, role, passwordHash);
  }

  verifyToken(token: string): AuthTokenPayload {
    return jwt.verify(token, this.jwtSecret) as AuthTokenPayload;
  }

  private signToken(payload: AuthTokenPayload) {
    return jwt.sign(payload, this.jwtSecret, { expiresIn: this.jwtTtl });
  }

  private hashPassword(password: string) {
    return crypto.createHmac("sha256", this.passwordSalt).update(password).digest("hex");
  }
}
