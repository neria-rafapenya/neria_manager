package com.neria.manager.emailautomation;

import com.neria.manager.common.security.AuthContext;
import com.neria.manager.common.security.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/tenants/{tenantId}/services/{serviceCode}/email")
public class TenantServiceEmailController {
  private final TenantServiceEmailService emailService;

  public TenantServiceEmailController(TenantServiceEmailService emailService) {
    this.emailService = emailService;
  }

  private void requireScope(HttpServletRequest request, String tenantId) {
    AuthContext auth = AuthUtils.requireAuth(request);
    AuthUtils.requireRole(auth, "admin", "tenant");
    AuthUtils.requireTenantScope(auth, tenantId);
  }

  @GetMapping("/accounts")
  public Object listAccounts(
      HttpServletRequest request,
      @PathVariable String tenantId,
      @PathVariable String serviceCode) {
    requireScope(request, tenantId);
    return emailService.listAccounts(tenantId, serviceCode);
  }

  @PostMapping("/accounts")
  public Object createAccount(
      HttpServletRequest request,
      @PathVariable String tenantId,
      @PathVariable String serviceCode,
      @RequestBody TenantServiceEmailService.EmailAccountRequest payload) {
    requireScope(request, tenantId);
    return emailService.createAccount(tenantId, serviceCode, payload);
  }

  @PatchMapping("/accounts/{accountId}")
  public Object updateAccount(
      HttpServletRequest request,
      @PathVariable String tenantId,
      @PathVariable String serviceCode,
      @PathVariable String accountId,
      @RequestBody TenantServiceEmailService.EmailAccountRequest payload) {
    requireScope(request, tenantId);
    return emailService.updateAccount(tenantId, serviceCode, accountId, payload);
  }

  @DeleteMapping("/accounts/{accountId}")
  public Object deleteAccount(
      HttpServletRequest request,
      @PathVariable String tenantId,
      @PathVariable String serviceCode,
      @PathVariable String accountId) {
    requireScope(request, tenantId);
    emailService.deleteAccount(tenantId, serviceCode, accountId);
    return java.util.Map.of("deleted", true);
  }

  @GetMapping("/messages")
  public Object listMessages(
      HttpServletRequest request,
      @PathVariable String tenantId,
      @PathVariable String serviceCode,
      @RequestParam(name = "limit", required = false, defaultValue = "50") int limit) {
    requireScope(request, tenantId);
    return emailService.listMessages(tenantId, serviceCode, limit);
  }

  @PostMapping("/sync")
  public Object syncNow(
      HttpServletRequest request,
      @PathVariable String tenantId,
      @PathVariable String serviceCode) {
    requireScope(request, tenantId);
    emailService.syncTenantService(tenantId, serviceCode);
    return java.util.Map.of("queued", true);
  }
}
