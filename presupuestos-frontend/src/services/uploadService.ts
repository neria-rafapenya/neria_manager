import { apiRequest } from "../api/client";
import { UploadResponse } from "../types/upload";

export async function uploadFile(file: File, folder?: string) {
  const formData = new FormData();
  formData.append("file", file);
  if (folder) {
    formData.append("folder", folder);
  }
  return apiRequest<UploadResponse>("/uploads", {
    method: "POST",
    body: formData,
    skipContentType: true,
    requestName: "UPLOAD_cloudinary",
  });
}
