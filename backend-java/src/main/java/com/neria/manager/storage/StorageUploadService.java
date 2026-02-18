package com.neria.manager.storage;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.ByteArrayOutputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3ClientBuilder;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.core.sync.RequestBody;

@Service
public class StorageUploadService {
  private final TenantServiceStorageService storageService;
  private final ObjectMapper objectMapper;
  private final HttpClient httpClient;

  public StorageUploadService(TenantServiceStorageService storageService, ObjectMapper objectMapper) {
    this.storageService = storageService;
    this.objectMapper = objectMapper;
    this.httpClient = HttpClient.newBuilder().build();
  }

  public UploadResult upload(String tenantId, String serviceCode, MultipartFile file) {
    TenantServiceStorageService.ResolvedStorage resolved =
        storageService.resolve(tenantId, serviceCode);
    String provider = resolved.provider != null ? resolved.provider.toLowerCase(Locale.ROOT) : "";
    if (provider.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Storage provider missing");
    }
    switch (provider) {
      case "cloudinary":
        return uploadCloudinary(resolved.config, tenantId, serviceCode, file);
      case "s3":
      case "minio":
      case "ibm":
      case "google":
      case "gcs":
        return uploadS3Compatible(resolved.config, tenantId, serviceCode, file, provider);
      case "azure":
        return uploadAzure(resolved.config, tenantId, serviceCode, file);
      default:
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Storage provider not supported");
    }
  }

  public UploadResult uploadBytes(
      String tenantId,
      String serviceCode,
      String filename,
      String contentType,
      byte[] bytes) {
    TenantServiceStorageService.ResolvedStorage resolved =
        storageService.resolve(tenantId, serviceCode);
    String provider = resolved.provider != null ? resolved.provider.toLowerCase(Locale.ROOT) : "";
    if (provider.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Storage provider missing");
    }
    String safeName = sanitizeFilename(filename);
    String type = contentType != null ? contentType : "application/octet-stream";
    switch (provider) {
      case "cloudinary":
        return uploadCloudinaryBytes(resolved.config, tenantId, serviceCode, safeName, type, bytes);
      case "s3":
      case "minio":
      case "ibm":
      case "google":
      case "gcs":
        return uploadS3CompatibleBytes(
            resolved.config, tenantId, serviceCode, safeName, type, bytes, provider);
      case "azure":
        return uploadAzureBytes(resolved.config, tenantId, serviceCode, safeName, type, bytes);
      default:
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Storage provider not supported");
    }
  }

  private UploadResult uploadCloudinary(
      Map<String, Object> config,
      String tenantId,
      String serviceCode,
      MultipartFile file) {
    String cloudName = asString(config.get("cloudName"));
    String apiKey = asString(config.get("apiKey"));
    String apiSecret = asString(config.get("apiSecret"));
    String uploadPreset = asString(config.get("uploadPreset"));
    String folder = asString(config.getOrDefault("folder", "tenant-" + tenantId + "/" + serviceCode));
    if (cloudName == null || apiKey == null || apiSecret == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cloudinary config missing");
    }

    long timestamp = Instant.now().getEpochSecond();
    String publicId = UUID.randomUUID().toString();

    Map<String, String> params = new HashMap<>();
    params.put("timestamp", String.valueOf(timestamp));
    params.put("folder", folder);
    params.put("public_id", publicId);
    if (uploadPreset != null && !uploadPreset.isBlank()) {
      params.put("upload_preset", uploadPreset);
    }
    String signature = signCloudinary(params, apiSecret);

    Map<String, Object> fields = new HashMap<>(params);
    fields.put("api_key", apiKey);
    fields.put("signature", signature);
    fields.put("resource_type", "auto");

    String boundary = "----NeriaBoundary" + UUID.randomUUID();
    byte[] body = buildMultipart(boundary, fields, file);

    String endpoint = "https://api.cloudinary.com/v1_1/" + cloudName + "/auto/upload";
    try {
      HttpRequest request =
          HttpRequest.newBuilder()
              .uri(URI.create(endpoint))
              .header("Content-Type", "multipart/form-data; boundary=" + boundary)
              .POST(HttpRequest.BodyPublishers.ofByteArray(body))
              .build();
      HttpResponse<String> response =
          httpClient.send(request, HttpResponse.BodyHandlers.ofString());
      if (response.statusCode() >= 400) {
        throw new ResponseStatusException(
            HttpStatus.BAD_REQUEST, "Cloudinary upload failed: " + response.body());
      }
      Map<String, Object> parsed =
          objectMapper.readValue(response.body(), new TypeReference<Map<String, Object>>() {});
      UploadResult result = new UploadResult();
      result.provider = "cloudinary";
      result.url = asString(parsed.getOrDefault("secure_url", parsed.get("url")));
      result.storageKey = asString(parsed.get("public_id"));
      result.originalName = file.getOriginalFilename();
      result.contentType = file.getContentType();
      result.size = file.getSize();
      return result;
    } catch (Exception ex) {
      if (ex instanceof ResponseStatusException) {
        throw (ResponseStatusException) ex;
      }
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cloudinary upload failed", ex);
    }
  }

