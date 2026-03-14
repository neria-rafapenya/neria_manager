export type UserRole = "ADMIN" | "STAFF";

export interface User {
  id: string;
  tenantId: string;
  email: string;
  role: UserRole;
  mustChangePassword?: boolean;
  createdAt: string;
}
