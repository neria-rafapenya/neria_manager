import type { AuthRepository } from "../repositories/auth.repository";
import type { AuthSession, AuthUser, LoginInput } from "../models/auth";

export class AuthService {
  private readonly repository: AuthRepository;

  constructor(repository: AuthRepository) {
    this.repository = repository;
  }

  login(input: LoginInput): Promise<AuthSession> {
    return this.repository.login(input);
  }

  me(): Promise<AuthUser> {
    return this.repository.me();
  }
}

