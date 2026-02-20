package com.neria.manager.auth;

import com.neria.manager.common.entities.AdminUser;
import com.neria.manager.common.entities.Tenant;
import com.neria.manager.common.security.AuthContext;
import com.neria.manager.common.services.EmailService;
import com.neria.manager.storage.StorageUploadService;
import com.neria.manager.config.AppProperties;
import com.neria.manager.tenants.TenantsService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.time.Duration;
import java.util.Map;
import java.util.LinkedHashMap;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
public class AuthController {
  private final AuthService authService;
  private final AdminUsersService adminUsersService;
  private final AdminPasswordResetService resetService;
  private final EmailService emailService;
  private final TenantAuthService tenantAuthService;
  private final TenantsService tenantsService;
  private final StorageUploadService storageUploadService;
  private final AppProperties properties;

  public AuthController(
      AuthService authService,
      AdminUsersService adminUsersService,
      AdminPasswordResetService resetService,
      EmailService emailService,
      TenantAuthService tenantAuthService,
      TenantsService tenantsService,
      StorageUploadService storageUploadService,
      AppProperties properties) {
    this.authService = authService;
    this.adminUsersService = adminUsersService;
    this.resetService = resetService;
    this.emailService = emailService;
    this.tenantAuthService = tenantAuthService;
    this.tenantsService = tenantsService;
    this.storageUploadService = storageUploadService;
    this.properties = properties;
  }

  @PostMapping("/token")
  public ResponseEntity<AuthService.TokenResult> token(
      @RequestBody Map<String, String> body, HttpServletResponse response) {
    String clientId = body.getOrDefault("clientId", "");
    String clientSecret = body.getOrDefault("clientSecret", "");
    AuthService.TokenResult issued = authService.issueToken(clientId, clientSecret);
    adminUsersService.getOrCreate(clientId, clientSecret);
    setAuthCookies(response, issued.accessToken(), clientId);
    return ResponseEntity.ok(issued);
  }

  @PostMapping("/login")
  public ResponseEntity<?> login(@RequestBody Map<String, String> body, HttpServletResponse response) {
    String username = body.getOrDefault("username", "");
    String password = body.getOrDefault("password", "");
    AdminUser user = null;
    Tenant tenant = null;

    try {
      user = adminUsersService.validateCredentials(username, password);
    } catch (Exception ex) {
      String bootstrapUser = properties.getAuth().getAdminClientId();
      String bootstrapPass = properties.getAuth().getAdminClientSecret();
      if (username.equals(bootstrapUser) && password.equals(bootstrapPass)) {
        user = adminUsersService.getOrCreate(bootstrapUser, bootstrapPass);
      } else {
        try {
          tenant = tenantAuthService.validateCredentials(username, password);
        } catch (Exception ignore) {
          // keep null
        }
      }
    }

    if (tenant == null && user == null) {
      return ResponseEntity.status(401).body(Map.of("message", "Invalid credentials"));
    }

    AuthService.TokenResult issued =
        tenant != null
            ? authService.issueTenantToken(tenant.getId(), tenant.getAuthUsername())
            : authService.issueAdminToken(user.getUsername(), user.getRole());

    String userLabel = tenant != null ? tenant.getAuthUsername() : user.getUsername();
    setAuthCookies(response, issued.accessToken(), userLabel);

    boolean mustChange =
        tenant != null ? tenant.isAuthMustChangePassword() : user.isMustChangePassword();
    return ResponseEntity.ok(
        Map.of(
            "accessToken",
            issued.accessToken(),
            "expiresIn",
            issued.expiresIn(),
            "mustChangePassword",
            mustChange));
  }

