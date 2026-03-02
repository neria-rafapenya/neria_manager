package com.neria.manager.taxassistant;

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
@RequestMapping("/tenants/{tenantId}/services/{serviceCode}/tax-assistant")
public class TaxAssistantController {
  private final TaxAssistantService taxAssistantService;

  public TaxAssistantController(TaxAssistantService taxAssistantService) {
    this.taxAssistantService = taxAssistantService;
  }

  @GetMapping
  public List<TaxAssistantService.TaxAssistantSummary> list(
      HttpServletRequest request,
      @PathVariable String tenantId,
      @PathVariable String serviceCode) {
    AuthContext auth = AuthUtils.requireAuth(request);
    String resolvedTenantId = AuthUtils.resolveTenantId(auth, request);
    requireAccess(auth, resolvedTenantId, tenantId, serviceCode);
    return taxAssistantService.listCases(tenantId, serviceCode);
  }

  @PostMapping
  public TaxAssistantService.TaxAssistantDetail create(
      HttpServletRequest request,
      @PathVariable String tenantId,
      @PathVariable String serviceCode,
      @RequestBody TaxAssistantService.TaxAssistantRequest payload) {
    AuthContext auth = AuthUtils.requireAuth(request);
    String resolvedTenantId = AuthUtils.resolveTenantId(auth, request);
    requireAccess(auth, resolvedTenantId, tenantId, serviceCode);
    return taxAssistantService.createCase(tenantId, serviceCode, payload);
  }

  @GetMapping("/{caseId}")
  public TaxAssistantService.TaxAssistantDetail detail(
      HttpServletRequest request,
      @PathVariable String tenantId,
      @PathVariable String serviceCode,
      @PathVariable String caseId) {
    AuthContext auth = AuthUtils.requireAuth(request);
    String resolvedTenantId = AuthUtils.resolveTenantId(auth, request);
    requireAccess(auth, resolvedTenantId, tenantId, serviceCode);
    return taxAssistantService.getCase(tenantId, serviceCode, caseId);
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
