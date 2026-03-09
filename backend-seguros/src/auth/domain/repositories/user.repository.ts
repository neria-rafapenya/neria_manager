import { User, UserRole } from "../entities/user";

export interface CreateUserInput {
  email: string;
  role: UserRole;
  passwordHash: string;
  isActive: boolean;
}

export interface UserRepository {
  create(input: CreateUserInput): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  updateLastLogin(id: string): Promise<void>;
}
