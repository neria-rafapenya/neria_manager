// src/infrastructure/repositories/AuthRepository.ts
// (ajusta la ruta del archivo si lo tienes en otra carpeta, lo importante es el contenido)

import { API_ENDPOINTS } from "../../core/domain/constants/apiEndpoints";
import type { LoginRequest, LoginResponse } from "../../interfaces";
import { fetchWithAuth } from "../api/api";

export class AuthRepository {
  async login(body: LoginRequest): Promise<LoginResponse> {
    const data = await fetchWithAuth<LoginResponse>(API_ENDPOINTS.AUTH_LOGIN, {
      method: "POST",
      body: JSON.stringify(body),
    });

    return data;
  }
}
