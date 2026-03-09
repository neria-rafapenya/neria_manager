export interface StorageUploadInput {
  base64: string;
  filename: string;
  mimeType: string;
}

export interface StorageUploadResult {
  storageKey: string;
  url: string;
  sizeBytes: number;
}

export interface StorageRepository {
  uploadBase64(input: StorageUploadInput): Promise<StorageUploadResult>;
}