  private String signCloudinary(Map<String, String> params, String apiSecret) {
    String payload =
        params.entrySet().stream()
            .sorted(Comparator.comparing(Map.Entry::getKey))
            .map(entry -> entry.getKey() + "=" + entry.getValue())
            .reduce((a, b) -> a + "&" + b)
            .orElse("");
    String toSign = payload + apiSecret;
    try {
      MessageDigest md = MessageDigest.getInstance("SHA-1");
      byte[] digest = md.digest(toSign.getBytes(StandardCharsets.UTF_8));
      StringBuilder sb = new StringBuilder();
      for (byte b : digest) {
        sb.append(String.format("%02x", b));
      }
      return sb.toString();
    } catch (Exception ex) {
      throw new IllegalStateException("Unable to sign Cloudinary request", ex);
    }
  }

  private UploadResult uploadS3Compatible(
      Map<String, Object> config,
      String tenantId,
      String serviceCode,
      MultipartFile file,
      String provider) {
    String accessKey = asString(config.get("accessKey"));
    String secretKey = asString(config.get("secretKey"));
    String bucket = asString(config.get("bucket"));
    String region = asString(config.getOrDefault("region", "us-east-1"));
    String endpoint = asString(config.get("endpoint"));

    if (accessKey == null || secretKey == null || bucket == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "S3 config missing");
    }
    String key =
        "tenant-"
            + tenantId
            + "/"
            + serviceCode
            + "/"
            + UUID.randomUUID()
            + "-"
            + sanitizeFilename(file.getOriginalFilename());

