export const USER_ROLES = ["admin", "agente", "user"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export interface UserProps {
  id: string;
  email: string;
  role: UserRole;
  passwordHash: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
}

export class User {
  constructor(private readonly props: UserProps) {}

  get id() {
    return this.props.id;
  }

  get email() {
    return this.props.email;
  }

  get role() {
    return this.props.role;
  }

  get passwordHash() {
    return this.props.passwordHash;
  }

  get isActive() {
    return this.props.isActive;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  get lastLoginAt() {
    return this.props.lastLoginAt;
  }

  toPrimitives(): UserProps {
    return { ...this.props };
  }
}
