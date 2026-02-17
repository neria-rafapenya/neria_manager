package com.neria.manager.storage;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.neria.manager.common.entities.TenantServiceStorage;
import com.neria.manager.common.repos.TenantServiceStorageRepository;
import com.neria.manager.common.services.EncryptionService;
import com.neria.manager.config.AppProperties;
import java.net.URI;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class TenantServiceStorageService {
  private final TenantServiceStorageRepository repository;
  private final EncryptionService encryptionService;
  private final ObjectMapper objectMapper;
  private final AppProperties properties;

  public TenantServiceStorageService(
      TenantServiceStorageRepository repository,
      EncryptionService encryptionService,
      ObjectMapper objectMapper,
      AppProperties properties) {
    this.repository = repository;
    this.encryptionService = encryptionService;
    this.objectMapper = objectMapper;
    this.properties = properties;
  }

  public StorageResponse get(String tenantId, String serviceCode) {
    Optional<TenantServiceStorage> stored =
        repository.findByTenantIdAndServiceCode(tenantId, serviceCode);
    if (stored.isEmpty()) {
      return StorageResponse.defaultCloudinary();
    }
    TenantServiceStorage entity = stored.get();
    Map<String, Object> config = decryptConfig(entity.getEncryptedConfig());
    return StorageResponse.fromEntity(entity, config);
  }

  public StorageResponse upsert(String tenantId, String serviceCode, StorageRequest request) {
    if (request == null || request.provider == null || request.provider.isBlank()) {
      repository.deleteByTenantIdAndServiceCode(tenantId, serviceCode);
      return StorageResponse.defaultCloudinary();
    }
    String provider = request.provider.trim().toLowerCase();
    boolean enabled = request.enabled == null || request.enabled;
    Map<String, Object> config = request.config == null ? Map.of() : request.config;
    String encrypted = encryptConfig(config);

    TenantServiceStorage entity =
        repository
            .findByTenantIdAndServiceCode(tenantId, serviceCode)
            .orElseGet(
                () -> {
                  TenantServiceStorage created = new TenantServiceStorage();
                  created.setId(UUID.randomUUID().toString());
                  created.setTenantId(tenantId);
                  created.setServiceCode(serviceCode);
                  created.setCreatedAt(LocalDateTime.now());
                  return created;
                });
    entity.setProvider(provider);
    entity.setEnabled(enabled);
    entity.setEncryptedConfig(encrypted);
    entity.setUpdatedAt(LocalDateTime.now());
    TenantServiceStorage saved = repository.save(entity);
    return StorageResponse.fromEntity(saved, config);
  }

  public void delete(String tenantId, String serviceCode) {
    repository.deleteByTenantIdAndServiceCode(tenantId, serviceCode);
  }

  public ResolvedStorage resolve(String tenantId, String serviceCode) {
    Optional<TenantServiceStorage> stored =
        repository.findByTenantIdAndServiceCode(tenantId, serviceCode);
    if (stored.isEmpty() || !stored.get().isEnabled()) {
      return ResolvedStorage.defaultCloudinary(loadDefaultCloudinaryConfig());
    }
    TenantServiceStorage entity = stored.get();
    Map<String, Object> config = decryptConfig(entity.getEncryptedConfig());
    return new ResolvedStorage(entity.getProvider(), config, false);
  }

  private Map<String, Object> decryptConfig(String encrypted) {
    if (encrypted == null || encrypted.isBlank()) {
      return Map.of();
    }
    try {
      String decrypted = encryptionService.decrypt(encrypted);
      return objectMapper.readValue(decrypted, new TypeReference<Map<String, Object>>() {});
    } catch (Exception ex) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid storage config");
    }
  }

  private String encryptConfig(Map<String, Object> config) {
    try {
      String json = objectMapper.writeValueAsString(config);
      return encryptionService.encrypt(json);
    } catch (JsonProcessingException ex) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid storage config");
    }
  }

  private Map<String, Object> loadDefaultCloudinaryConfig() {
    String fromEnv = System.getenv("CLOUDINARY_URL");
    String fromProps = properties.getStorage().getCloudinaryUrl();
    String value = fromEnv != null && !fromEnv.isBlank() ? fromEnv : fromProps;
    if (value == null || value.isBlank()) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST, "CLOUDINARY_URL is required for default storage");
    }
    return parseCloudinaryUrl(value);
  }

  private Map<String, Object> parseCloudinaryUrl(String url) {
    try {
      URI uri = URI.create(url);
      String cloudName = uri.getHost();
      String userInfo = uri.getUserInfo();
      String apiKey = null;
      String apiSecret = null;
      if (userInfo != null && userInfo.contains(":")) {
        String[] parts = userInfo.split(":", 2);
        apiKey = parts[0];
        apiSecret = parts[1];
      }
      if (cloudName == null || apiKey == null || apiSecret == null) {
        throw new IllegalArgumentException("Invalid cloudinary url");
      }
      return Map.of(
          "cloudName", cloudName,
          "apiKey", apiKey,
          "apiSecret", apiSecret);
    } catch (Exception ex) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST, "Invalid CLOUDINARY_URL format");
    }
  }

  public static class StorageRequest {
    public String provider;
    public Boolean enabled;
    public Map<String, Object> config;
  }

  public static class StorageResponse {
    public String provider;
    public boolean enabled;
    public boolean usingDefault;
    public Map<String, Object> config;

    public static StorageResponse defaultCloudinary() {
      StorageResponse response = new StorageResponse();
      response.provider = "cloudinary";
      response.enabled = true;
      response.usingDefault = true;
      response.config = null;
      return response;
    }

    public static StorageResponse fromEntity(
        TenantServiceStorage entity, Map<String, Object> config) {
      StorageResponse response = new StorageResponse();
      response.provider = entity.getProvider();
      response.enabled = entity.isEnabled();
      response.usingDefault = false;
      response.config = config;
      return response;
    }
  }

  public static class ResolvedStorage {
    public String provider;
    public Map<String, Object> config;
    public boolean usingDefault;

    public ResolvedStorage(String provider, Map<String, Object> config, boolean usingDefault) {
      this.provider = provider;
      this.config = config;
      this.usingDefault = usingDefault;
    }

    public static ResolvedStorage defaultCloudinary(Map<String, Object> config) {
      return new ResolvedStorage("cloudinary", config, true);
    }
  }
}
