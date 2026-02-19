package com.neria.manager.operationsupport;

import com.neria.manager.common.security.AuthContext;
import com.neria.manager.common.security.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/tenants/{tenantId}/services/{serviceCode}/operational-support")
public class OperationalSupportController {
  private final OperationalSupportService supportService;

  public OperationalSupportController(OperationalSupportService supportService) {
    this.supportService = supportService;
  }

  @GetMapping
  public List<OperationalSupportService.OperationalSupportSummary> list(
      HttpServletRequest request,
      @PathVariable String tenantId,
      @PathVariable String serviceCode) {
    AuthContext auth = AuthUtils.requireAuth(request);
    String resolvedTenantId = AuthUtils.resolveTenantId(auth, request);
    requireAccess(auth, resolvedTenantId, tenantId, serviceCode);
    return supportService.listEntries(tenantId, serviceCode);
  }

  @PostMapping
  public OperationalSupportService.OperationalSupportDetail create(
      HttpServletRequest request,
      @PathVariable String tenantId,
      @PathVariable String serviceCode,
      @RequestBody OperationalSupportService.OperationalSupportRequest payload) {
    AuthContext auth = AuthUtils.requireAuth(request);
    String resolvedTenantId = AuthUtils.resolveTenantId(auth, request);
    requireAccess(auth, resolvedTenantId, tenantId, serviceCode);
    return supportService.createEntry(tenantId, serviceCode, payload);
  }

  @GetMapping("/{entryId}")
  public OperationalSupportService.OperationalSupportDetail detail(
      HttpServletRequest request,
      @PathVariable String tenantId,
      @PathVariable String serviceCode,
      @PathVariable String entryId) {
    AuthContext auth = AuthUtils.requireAuth(request);
    String resolvedTenantId = AuthUtils.resolveTenantId(auth, request);
    requireAccess(auth, resolvedTenantId, tenantId, serviceCode);
    return supportService.getEntry(tenantId, serviceCode, entryId);
  }

  private void requireAccess(
      AuthContext auth, String resolvedTenantId, String tenantId, String serviceCode) {
    if (!tenantId.equals(resolvedTenantId)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Tenant scope mismatch");
    }
    if (auth.getType() != null && "serviceApiKey".equals(auth.getType())) {
      String normalized = serviceCode != null ? serviceCode.trim().toLowerCase(Locale.ROOT) : "";
      if (auth.getServiceCode() != null && !auth.getServiceCode().equals(normalized)) {
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Service key mismatch");
      }
      return;
    }
    AuthUtils.requireTenantScope(auth, tenantId);
  }
}
