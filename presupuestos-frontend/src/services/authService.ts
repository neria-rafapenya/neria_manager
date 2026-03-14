import { apiRequest } from "../api/client";
import { AuthResponse, ChangePasswordRequest, LoginRequest, RegisterRequest } from "../types/auth";

export const authService = {
  login: (payload: LoginRequest) =>
    apiRequest<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  register: (payload: RegisterRequest) =>
    apiRequest<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  logout: () => apiRequest<void>("/auth/logout", { method: "POST" }),
  changePassword: (payload: ChangePasswordRequest) =>
    apiRequest<void>("/auth/change-password", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
