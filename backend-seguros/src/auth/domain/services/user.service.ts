import { Inject, Injectable } from "@nestjs/common";
import { USER_REPOSITORY } from "../../auth.constants";
import type { CreateUserInput, UserRepository } from "../repositories/user.repository";
import { UserRole } from "../entities/user";

@Injectable()
export class UserService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
  ) {}

  async create(email: string, role: UserRole, passwordHash: string) {
    const input: CreateUserInput = {
      email: email.toLowerCase(),
      role,
      passwordHash,
      isActive: true,
    };

    return this.userRepository.create(input);
  }

  async findByEmail(email: string) {
    return this.userRepository.findByEmail(email.toLowerCase());
  }

  async findById(id: string) {
    return this.userRepository.findById(id);
  }

  async listAgents() {
    return this.userRepository.listByRole("agente");
  }

  async markLogin(id: string) {
    await this.userRepository.updateLastLogin(id);
  }
}
