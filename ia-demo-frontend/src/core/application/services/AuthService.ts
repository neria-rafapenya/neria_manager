// src/core/services/auth/AuthService.ts

import { setAuthToken } from "../../../infrastructure/config/env";
import type { AuthRepository } from "../../../infrastructure/repositories";
import type { LoginRequest, LoginResponse } from "../../../interfaces";

export class AuthService {
  private readonly repository: AuthRepository;

  constructor(repository: AuthRepository) {
    this.repository = repository;
  }

  async login(body: LoginRequest): Promise<LoginResponse> {
    const res = await this.repository.login(body);
    console.log("[AuthService] LoginResponse recibido:", res);

    if (!res || typeof res !== "object") {
      console.error("[AuthService] LoginResponse inválida", res);
    } else {
      if (!("accessToken" in res)) {
        console.error(
          "[AuthService] Falta 'accessToken' en LoginResponse",
          res
        );
      }
      if (!(res as any).user) {
        console.error("[AuthService] Falta 'user' en LoginResponse", res);
      } else if (!(res as any).user.id) {
        console.error(
          "[AuthService] Falta 'user.id' en LoginResponse.user",
          (res as any).user
        );
      }
    }

    setAuthToken(res.accessToken);
    return res;
  }

  logout(): void {
    setAuthToken(null);
  }
}
