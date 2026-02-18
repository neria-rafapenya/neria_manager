// src/infrastructure/hooks/useUploadManager.ts
import { useState } from "react";
import type { ChatAttachment } from "../../interfaces";
import { UploadService } from "../../core/application/services/UploadService";
import { UploadRepository } from "../repositories/UploadRepository";

const uploadRepository = new UploadRepository();
const uploadService = new UploadService(uploadRepository);

export interface UseUploadManager {
  attachments: ChatAttachment[];
  isUploading: boolean;
  error: string;
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  handleFilesSelected: (files: FileList | null) => Promise<void>;
  uploadPending: (conversationId?: string) => Promise<ChatAttachment[]>;
  removeAttachment: (key: string) => void;
  clearAttachments: () => void;
}

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

export const useUploadManager = (): UseUploadManager => {
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const validateFiles = (files: File[]): File[] => {
    if (!files.length) return [];

    const validFiles: File[] = [];
    const errors: string[] = [];

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        errors.push(`El archivo "${file.name}" supera el límite de 5MB.`);
        continue;
      }

      const isImage = file.type.startsWith("image/");
      const isAllowedDocument = !isImage && ALLOWED_MIME_TYPES.includes(file.type);

      if (!isImage && !isAllowedDocument) {
        errors.push(
          `El archivo "${file.name}" tiene un tipo no permitido (${file.type}).`,
        );
        continue;
      }

      validFiles.push(file);
    }

    if (!validFiles.length) {
      throw new Error(errors.join(" ") || "No se han seleccionado archivos válidos.");
    }

    const total = attachments.length + validFiles.length;
    if (total > 5) {
      throw new Error("Solo se permiten un máximo de 5 archivos por subida.");
    }

    return validFiles;
  };

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setError("");

    try {
      const asArray = Array.from(files);
      const validFiles = validateFiles(asArray);
      const staged = validFiles.map((file) => ({
        fileId: undefined,
        localFile: file,
        url: "",
        key: `${file.name}-${file.size}-${file.lastModified}-${Math.random()
          .toString(36)
          .slice(2)}`,
        filename: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        status: "pending",
      }));
      setAttachments((prev) => [...prev, ...staged]);
    } catch (e: unknown) {
      console.error("[useUploadManager] Error preparando archivos", e);
      const msg =
        e instanceof Error
          ? e.message
          : "No se han podido preparar los archivos. Inténtalo de nuevo.";
      setError(msg);
    }
  };

  const uploadPending = async (conversationId?: string) => {
    const pending = attachments.filter((att) => att.localFile);
    const ready = attachments.filter((att) => !att.localFile);
    if (pending.length === 0) {
      return ready;
    }

    setError("");
    setIsUploading(true);
    try {
      const files = pending.map((att) => att.localFile!).filter(Boolean);
      const uploaded = await uploadService.uploadFiles(files, conversationId);
      return [...ready, ...uploaded];
    } catch (e: unknown) {
      console.error("[useUploadManager] Error subiendo archivos", e);
      const msg =
        e instanceof Error
          ? e.message
          : "No se han podido subir los archivos. Inténtalo de nuevo.";
      setError(msg);
      throw e;
    } finally {
      setIsUploading(false);
    }
  };

  const removeAttachment = (key: string) => {
    setAttachments((prev) => prev.filter((att) => att.key !== key));
  };

  const clearAttachments = () => {
    setAttachments([]);
    setError("");
  };

  return {
    attachments,
    isUploading,
    error,
    isModalOpen,
    openModal,
    closeModal,
    handleFilesSelected,
    uploadPending,
    removeAttachment,
    clearAttachments,
  };
};
