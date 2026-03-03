import type { LoginRequest, LoginResponse } from "../../domain/auth";
import { AuthRepository } from "../../../infrastructure/repositories/AuthRepository";
import { setAuthToken } from "../../../infrastructure/config/env";

export class AuthService {
  constructor(private repository: AuthRepository) {}

  async login(body: LoginRequest): Promise<LoginResponse> {
    const response = await this.repository.login(body);
    setAuthToken(response.accessToken);
    return response;
  }
}
