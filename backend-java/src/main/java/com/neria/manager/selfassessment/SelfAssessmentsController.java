package com.neria.manager.selfassessment;

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
@RequestMapping("/tenants/{tenantId}/services/{serviceCode}/self-assessments")
public class SelfAssessmentsController {
  private final SelfAssessmentsService assessmentsService;

  public SelfAssessmentsController(SelfAssessmentsService assessmentsService) {
    this.assessmentsService = assessmentsService;
  }

  @GetMapping
  public List<SelfAssessmentsService.SelfAssessmentSummary> list(
      HttpServletRequest request,
      @PathVariable String tenantId,
      @PathVariable String serviceCode) {
    AuthContext auth = AuthUtils.requireAuth(request);
    String resolvedTenantId = AuthUtils.resolveTenantId(auth, request);
    requireAccess(auth, resolvedTenantId, tenantId, serviceCode);
    return assessmentsService.listAssessments(tenantId, serviceCode);
  }

  @PostMapping
  public SelfAssessmentsService.SelfAssessmentDetail create(
      HttpServletRequest request,
      @PathVariable String tenantId,
      @PathVariable String serviceCode,
      @RequestBody SelfAssessmentsService.SelfAssessmentRequest payload) {
    AuthContext auth = AuthUtils.requireAuth(request);
    String resolvedTenantId = AuthUtils.resolveTenantId(auth, request);
    requireAccess(auth, resolvedTenantId, tenantId, serviceCode);
    return assessmentsService.createAssessment(tenantId, serviceCode, payload);
  }

  @GetMapping("/{assessmentId}")
  public SelfAssessmentsService.SelfAssessmentDetail detail(
      HttpServletRequest request,
      @PathVariable String tenantId,
      @PathVariable String serviceCode,
      @PathVariable String assessmentId) {
    AuthContext auth = AuthUtils.requireAuth(request);
    String resolvedTenantId = AuthUtils.resolveTenantId(auth, request);
    requireAccess(auth, resolvedTenantId, tenantId, serviceCode);
    return assessmentsService.getAssessment(tenantId, serviceCode, assessmentId);
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
