// src/infrastructure/repositories/UploadRepository.ts

import { API_ENDPOINTS } from "../../core/domain/constants/apiEndpoints";
import { fetchWithAuth, ApiError } from "../api/api";
import { getServiceCode } from "../config/env";
import type { ChatAttachment } from "../../interfaces";

// ⬆️ Límite aumentado a 5 MB
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

// Tipos de documento permitidos (no imágenes)
// Las imágenes irán por la rama image/*
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/x-rar-compressed",
  "application/zip",
  "application/x-zip-compressed",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
];

type UploadResponse = {
  provider?: string;
  url?: string;
  storageKey?: string;
  originalName?: string;
  contentType?: string;
  size?: number;
};

export class UploadRepository {
  /**
   * Valida tamaño y tipo de los ficheros.
   * Devuelve solo los válidos; si ninguno es válido lanza error.
   *
   * Reglas:
   *  - Máx 5MB por archivo
   *  - Máx 5 archivos
   *  - Permitidos:
   *      · Cualquier image/* (png, jpg, jpeg, gif, webp, svg, etc.)
   *      · pdf, rar, zip, doc, docx, xls, xlsx, csv
   */
  private validateFiles(files: File[]): File[] {
    if (!files.length) return [];

    const validFiles: File[] = [];
    const errors: string[] = [];

    for (const file of files) {
      // Tamaño
      if (file.size > MAX_FILE_SIZE_BYTES) {
        errors.push(`El archivo "${file.name}" supera el límite de 5MB.`);
        continue;
      }

      // Tipo
      const isImage = file.type.startsWith("image/");

      const isAllowedDocument =
        !isImage && ALLOWED_MIME_TYPES.includes(file.type);

      if (!isImage && !isAllowedDocument) {
        errors.push(
          `El archivo "${file.name}" tiene un tipo no permitido (${file.type}).`
        );
        continue;
      }

      validFiles.push(file);
    }

    if (!validFiles.length) {
      throw new Error(
        errors.join(" ") || "No se han seleccionado archivos válidos."
      );
    }

    if (validFiles.length > 5) {
      throw new Error("Solo se permiten un máximo de 5 archivos por subida.");
    }

    return validFiles;
  }

  private mapAttachment(data: UploadResponse): ChatAttachment {
    const url = data.url ?? "";
    const storageKey = data.storageKey ?? url;
    const name = data.originalName ?? storageKey ?? "archivo";
    const contentType = data.contentType ?? "";
    const size = data.size ?? 0;
    return {
      url,
      key: storageKey,
      filename: name,
      mimeType: contentType,
      sizeBytes: size,
      provider: data.provider,
      storageKey,
      name,
      contentType,
      size,
    };
  }

  private async uploadSingle(file: File): Promise<ChatAttachment> {
    const [validFile] = this.validateFiles([file]);
    const serviceCode = getServiceCode();
    if (!serviceCode) {
      throw new Error("No se ha definido el serviceCode del chatbot.");
    }

    const formData = new FormData();
    formData.append("file", validFile);
    formData.append("serviceCode", serviceCode);

    let data: UploadResponse;
    try {
      data = await fetchWithAuth<UploadResponse>(API_ENDPOINTS.CHAT_UPLOADS, {
        method: "POST",
        body: formData,
      });
    } catch (err: unknown) {
      const message =
        err instanceof ApiError
          ? err.message
          : "No se ha podido subir el archivo.";
      console.error("[UploadRepository.uploadSingle] Error:", err);
      throw new Error(message);
    }

    if (!data || !data.url) {
      throw new Error("Respuesta inesperada del servidor al subir el archivo.");
    }

    return this.mapAttachment(data);
  }

  async uploadFiles(files: File[]): Promise<ChatAttachment[]> {
    if (!files.length) return [];

    const validFiles = this.validateFiles(files);
    const results: ChatAttachment[] = [];

    for (const file of validFiles) {
      const uploaded = await this.uploadSingle(file);
      results.push(uploaded);
    }

    return results;
  }
}
