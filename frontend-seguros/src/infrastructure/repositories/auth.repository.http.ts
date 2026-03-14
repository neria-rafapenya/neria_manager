import { httpGet, httpPost } from "@/adapters/http/http-client";
import type { AuthSession, AuthUser, LoginInput } from "@/domain/models/auth";
import type { AuthRepository } from "@/domain/repositories/auth.repository";

export class HttpAuthRepository implements AuthRepository {
  login(input: LoginInput): Promise<AuthSession> {
    return httpPost<AuthSession, LoginInput>("/api/auth/login", input);
  }

  me(): Promise<AuthUser> {
    return httpGet<AuthUser>("/api/auth/me");
  }

  listAgents(): Promise<AuthUser[]> {
    return httpGet<AuthUser[]>("/api/auth/users?role=agente");
  }
}
