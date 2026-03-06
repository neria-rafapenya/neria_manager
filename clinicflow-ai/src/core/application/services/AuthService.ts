import type { LoginRequest, LoginResponse, RegisterRequest } from "../../domain/auth";
import { AuthRepository } from "../../../infrastructure/repositories/AuthRepository";
import { setAuthToken } from "../../../infrastructure/config/env";

export class AuthService {
  private repository: AuthRepository;

  constructor(repository: AuthRepository) {
    this.repository = repository;
  }

  async login(body: LoginRequest): Promise<LoginResponse> {
    const response = await this.repository.login(body);
    setAuthToken(response.accessToken);
    return response;
  }

  async register(body: RegisterRequest): Promise<LoginResponse> {
    const response = await this.repository.register(body);
    setAuthToken(response.accessToken);
    return response;
  }
}
