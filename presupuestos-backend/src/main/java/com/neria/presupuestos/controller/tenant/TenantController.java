package com.neria.presupuestos.controller.tenant;

import com.neria.presupuestos.model.dto.TenantDto;
import com.neria.presupuestos.model.dto.TenantUpdateRequest;
import com.neria.presupuestos.service.tenant.TenantService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/tenant")
public class TenantController {

    private final TenantService tenantService;

    public TenantController(TenantService tenantService) {
        this.tenantService = tenantService;
    }

    @GetMapping
    public ResponseEntity<TenantDto> getTenant() {
        return ResponseEntity.ok(tenantService.getTenant());
    }

    @PutMapping("/settings")
    public ResponseEntity<TenantDto> updateTenant(@RequestBody TenantUpdateRequest request) {
        return ResponseEntity.ok(tenantService.updateTenant(request));
    }
}
