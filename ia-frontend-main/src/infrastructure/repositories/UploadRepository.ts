// src/infrastructure/repositories/UploadRepository.ts

import { fetchWithAuth, ApiError } from "../api/api";
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

  /**
   * SINGLE:
   *  - Endpoint: POST /uploads
   *  - Body: form-data con key "file"
   *  - Respuesta esperada:
   *    { ok: true, attachment: {...} }  ó  { ok: true, attachments: [ {...} ] }
   */
  async uploadSingle(file: File): Promise<ChatAttachment> {
    const [validFile] = this.validateFiles([file]);

    const formData = new FormData();
    formData.append("file", validFile); // 👈 single → "file"

    let data: {
      ok: boolean;
      attachment?: ChatAttachment;
      attachments?: ChatAttachment[];
    };
    try {
      data = await fetchWithAuth("/uploads", {
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

    if (!data.ok) {
      throw new Error("El servidor ha devuelto ok=false al subir el archivo.");
    }

    if (data.attachment) return data.attachment;

    if (Array.isArray(data.attachments) && data.attachments[0]) {
      return data.attachments[0];
    }

    throw new Error("Respuesta inesperada del servidor al subir el archivo.");
  }

  /**
   * MULTIPLE:
   *  - Endpoint: POST /uploads/multiple
   *  - Body: form-data con varias keys "files"
   *  - Respuesta esperada:
   *    { ok: true, attachments: [ {...}, {...}, ... ] }
   */
  async uploadMultiple(files: File[]): Promise<ChatAttachment[]> {
    const validFiles = this.validateFiles(files);

    const formData = new FormData();
    validFiles.forEach((file) => formData.append("files", file)); // 👈 multiple → "files"

    let data: { ok: boolean; attachments?: ChatAttachment[] };
    try {
      data = await fetchWithAuth("/uploads/multiple", {
        method: "POST",
        body: formData,
      });
    } catch (err: unknown) {
      const message =
        err instanceof ApiError
          ? err.message
          : "No se han podido subir los archivos.";
      console.error("[UploadRepository.uploadMultiple] Error:", err);
      throw new Error(message);
    }

    if (!data.ok) {
      throw new Error(
        "El servidor ha devuelto ok=false al subir los archivos."
      );
    }

    if (!Array.isArray(data.attachments)) {
      throw new Error("Respuesta inesperada del servidor (sin attachments).");
    }

    return data.attachments;
  }

  /**
   * Método unificado por si quieres llamarlo desde nuevos sitios:
   *  - 0 ficheros → []
   *  - 1 fichero → [uploadSingle(...)]
   *  - >1 fichero → uploadMultiple(...)
   */
  async uploadFiles(files: File[]): Promise<ChatAttachment[]> {
    if (!files.length) return [];

    if (files.length === 1) {
      const one = await this.uploadSingle(files[0]);
      return [one];
    }

    return this.uploadMultiple(files);
  }
}
