package com.neria.manager.clinicflow.controllers;

import com.neria.manager.clinicflow.services.ClinicUserService;
import com.neria.manager.common.security.AuthContext;
import com.neria.manager.common.security.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/tenants/{tenantId}/services/{serviceCode}/clinicflow/users")
public class ClinicFlowAdminController {
  private final ClinicUserService clinicUserService;

  public ClinicFlowAdminController(ClinicUserService clinicUserService) {
    this.clinicUserService = clinicUserService;
  }

  @GetMapping
  public Object list(
      HttpServletRequest request,
      @PathVariable String tenantId,
      @PathVariable String serviceCode) {
    requireTenantScope(request, tenantId, serviceCode);
    return clinicUserService.list(tenantId);
  }

  @PostMapping
  public Object create(
      HttpServletRequest request,
      @PathVariable String tenantId,
      @PathVariable String serviceCode,
      @RequestBody ClinicUserService.CreateClinicUserRequest dto) {
    requireTenantScope(request, tenantId, serviceCode);
    return clinicUserService.create(tenantId, dto);
  }

  @PatchMapping("/{id}")
  public Object update(
      HttpServletRequest request,
      @PathVariable String tenantId,
      @PathVariable String serviceCode,
      @PathVariable String id,
      @RequestBody ClinicUserService.UpdateClinicUserRequest dto) {
    requireTenantScope(request, tenantId, serviceCode);
    return clinicUserService.update(tenantId, id, dto);
  }

  @PostMapping("/{id}/reset-password")
  public Object resetPassword(
      HttpServletRequest request,
      @PathVariable String tenantId,
      @PathVariable String serviceCode,
      @PathVariable String id,
      @RequestBody ClinicUserService.ResetPasswordRequest dto) {
    requireTenantScope(request, tenantId, serviceCode);
    return clinicUserService.resetPassword(tenantId, id, dto);
  }

  @DeleteMapping("/{id}")
  public Object delete(
      HttpServletRequest request,
      @PathVariable String tenantId,
      @PathVariable String serviceCode,
      @PathVariable String id) {
    requireTenantScope(request, tenantId, serviceCode);
    clinicUserService.delete(tenantId, id);
    return null;
  }

  private void requireTenantScope(
      HttpServletRequest request, String tenantId, String serviceCode) {
    if (serviceCode == null || !"clinicflow".equalsIgnoreCase(serviceCode.trim())) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Service not supported");
    }
    AuthContext auth = AuthUtils.requireAuth(request);
    AuthUtils.requireRole(auth, "admin", "tenant");
    AuthUtils.requireTenantScope(auth, tenantId);
  }
}
