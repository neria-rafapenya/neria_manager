package com.neria.manager.storage;

import com.neria.manager.common.security.AuthContext;
import com.neria.manager.common.security.AuthUtils;
import com.neria.manager.tenantservices.TenantServicesService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/tenants/{tenantId}/services/{serviceCode}/storage")
public class TenantServiceStorageController {
  private final TenantServiceStorageService storageService;
  private final TenantServicesService tenantServicesService;

  public TenantServiceStorageController(
      TenantServiceStorageService storageService,
      TenantServicesService tenantServicesService) {
    this.storageService = storageService;
    this.tenantServicesService = tenantServicesService;
  }

  private void requireScope(HttpServletRequest request, String tenantId) {
    AuthContext auth = AuthUtils.requireAuth(request);
    AuthUtils.requireRole(auth, "admin", "tenant");
    AuthUtils.requireTenantScope(auth, tenantId);
  }

  @GetMapping
  public Object get(
      HttpServletRequest request,
      @PathVariable String tenantId,
      @PathVariable String serviceCode) {
    requireScope(request, tenantId);
    tenantServicesService.requireFileStorageEnabled(tenantId, serviceCode);
    return storageService.get(tenantId, serviceCode);
  }

  @PutMapping
  public Object upsert(
      HttpServletRequest request,
      @PathVariable String tenantId,
      @PathVariable String serviceCode,
      @RequestBody TenantServiceStorageService.StorageRequest dto) {
    requireScope(request, tenantId);
    tenantServicesService.requireFileStorageEnabled(tenantId, serviceCode);
    return storageService.upsert(tenantId, serviceCode, dto);
  }

  @DeleteMapping
  public Object delete(
      HttpServletRequest request,
      @PathVariable String tenantId,
      @PathVariable String serviceCode) {
    requireScope(request, tenantId);
    tenantServicesService.requireFileStorageEnabled(tenantId, serviceCode);
    storageService.delete(tenantId, serviceCode);
    return java.util.Map.of("deleted", true);
  }
}
