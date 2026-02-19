package com.neria.manager.preevaluation;

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
@RequestMapping("/tenants/{tenantId}/services/{serviceCode}/pre-evaluations")
public class PreEvaluationsController {
  private final PreEvaluationsService preEvaluationsService;

  public PreEvaluationsController(PreEvaluationsService preEvaluationsService) {
    this.preEvaluationsService = preEvaluationsService;
  }

  @GetMapping
  public List<PreEvaluationsService.PreEvaluationSummary> list(
      HttpServletRequest request,
      @PathVariable String tenantId,
      @PathVariable String serviceCode) {
    AuthContext auth = AuthUtils.requireAuth(request);
    String resolvedTenantId = AuthUtils.resolveTenantId(auth, request);
    requireAccess(auth, resolvedTenantId, tenantId, serviceCode);
    return preEvaluationsService.listPreEvaluations(tenantId, serviceCode);
  }

  @PostMapping
  public PreEvaluationsService.PreEvaluationDetail create(
      HttpServletRequest request,
      @PathVariable String tenantId,
      @PathVariable String serviceCode,
      @RequestBody PreEvaluationsService.PreEvaluationRequest payload) {
    AuthContext auth = AuthUtils.requireAuth(request);
    String resolvedTenantId = AuthUtils.resolveTenantId(auth, request);
    requireAccess(auth, resolvedTenantId, tenantId, serviceCode);
    return preEvaluationsService.createPreEvaluation(tenantId, serviceCode, payload);
  }

  @GetMapping("/{evaluationId}")
  public PreEvaluationsService.PreEvaluationDetail detail(
      HttpServletRequest request,
      @PathVariable String tenantId,
      @PathVariable String serviceCode,
      @PathVariable String evaluationId) {
    AuthContext auth = AuthUtils.requireAuth(request);
    String resolvedTenantId = AuthUtils.resolveTenantId(auth, request);
    requireAccess(auth, resolvedTenantId, tenantId, serviceCode);
    return preEvaluationsService.getPreEvaluation(tenantId, serviceCode, evaluationId);
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
