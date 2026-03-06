import type { LoginRequest, LoginResponse, RegisterRequest } from "../../core/domain/auth";
import { fetchWithAuth } from "../api/api";

export class AuthRepository {
  async login(body: LoginRequest): Promise<LoginResponse> {
    return fetchWithAuth<LoginResponse>("/clinicflow/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async register(body: RegisterRequest): Promise<LoginResponse> {
    return fetchWithAuth<LoginResponse>("/clinicflow/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }
}