  @PostMapping("/forgot-password")
  public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> body) {
    int ttl = Integer.parseInt(System.getenv().getOrDefault("ADMIN_RESET_TOKEN_TTL_MINUTES", "30"));
    AdminPasswordResetService.ResetResult result =
        resetService.createReset(body.getOrDefault("identifier", ""), ttl);
    if (result != null && result.user().getEmail() != null) {
      String frontendUrl = System.getenv().getOrDefault("FRONTEND_BASE_URL", "http://localhost:5173");
      String resetUrl = frontendUrl + "/reset-password?token=" + result.token();
      emailService.sendPasswordReset(result.user().getEmail(), resetUrl);
    }
    return ResponseEntity.ok(Map.of("ok", true));
  }

  @PostMapping("/reset-password")
  public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
    String userId = resetService.consumeReset(body.getOrDefault("token", ""));
    adminUsersService.setPasswordById(userId, body.getOrDefault("password", ""));
    return ResponseEntity.ok(Map.of("ok", true));
  }

  @GetMapping("/session")
  public ResponseEntity<?> session(HttpServletRequest request) {
    AuthContext auth = (AuthContext) request.getAttribute("auth");
    if (auth == null) {
      return ResponseEntity.status(401).body(Map.of("user", null, "role", null));
    }
    if ("tenant".equals(auth.getRole()) && auth.getTenantId() != null) {
      Tenant tenant = tenantsService.getById(auth.getTenantId());
      Map<String, Object> payload = new LinkedHashMap<>();
      payload.put(
          "user",
          tenant != null && tenant.getAuthUsername() != null
              ? tenant.getAuthUsername()
              : auth.getSub());
      payload.put("role", "tenant");
      payload.put("name", tenant != null ? tenant.getName() : null);
      payload.put("email", tenant != null ? tenant.getBillingEmail() : null);
      payload.put("tenantId", auth.getTenantId());
      payload.put("status", tenant != null ? tenant.getStatus() : null);
      payload.put("language", tenant != null ? tenant.getLanguage() : null);
      payload.put("avatarUrl", tenant != null ? tenant.getAvatarUrl() : null);
      payload.put("mustChangePassword", tenant != null && tenant.isAuthMustChangePassword());
      return ResponseEntity.ok(payload);
    }

    AdminUser profile = adminUsersService.getOrCreate(auth.getSub());
    Map<String, Object> payload = new LinkedHashMap<>();
    payload.put("user", profile.getUsername());
    payload.put("role", profile.getRole());
    payload.put("name", profile.getName());
    payload.put("email", profile.getEmail());
    payload.put("status", profile.getStatus());
    payload.put("language", profile.getLanguage());
    payload.put("avatarUrl", profile.getAvatarUrl());
    payload.put("mustChangePassword", profile.isMustChangePassword());
    return ResponseEntity.ok(payload);
  }

  @GetMapping("/profile")
  public ResponseEntity<?> profile(HttpServletRequest request) {
    AuthContext auth = (AuthContext) request.getAttribute("auth");
    if (auth == null) {
      return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
    }
    if ("tenant".equals(auth.getRole()) && auth.getTenantId() != null) {
      Tenant tenant = tenantsService.getById(auth.getTenantId());
      Map<String, Object> payload = new LinkedHashMap<>();
      payload.put("id", tenant != null ? tenant.getId() : null);
      payload.put("username", tenant != null ? tenant.getAuthUsername() : auth.getSub());
      payload.put("name", tenant != null ? tenant.getName() : null);
      payload.put("email", tenant != null ? tenant.getBillingEmail() : null);
      payload.put("role", "tenant");
      payload.put("status", tenant != null ? tenant.getStatus() : null);
      payload.put("language", tenant != null ? tenant.getLanguage() : null);
      payload.put("avatarUrl", tenant != null ? tenant.getAvatarUrl() : null);
      payload.put("mustChangePassword", tenant != null && tenant.isAuthMustChangePassword());
      payload.put("createdAt", tenant != null ? tenant.getCreatedAt() : null);
      payload.put("updatedAt", tenant != null ? tenant.getUpdatedAt() : null);
      return ResponseEntity.ok(payload);
    }
    AdminUser profile = adminUsersService.getOrCreate(auth.getSub());
    Map<String, Object> payload = new LinkedHashMap<>();
    payload.put("id", profile.getId());
    payload.put("username", profile.getUsername());
    payload.put("name", profile.getName());
    payload.put("email", profile.getEmail());
    payload.put("role", profile.getRole());
    payload.put("status", profile.getStatus());
    payload.put("language", profile.getLanguage());
    payload.put("avatarUrl", profile.getAvatarUrl());
    payload.put("mustChangePassword", profile.isMustChangePassword());
    payload.put("createdAt", profile.getCreatedAt());
    payload.put("updatedAt", profile.getUpdatedAt());
    return ResponseEntity.ok(payload);
  }

  @PatchMapping("/profile")
  public ResponseEntity<?> updateProfile(
      HttpServletRequest request, @RequestBody Map<String, String> body) {
    AuthContext auth = (AuthContext) request.getAttribute("auth");
    if (auth == null) {
      return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
    }
    if ("tenant".equals(auth.getRole()) && auth.getTenantId() != null) {
      String name = body.get("name");
      String email = body.get("email");
      String password = body.get("password");
      String language = body.get("language");
      String avatarUrl = body.get("avatarUrl");
      TenantsService.UpdateTenantSelfRequest dto = new TenantsService.UpdateTenantSelfRequest();
      dto.name = name;
      dto.billingEmail = email;
      dto.authPassword = password;
      dto.language = language;
      dto.avatarUrl = avatarUrl;
      tenantsService.updateSelf(auth.getTenantId(), dto);
      return profile(request);
    }
    AdminUsersService.UpdateProfileRequest dto =
        new AdminUsersService.UpdateProfileRequest(
            body.get("name"),
            body.get("email"),
            body.get("password"),
            body.get("language"),
            body.get("avatarUrl"));
    AdminUser updated = adminUsersService.updateProfile(auth.getSub(), dto);
    return ResponseEntity.ok(
        Map.of(
            "id",
            updated.getId(),
            "username",
            updated.getUsername(),
            "name",
            updated.getName(),
            "email",
            updated.getEmail(),
            "role",
            updated.getRole(),
            "status",
            updated.getStatus(),
            "mustChangePassword",
            updated.isMustChangePassword()));
  }

    @PostMapping(value = "/profile/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<?> uploadAvatar(
      HttpServletRequest request, @RequestParam("file") MultipartFile file) {
    AuthContext auth = (AuthContext) request.getAttribute("auth");
    if (auth == null) {
      return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
    }
    if (file == null || file.isEmpty()) {
      return ResponseEntity.badRequest().body(Map.of("message", "Archivo requerido"));
    }
    String contentType = file.getContentType() != null ? file.getContentType() : "";
    if (!contentType.startsWith("image/")) {
      return ResponseEntity.badRequest().body(Map.of("message", "Formato de imagen inválido"));
    }
    long maxBytes = 450 * 1024;
    if (file.getSize() > maxBytes) {
      return ResponseEntity.badRequest().body(Map.of("message", "La imagen supera el límite de 400KB"));
    }
    String tenantId = auth.getTenantId();
    String storageTenant = tenantId != null ? tenantId : auth.getSub();
    var upload = storageUploadService.upload(storageTenant, "profile-avatar", file);
    String avatarUrl = upload != null ? upload.url : null;
    if ("tenant".equals(auth.getRole()) && tenantId != null) {
      TenantsService.UpdateTenantSelfRequest dto = new TenantsService.UpdateTenantSelfRequest();
      dto.avatarUrl = avatarUrl;
      tenantsService.updateSelf(tenantId, dto);
      return profile(request);
    }
    AdminUsersService.UpdateProfileRequest dto =
        new AdminUsersService.UpdateProfileRequest(null, null, null, null, avatarUrl);
    adminUsersService.updateProfile(auth.getSub(), dto);
    return profile(request);
  }

