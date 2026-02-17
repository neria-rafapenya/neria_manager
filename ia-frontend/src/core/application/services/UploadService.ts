import type { UploadRepository } from "../../../infrastructure/repositories";
import type { ChatAttachment } from "../../../interfaces";

export class UploadService {
  private readonly repository: UploadRepository;

  constructor(repository: UploadRepository) {
    this.repository = repository;
  }

  async uploadFiles(files: FileList | File[]): Promise<ChatAttachment[]> {
    const asArray = Array.isArray(files) ? files : Array.from(files);
    if (!asArray.length) return [];

    // Usamos el método unificado del repositorio
    return this.repository.uploadFiles(asArray);
  }
}