    AwsBasicCredentials creds = AwsBasicCredentials.create(accessKey, secretKey);
    S3ClientBuilder builder =
        S3Client.builder()
            .credentialsProvider(StaticCredentialsProvider.create(creds))
            .region(Region.of(region));
    if (endpoint != null && !endpoint.isBlank()) {
      builder =
          builder.endpointOverride(URI.create(endpoint))
              .serviceConfiguration(S3Configuration.builder().pathStyleAccessEnabled(true).build());
    }
    try (S3Client s3 = builder.build()) {
      PutObjectRequest request =
          PutObjectRequest.builder()
              .bucket(bucket)
              .key(key)
              .contentType(file.getContentType())
              .build();
      s3.putObject(request, RequestBody.fromBytes(file.getBytes()));
    } catch (Exception ex) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "S3 upload failed", ex);
    }

    UploadResult result = new UploadResult();
    result.provider = provider;
    result.storageKey = key;
    result.originalName = file.getOriginalFilename();
    result.contentType = file.getContentType();
    result.size = file.getSize();
    result.url = buildS3Url(endpoint, bucket, region, key, provider);
    return result;
  }

  private UploadResult uploadAzure(
      Map<String, Object> config, String tenantId, String serviceCode, MultipartFile file) {
    String account = asString(config.get("account"));
    String container = asString(config.get("container"));
    String sasToken = asString(config.get("sasToken"));
    String endpoint = asString(config.get("endpoint"));
    if (account == null || container == null || sasToken == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Azure config missing");
    }
    String base =
        endpoint != null && !endpoint.isBlank()
            ? endpoint
            : "https://" + account + ".blob.core.windows.net";
    String key =
        "tenant-"
            + tenantId
            + "/"
            + serviceCode
            + "/"
            + UUID.randomUUID()
            + "-"
            + sanitizeFilename(file.getOriginalFilename());
    String url = base + "/" + container + "/" + key;
    String signedUrl = url + (sasToken.startsWith("?") ? sasToken : "?" + sasToken);
    try {
      HttpRequest request =
          HttpRequest.newBuilder()
              .uri(URI.create(signedUrl))
              .header("x-ms-blob-type", "BlockBlob")
              .header(
                  "Content-Type",
                  file.getContentType() != null ? file.getContentType() : "application/octet-stream")
              .PUT(HttpRequest.BodyPublishers.ofByteArray(file.getBytes()))
              .build();
      HttpResponse<String> response =
          httpClient.send(request, HttpResponse.BodyHandlers.ofString());
      if (response.statusCode() >= 300) {
        throw new ResponseStatusException(
            HttpStatus.BAD_REQUEST, "Azure upload failed: " + response.body());
      }
    } catch (Exception ex) {
      if (ex instanceof ResponseStatusException) {
        throw (ResponseStatusException) ex;
      }
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Azure upload failed", ex);
    }

    UploadResult result = new UploadResult();
    result.provider = "azure";
    result.storageKey = key;
    result.originalName = file.getOriginalFilename();
    result.contentType = file.getContentType();
    result.size = file.getSize();
    result.url = signedUrl;
    return result;
  }

  private UploadResult uploadCloudinaryBytes(
      Map<String, Object> config,
      String tenantId,
      String serviceCode,
      String filename,
      String contentType,
      byte[] bytes) {
    String cloudName = asString(config.get("cloudName"));
    String apiKey = asString(config.get("apiKey"));
    String apiSecret = asString(config.get("apiSecret"));
    String uploadPreset = asString(config.get("uploadPreset"));
    String folder = asString(config.getOrDefault("folder", "tenant-" + tenantId + "/" + serviceCode));
    if (cloudName == null || apiKey == null || apiSecret == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cloudinary config missing");
    }

    long timestamp = Instant.now().getEpochSecond();
    String publicId = UUID.randomUUID().toString();

    Map<String, String> params = new HashMap<>();
    params.put("timestamp", String.valueOf(timestamp));
    params.put("folder", folder);
    params.put("public_id", publicId);
    if (uploadPreset != null && !uploadPreset.isBlank()) {
      params.put("upload_preset", uploadPreset);
    }
    String signature = signCloudinary(params, apiSecret);

    Map<String, Object> fields = new HashMap<>(params);
    fields.put("api_key", apiKey);
    fields.put("signature", signature);
    fields.put("resource_type", "auto");

    String boundary = "----NeriaBoundary" + UUID.randomUUID();
    byte[] body = buildMultipart(boundary, fields, filename, contentType, bytes);

    String endpoint = "https://api.cloudinary.com/v1_1/" + cloudName + "/auto/upload";
    try {
      HttpRequest request =
          HttpRequest.newBuilder()
              .uri(URI.create(endpoint))
              .header("Content-Type", "multipart/form-data; boundary=" + boundary)
              .POST(HttpRequest.BodyPublishers.ofByteArray(body))
              .build();
      HttpResponse<String> response =
          httpClient.send(request, HttpResponse.BodyHandlers.ofString());
      if (response.statusCode() >= 400) {
        throw new ResponseStatusException(
            HttpStatus.BAD_REQUEST, "Cloudinary upload failed: " + response.body());
      }
      Map<String, Object> parsed =
          objectMapper.readValue(response.body(), new TypeReference<Map<String, Object>>() {});
      UploadResult result = new UploadResult();
      result.provider = "cloudinary";
      result.url = asString(parsed.getOrDefault("secure_url", parsed.get("url")));
      result.storageKey = asString(parsed.get("public_id"));
      result.originalName = filename;
      result.contentType = contentType;
      result.size = bytes != null ? bytes.length : 0;
      return result;
    } catch (Exception ex) {
      if (ex instanceof ResponseStatusException) {
        throw (ResponseStatusException) ex;
      }
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cloudinary upload failed", ex);
    }
  }

  private UploadResult uploadS3CompatibleBytes(
      Map<String, Object> config,
      String tenantId,
      String serviceCode,
      String filename,
      String contentType,
      byte[] bytes,
      String provider) {
    String accessKey = asString(config.get("accessKey"));
    String secretKey = asString(config.get("secretKey"));
    String bucket = asString(config.get("bucket"));
    String region = asString(config.getOrDefault("region", "us-east-1"));
    String endpoint = asString(config.get("endpoint"));

    if (accessKey == null || secretKey == null || bucket == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "S3 config missing");
    }
    String key =
        "tenant-"
            + tenantId
            + "/"
            + serviceCode
            + "/"
            + UUID.randomUUID()
            + "-"
            + sanitizeFilename(filename);

    AwsBasicCredentials creds = AwsBasicCredentials.create(accessKey, secretKey);
    S3ClientBuilder builder =
        S3Client.builder()
            .credentialsProvider(StaticCredentialsProvider.create(creds))
            .region(Region.of(region));
    if (endpoint != null && !endpoint.isBlank()) {
      builder =
          builder.endpointOverride(URI.create(endpoint))
              .serviceConfiguration(S3Configuration.builder().pathStyleAccessEnabled(true).build());
    }
    try (S3Client s3 = builder.build()) {
      PutObjectRequest request =
          PutObjectRequest.builder()
              .bucket(bucket)
              .key(key)
              .contentType(contentType)
              .build();
      s3.putObject(request, RequestBody.fromBytes(bytes));
    } catch (Exception ex) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "S3 upload failed", ex);
    }

    UploadResult result = new UploadResult();
    result.provider = provider;
    result.storageKey = key;
    result.originalName = filename;
    result.contentType = contentType;
    result.size = bytes != null ? bytes.length : 0;
    result.url = buildS3Url(endpoint, bucket, region, key, provider);
    return result;
  }

  private UploadResult uploadAzureBytes(
      Map<String, Object> config,
      String tenantId,
      String serviceCode,
      String filename,
      String contentType,
      byte[] bytes) {
    String account = asString(config.get("account"));
    String container = asString(config.get("container"));
    String sasToken = asString(config.get("sasToken"));
    String endpoint = asString(config.get("endpoint"));
    if (account == null || container == null || sasToken == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Azure config missing");
    }
    String base =
        endpoint != null && !endpoint.isBlank()
            ? endpoint
            : "https://" + account + ".blob.core.windows.net";
    String key =
        "tenant-"
            + tenantId
            + "/"
            + serviceCode
            + "/"
            + UUID.randomUUID()
            + "-"
            + sanitizeFilename(filename);
    String url = base + "/" + container + "/" + key;
    String signedUrl = url + (sasToken.startsWith("?") ? sasToken : "?" + sasToken);
    try {
      HttpRequest request =
          HttpRequest.newBuilder()
              .uri(URI.create(signedUrl))
              .header("x-ms-blob-type", "BlockBlob")
              .header("Content-Type", contentType)
              .PUT(HttpRequest.BodyPublishers.ofByteArray(bytes))
              .build();
      HttpResponse<String> response =
          httpClient.send(request, HttpResponse.BodyHandlers.ofString());
      if (response.statusCode() >= 300) {
        throw new ResponseStatusException(
            HttpStatus.BAD_REQUEST, "Azure upload failed: " + response.body());
      }
    } catch (Exception ex) {
      if (ex instanceof ResponseStatusException) {
        throw (ResponseStatusException) ex;
      }
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Azure upload failed", ex);
    }

    UploadResult result = new UploadResult();
    result.provider = "azure";
    result.storageKey = key;
    result.originalName = filename;
    result.contentType = contentType;
    result.size = bytes != null ? bytes.length : 0;
    result.url = signedUrl;
    return result;
  }

  private byte[] buildMultipart(
      String boundary, Map<String, Object> fields, MultipartFile file) {
    try {
      ByteArrayOutputStream baos = new ByteArrayOutputStream();
      for (Map.Entry<String, Object> entry : fields.entrySet()) {
        if (entry.getValue() == null) {
          continue;
        }
        baos.write(("--" + boundary + "\r\n").getBytes(StandardCharsets.UTF_8));
        baos.write(
            ("Content-Disposition: form-data; name=\"" + entry.getKey() + "\"\r\n\r\n")
                .getBytes(StandardCharsets.UTF_8));
        baos.write(String.valueOf(entry.getValue()).getBytes(StandardCharsets.UTF_8));
        baos.write("\r\n".getBytes(StandardCharsets.UTF_8));
      }
      if (file != null) {
        baos.write(("--" + boundary + "\r\n").getBytes(StandardCharsets.UTF_8));
        String filename = sanitizeFilename(file.getOriginalFilename());
        String contentType =
            file.getContentType() != null ? file.getContentType() : "application/octet-stream";
        baos.write(
            ("Content-Disposition: form-data; name=\"file\"; filename=\"" + filename + "\"\r\n")
                .getBytes(StandardCharsets.UTF_8));
        baos.write(("Content-Type: " + contentType + "\r\n\r\n").getBytes(StandardCharsets.UTF_8));
        baos.write(file.getBytes());
        baos.write("\r\n".getBytes(StandardCharsets.UTF_8));
      }
      baos.write(("--" + boundary + "--\r\n").getBytes(StandardCharsets.UTF_8));
      return baos.toByteArray();
    } catch (Exception ex) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unable to build upload request", ex);
    }
  }

  private byte[] buildMultipart(
      String boundary, Map<String, Object> fields, String filename, String contentType, byte[] bytes) {
    try {
      ByteArrayOutputStream baos = new ByteArrayOutputStream();
      for (Map.Entry<String, Object> entry : fields.entrySet()) {
        if (entry.getValue() == null) {
          continue;
        }
        baos.write(("--" + boundary + "\r\n").getBytes(StandardCharsets.UTF_8));
        baos.write(
            ("Content-Disposition: form-data; name=\"" + entry.getKey() + "\"\r\n\r\n")
                .getBytes(StandardCharsets.UTF_8));
        baos.write(String.valueOf(entry.getValue()).getBytes(StandardCharsets.UTF_8));
        baos.write("\r\n".getBytes(StandardCharsets.UTF_8));
      }
      if (bytes != null) {
        baos.write(("--" + boundary + "\r\n").getBytes(StandardCharsets.UTF_8));
        String safeName = sanitizeFilename(filename);
        String type = contentType != null ? contentType : "application/octet-stream";
        baos.write(
            ("Content-Disposition: form-data; name=\"file\"; filename=\"" + safeName + "\"\r\n")
                .getBytes(StandardCharsets.UTF_8));
        baos.write(("Content-Type: " + type + "\r\n\r\n").getBytes(StandardCharsets.UTF_8));
        baos.write(bytes);
        baos.write("\r\n".getBytes(StandardCharsets.UTF_8));
      }
      baos.write(("--" + boundary + "--\r\n").getBytes(StandardCharsets.UTF_8));
      return baos.toByteArray();
    } catch (Exception ex) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unable to build upload request", ex);
    }
  }

  private String sanitizeFilename(String name) {
    if (name == null || name.isBlank()) {
      return "file";
    }
    return name.replaceAll("[^a-zA-Z0-9._-]", "_");
  }

  private String buildS3Url(
      String endpoint, String bucket, String region, String key, String provider) {
    if (endpoint != null && !endpoint.isBlank()) {
      String base = endpoint.endsWith("/") ? endpoint.substring(0, endpoint.length() - 1) : endpoint;
      return base + "/" + bucket + "/" + key;
    }
    if ("s3".equals(provider)) {
      return "https://" + bucket + ".s3." + region + ".amazonaws.com/" + key;
    }
    return "https://" + bucket + ".s3." + region + ".amazonaws.com/" + key;
  }

  private String asString(Object value) {
    return value != null ? String.valueOf(value) : null;
  }

  public static class UploadResult {
    public String provider;
    public String url;
    public String storageKey;
    public String originalName;
    public String contentType;
    public long size;
  }
}
