package com.neria.manager.clinicflow.services;

import com.neria.manager.auth.AuthService;
import com.neria.manager.clinicflow.entities.ClinicUser;
import com.neria.manager.clinicflow.repos.ClinicUserRepository;
import com.neria.manager.common.services.ScryptHasher;
import com.neria.manager.config.AppProperties;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ClinicUserService {
  private final ClinicUserRepository repository;
  private final ScryptHasher hasher;
  private final AuthService authService;
  private final String salt;

  public ClinicUserService(
      ClinicUserRepository repository,
      ScryptHasher hasher,
      AuthService authService,
      AppProperties properties) {
    this.repository = repository;
    this.hasher = hasher;
    this.authService = authService;
    this.salt = Optional.ofNullable(properties.getSecurity().getClinicPasswordSalt()).orElse("");
    if (this.salt.length() < 16) {
      throw new IllegalStateException("CLINIC_PASSWORD_SALT must be at least 16 characters");
    }
  }

  public List<ClinicUserResponse> list(String tenantId) {
    return repository.findAllByTenantId(tenantId).stream()
        .sorted(Comparator.comparing(ClinicUser::getCreatedAt).reversed())
        .map(ClinicUserResponse::fromEntity)
        .toList();
  }

  public ClinicUserResponse create(String tenantId, CreateClinicUserRequest dto) {
    if (dto == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing payload");
    }
    String email = normalizeEmail(dto.email);
    if (email == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email required");
    }
    if (repository.findByTenantIdAndEmail(tenantId, email).isPresent()) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already exists");
    }
    if (dto.password == null || dto.password.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password required");
    }
    ClinicUser user = new ClinicUser();
    user.setId(UUID.randomUUID().toString());
    user.setTenantId(tenantId);
    user.setEmail(email);
    user.setName(dto.name);
    user.setRole(dto.role != null && !dto.role.isBlank() ? dto.role : "staff");
    user.setStatus(dto.status != null && !dto.status.isBlank() ? dto.status : "active");
    user.setPasswordHash(hashPassword(dto.password));
    user.setMustChangePassword(Boolean.TRUE.equals(dto.mustChangePassword));
    user.setCreatedAt(LocalDateTime.now());
    user.setUpdatedAt(LocalDateTime.now());
    return ClinicUserResponse.fromEntity(repository.save(user));
  }

  public ClinicUserResponse update(String tenantId, String id, UpdateClinicUserRequest dto) {
    ClinicUser user = repository.findByIdAndTenantId(id, tenantId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    if (dto == null) {
      return ClinicUserResponse.fromEntity(user);
    }
    if (dto.name != null) {
      user.setName(dto.name);
    }
    if (dto.email != null && !dto.email.isBlank()) {
      String email = normalizeEmail(dto.email);
      if (!email.equalsIgnoreCase(user.getEmail())) {
        if (repository.findByTenantIdAndEmail(tenantId, email).isPresent()) {
          throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already exists");
        }
        user.setEmail(email);
      }
    }
    if (dto.role != null && !dto.role.isBlank()) {
      user.setRole(dto.role);
    }
    if (dto.status != null && !dto.status.isBlank()) {
      user.setStatus(dto.status);
    }
    if (dto.mustChangePassword != null) {
      user.setMustChangePassword(dto.mustChangePassword);
    }
    user.setUpdatedAt(LocalDateTime.now());
    return ClinicUserResponse.fromEntity(repository.save(user));
  }

  public void delete(String tenantId, String id) {
    ClinicUser user = repository.findByIdAndTenantId(id, tenantId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    repository.delete(user);
  }

  public ClinicUserResponse resetPassword(
      String tenantId, String id, ResetPasswordRequest dto) {
    if (dto == null || dto.password == null || dto.password.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password required");
    }
    ClinicUser user = repository.findByIdAndTenantId(id, tenantId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    user.setPasswordHash(hashPassword(dto.password));
    user.setMustChangePassword(Boolean.TRUE.equals(dto.mustChangePassword));
    user.setUpdatedAt(LocalDateTime.now());
    return ClinicUserResponse.fromEntity(repository.save(user));
  }

  public LoginResponse login(String tenantId, LoginRequest dto) {
    if (dto == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing payload");
    }
    String email = normalizeEmail(dto.email);
    if (email == null || dto.password == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email and password required");
    }
    ClinicUser user = repository.findByTenantIdAndEmail(tenantId, email)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));
    if (!"active".equalsIgnoreCase(user.getStatus())) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "User inactive");
    }
    if (!hasher.matches(dto.password, salt, user.getPasswordHash())) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
    }
    var token = authService.issueClinicToken(tenantId, user.getId(), user.getRole());
    return new LoginResponse(token.accessToken(), token.expiresIn(), ClinicUserResponse.fromEntity(user));
  }

  public ClinicUserResponse getById(String tenantId, String id) {
    ClinicUser user = repository.findByIdAndTenantId(id, tenantId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    return ClinicUserResponse.fromEntity(user);
  }

  private String hashPassword(String value) {
    return hasher.hash(value, salt);
  }

  private String normalizeEmail(String value) {
    if (value == null) return null;
    String trimmed = value.trim().toLowerCase();
    return trimmed.isBlank() ? null : trimmed;
  }

  public static class CreateClinicUserRequest {
    public String name;
    public String email;
    public String role;
    public String status;
    public String password;
    public Boolean mustChangePassword;
  }

  public static class UpdateClinicUserRequest {
    public String name;
    public String email;
    public String role;
    public String status;
    public Boolean mustChangePassword;
  }

  public static class ResetPasswordRequest {
    public String password;
    public Boolean mustChangePassword;
  }

  public static class LoginRequest {
    public String email;
    public String password;
    public String tenantId;
    public String serviceCode;
  }

  public record ClinicUserResponse(
      String id,
      String tenantId,
      String name,
      String email,
      String role,
      String status,
      boolean mustChangePassword,
      LocalDateTime createdAt,
      LocalDateTime updatedAt) {
    public static ClinicUserResponse fromEntity(ClinicUser entity) {
      return new ClinicUserResponse(
          entity.getId(),
          entity.getTenantId(),
          entity.getName(),
          entity.getEmail(),
          entity.getRole(),
          entity.getStatus(),
          entity.isMustChangePassword(),
          entity.getCreatedAt(),
          entity.getUpdatedAt());
    }
  }

  public record LoginResponse(String accessToken, long expiresIn, ClinicUserResponse user) {}
}
