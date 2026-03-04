export interface AuthUser {
  id: string;
  tenantId?: string;
  email: string;
  name?: string | null;
  status?: string | null;
  role?: string | null;
  mustChangePassword?: boolean | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  expiresIn?: number;
  user: AuthUser;
}
