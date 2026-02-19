// src/interfaces/auth/Auth.ts

export interface AuthUser {
  id: string;
  tenantId?: string;
  email: string;
  name?: string | null;
  status?: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
  serviceCode?: string;
  tenantServiceId?: string;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}
