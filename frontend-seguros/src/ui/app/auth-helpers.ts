import type { UserRole } from "@/domain/models/auth";

export function getDefaultPathForRole(role: UserRole | null | undefined) {
  if (role === "admin" || role === "agente") {
    return "/claims";
  }
  if (role === "user") {
    return "/portal";
  }
  return "/";
}