@PostMapping("/logout")
  public ResponseEntity<?> logout(HttpServletResponse response) {
    clearCookie(response, "pm_auth_token");
    clearCookie(response, "pm_auth_user");
    clearCookie(response, "pm_auth_name");
    return ResponseEntity.ok(Map.of("ok", true));
  }

  private void setAuthCookies(HttpServletResponse response, String token, String user) {
    int maxAge = (int) Duration.ofSeconds(properties.getJwt().getTtl()).toSeconds();
    addCookie(response, "pm_auth_token", token, true, maxAge);
    addCookie(response, "pm_auth_user", user, false, maxAge);
  }

  private void clearCookie(HttpServletResponse response, String name) {
    addCookie(response, name, "", false, 0);
  }

  private void addCookie(
      HttpServletResponse response, String name, String value, boolean httpOnly, int maxAge) {
    String sameSite = properties.getCookies().getSameSite();
    if (sameSite == null || sameSite.isBlank()) {
      sameSite = "Lax";
    } else if ("none".equalsIgnoreCase(sameSite)) {
      sameSite = "None";
    } else if ("strict".equalsIgnoreCase(sameSite)) {
      sameSite = "Strict";
    } else {
      sameSite = "Lax";
    }
    boolean secure = properties.getCookies().isSecure() || "None".equalsIgnoreCase(sameSite);
    ResponseCookie cookie =
        ResponseCookie.from(name, value)
            .httpOnly(httpOnly)
            .secure(secure)
            .sameSite(sameSite)
            .path("/")
            .maxAge(maxAge)
            .build();
    response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
  }
}
