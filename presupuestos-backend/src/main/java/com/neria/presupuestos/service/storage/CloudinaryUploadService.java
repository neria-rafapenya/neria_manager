package com.neria.presupuestos.service.storage;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.neria.presupuestos.config.cloudinary.CloudinaryProperties;
import com.neria.presupuestos.model.dto.UploadResponse;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
public class CloudinaryUploadService {

    private final Cloudinary cloudinary;
    private final CloudinaryProperties properties;

    public CloudinaryUploadService(Cloudinary cloudinary, CloudinaryProperties properties) {
        this.cloudinary = cloudinary;
        this.properties = properties;
    }

    public UploadResponse upload(MultipartFile file, String folderOverride) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is required");
        }
        String folder = folderOverride != null && !folderOverride.isBlank()
                ? folderOverride
                : properties.getFolder();
        try {
            Map<String, Object> params = ObjectUtils.asMap(
                    "folder", folder,
                    "resource_type", "auto",
                    "type", "upload",
                    "access_mode", "public"
            );
            Map<?, ?> result = cloudinary.uploader().upload(file.getBytes(), params);
            return toResponse(result);
        } catch (IOException ex) {
            throw new IllegalStateException("Upload failed", ex);
        }
    }

    public UploadResponse uploadBytes(byte[] bytes, String fileName, String contentType, String folderOverride) {
        if (bytes == null || bytes.length == 0) {
            throw new IllegalArgumentException("Bytes are required");
        }
        String folder = folderOverride != null && !folderOverride.isBlank()
                ? folderOverride
                : properties.getFolder();
        try {
            String lowerName = fileName == null ? "" : fileName.toLowerCase();
            String lowerType = contentType == null ? "" : contentType.toLowerCase();
            boolean isPdf = lowerType.contains("pdf") || lowerName.endsWith(".pdf");
            String resourceType = isPdf ? "raw" : "auto";
            Map<String, Object> params = ObjectUtils.asMap(
                    "folder", folder,
                    "resource_type", resourceType,
                    "filename_override", fileName,
                    "use_filename", true,
                    "type", "upload",
                    "access_mode", "public"
            );
            if (isPdf) {
                params.put("format", "pdf");
            }
            Map<?, ?> result = cloudinary.uploader().upload(bytes, params);
            return toResponse(result);
        } catch (IOException ex) {
            throw new IllegalStateException("Upload failed", ex);
        }
    }

    private UploadResponse toResponse(Map<?, ?> result) {
        UploadResponse response = new UploadResponse();
        response.setPublicId((String) result.get("public_id"));
        response.setUrl((String) result.get("url"));
        response.setSecureUrl((String) result.get("secure_url"));
        response.setResourceType((String) result.get("resource_type"));
        response.setFormat((String) result.get("format"));
        response.setBytes(result.get("bytes") == null ? null : ((Number) result.get("bytes")).longValue());
        response.setWidth(result.get("width") == null ? null : ((Number) result.get("width")).intValue());
        response.setHeight(result.get("height") == null ? null : ((Number) result.get("height")).intValue());
        return response;
    }
}
