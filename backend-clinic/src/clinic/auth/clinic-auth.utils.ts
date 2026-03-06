import { ForbiddenException, UnauthorizedException } from "@nestjs/common";

export interface ClinicJwtPayload {
  sub: string;
  tenantId: string;
  role: string;
  clinicRole?: string;
  name?: string;
}

export const normalizeClinicRole = (role?: string | null): string => {
  if (!role) return "";
  const value = role.trim().toLowerCase();
  if (value === "gestor" || value === "manager") return "manager";
  if (value === "personal" || value === "staff") return "staff";
  if (value === "asistente" || value === "assistant") return "assistant";
  if (value === "patient" || value === "paciente") return "patient";
  return value;
};

export const requireClinicAuth = (user?: ClinicJwtPayload | null) => {
  if (!user || user.role !== "clinicflow") {
    throw new UnauthorizedException("Invalid token");
  }
  if (!user.tenantId) {
    throw new UnauthorizedException("Missing tenant");
  }
  return user;
};

export const requireClinicRole = (
  user: ClinicJwtPayload,
  ...allowed: string[]
) => {
  const normalized = normalizeClinicRole(user.clinicRole);
  if (!allowed.includes(normalized)) {
    throw new ForbiddenException("Insufficient clinic role");
  }
};
