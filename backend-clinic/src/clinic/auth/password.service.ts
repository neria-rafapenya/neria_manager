import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { scryptSync } from "crypto";

@Injectable()
export class PasswordService {
  private readonly salt: string;

  constructor(private readonly config: ConfigService) {
    this.salt = this.config.get<string>("CLINIC_PASSWORD_SALT", "");
    if (!this.salt || this.salt.length < 16) {
      throw new Error("CLINIC_PASSWORD_SALT must be at least 16 characters");
    }
  }

  hash(value: string): string {
    const derived = scryptSync(value, this.salt, 32, { N: 16384, r: 8, p: 1 });
    return derived.toString("hex");
  }

  matches(value: string, expectedHex?: string | null): boolean {
    if (!expectedHex) return false;
    const computed = this.hash(value);
    return computed === expectedHex;
  }
}
