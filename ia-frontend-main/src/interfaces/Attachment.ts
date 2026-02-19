// src/interfaces/chat/Attachment.ts

export interface ChatAttachment {
  url: string;
  key: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
}
