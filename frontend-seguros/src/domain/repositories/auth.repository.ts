import type { AuthSession, AuthUser, LoginInput } from "../models/auth";

export interface AuthRepository {
  login(input: LoginInput): Promise<AuthSession>;
  me(): Promise<AuthUser>;
  listAgents(): Promise<AuthUser[]>;
}
