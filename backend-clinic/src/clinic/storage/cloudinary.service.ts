import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { v2 as cloudinary } from "cloudinary";

@Injectable()
export class CloudinaryService {
  constructor(private readonly config: ConfigService) {
    const cloudName = this.config.get<string>("CLOUDINARY_CLOUD_NAME", "");
    const apiKey = this.config.get<string>("CLOUDINARY_API_KEY", "");
    const apiSecret = this.config.get<string>("CLOUDINARY_API_SECRET", "");
    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
    }
  }

  private async upload(
    buffer: Buffer,
    options: Record<string, any>,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(options, (error, result) => {
        if (error || !result) {
          reject(error || new Error("Upload failed"));
          return;
        }
        resolve(result.secure_url);
      });
      upload.end(buffer);
    });
  }

  async uploadAvatar(
    buffer: Buffer,
    filename: string,
    tenantId: string,
    userId: string,
  ): Promise<string> {
    return this.upload(buffer, {
      folder: `clinicflow/${tenantId}/avatars`,
      public_id: `user-${userId}`,
      overwrite: true,
      resource_type: "image",
    });
  }

  async uploadDocument(
    buffer: Buffer,
    filename: string,
    tenantId: string,
    patientUserId: string,
    resourceType: "raw" | "image",
  ): Promise<string> {
    return this.upload(buffer, {
      folder: `clinicflow/${tenantId}/documents/${patientUserId}`,
      public_id: filename.replace(/\.[^.]+$/, ""),
      overwrite: true,
      resource_type: resourceType,
    });
  }

  async uploadTreatmentReport(
    buffer: Buffer,
    filename: string,
    tenantId: string,
    patientUserId: string,
    resourceType: "raw" | "image",
  ): Promise<string> {
    return this.upload(buffer, {
      folder: `clinicflow/${tenantId}/treatments/${patientUserId}`,
      public_id: filename.replace(/\.[^.]+$/, ""),
      overwrite: true,
      resource_type: resourceType,
    });
  }
}
