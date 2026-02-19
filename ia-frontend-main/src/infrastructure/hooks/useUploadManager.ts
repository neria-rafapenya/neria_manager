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
  removeAttachment: (key: string) => void;
  clearAttachments: () => void;
}

export const useUploadManager = (): UseUploadManager => {
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setError("");
    setIsUploading(true);

    try {
      const uploaded = await uploadService.uploadFiles(files);
      if (uploaded && uploaded.length > 0) {
        setAttachments((prev) => [...prev, ...uploaded]);
      }
    } catch (e: unknown) {
      console.error("[useUploadManager] Error subiendo archivos", e);
      const msg =
        e instanceof Error
          ? e.message
          : "No se han podido subir los archivos. Inténtalo de nuevo.";
      setError(msg);
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
    removeAttachment,
    clearAttachments,
  };
};
