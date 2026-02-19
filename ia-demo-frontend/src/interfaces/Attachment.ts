// src/interfaces/chat/Attachment.ts

export interface ChatAttachment {
  fileId?: string;
  localFile?: File;
  url: string;
  key: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  status?: string;
  ocrStatus?: string;
  semanticStatus?: string;
  embeddingStatus?: string;
  embeddingCount?: number;
  resultType?: string;
  resultFileUrl?: string;
  provider?: string;
  storageKey?: string;
  name?: string;
  contentType?: string;
  size?: number;
}
