import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { v2 as cloudinary } from "cloudinary";
import {
  StorageRepository,
  StorageUploadInput,
  StorageUploadResult,
} from "../../../domain/repositories/storage.repository";

@Injectable()
export class CloudinaryStorageRepository implements StorageRepository {
  constructor(private readonly configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>("CLOUDINARY_CLOUD_NAME"),
      api_key: this.configService.get<string>("CLOUDINARY_API_KEY"),
      api_secret: this.configService.get<string>("CLOUDINARY_API_SECRET"),
      secure: true,
    });
  }

  async uploadBase64(input: StorageUploadInput): Promise<StorageUploadResult> {
    const dataUrl = input.base64.startsWith("data:")
      ? input.base64
      : `data:${input.mimeType};base64,${input.base64}`;

    const result = await cloudinary.uploader.upload(dataUrl, {
      folder: "claimsflow",
      resource_type: "auto",
      filename_override: input.filename,
      use_filename: true,
    });

    return {
      storageKey: result.public_id,
      url: result.secure_url,
      sizeBytes: result.bytes ?? 0,
    };
  }
}
