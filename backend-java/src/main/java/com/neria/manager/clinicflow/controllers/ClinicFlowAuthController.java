package com.neria.manager.clinicflow.controllers;

import com.neria.manager.clinicflow.services.ClinicUserService;
import com.neria.manager.common.security.AuthContext;
import com.neria.manager.common.security.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/clinicflow/auth")
public class ClinicFlowAuthController {
  private final ClinicUserService clinicUserService;

  public ClinicFlowAuthController(ClinicUserService clinicUserService) {
    this.clinicUserService = clinicUserService;
  }

  @PostMapping("/login")
  public Object login(
      HttpServletRequest request, @RequestBody ClinicUserService.LoginRequest dto) {
    AuthContext auth = AuthUtils.requireAuth(request);
    String tenantId = AuthUtils.resolveTenantId(auth, request);
    String requested = dto != null && dto.serviceCode != null ? dto.serviceCode.trim() : "";
    if (!requested.isBlank() && !"clinicflow".equalsIgnoreCase(requested)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid service code");
    }
    if (auth.getServiceCode() != null && !"clinicflow".equalsIgnoreCase(auth.getServiceCode())) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Service mismatch");
    }
    return clinicUserService.login(tenantId, dto);
  }

  @GetMapping("/me")
  public Object me(HttpServletRequest request) {
    AuthContext auth = AuthUtils.requireAuth(request);
    AuthUtils.requireRole(auth, "clinicflow");
    if (auth.getTenantId() == null || auth.getTenantId().isBlank()) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing tenant");
    }
    return clinicUserService.getById(auth.getTenantId(), auth.getSub());
  }
}
