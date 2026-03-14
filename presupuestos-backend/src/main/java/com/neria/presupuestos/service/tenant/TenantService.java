package com.neria.presupuestos.service.tenant;

import com.neria.presupuestos.model.dto.TenantDto;
import com.neria.presupuestos.model.dto.TenantUpdateRequest;
import com.neria.presupuestos.model.entity.Tenant;
import com.neria.presupuestos.repository.tenant.TenantRepository;
import com.neria.presupuestos.util.TenantResolver;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TenantService {

    private final TenantRepository tenantRepository;

    public TenantService(TenantRepository tenantRepository) {
        this.tenantRepository = tenantRepository;
    }

    public TenantDto getTenant() {
        String tenantId = TenantResolver.requireTenantId();
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Tenant not found"));
        return toDto(tenant);
    }

    @Transactional
    public TenantDto updateTenant(TenantUpdateRequest request) {
        String tenantId = TenantResolver.requireTenantId();
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Tenant not found"));
        if (request.getName() != null) {
            tenant.setName(request.getName());
        }
        if (request.getSector() != null) {
            tenant.setSector(request.getSector());
        }
        if (request.getCompanyEmail() != null) {
            tenant.setCompanyEmail(request.getCompanyEmail());
        }
        if (request.getCompanyPhone() != null) {
            tenant.setCompanyPhone(request.getCompanyPhone());
        }
        if (request.getCompanyAddress() != null) {
            tenant.setCompanyAddress(request.getCompanyAddress());
        }
        if (request.getLogoUrl() != null) {
            tenant.setLogoUrl(request.getLogoUrl());
        }
        if (request.getActive() != null) {
            tenant.setActive(request.getActive());
        }
        return toDto(tenantRepository.save(tenant));
    }

    private TenantDto toDto(Tenant tenant) {
        TenantDto dto = new TenantDto();
        dto.setId(tenant.getId());
        dto.setName(tenant.getName());
        dto.setSector(tenant.getSector());
        dto.setCompanyEmail(tenant.getCompanyEmail());
        dto.setCompanyPhone(tenant.getCompanyPhone());
        dto.setCompanyAddress(tenant.getCompanyAddress());
        dto.setLogoUrl(tenant.getLogoUrl());
        dto.setActive(tenant.isActive());
        dto.setCreatedAt(tenant.getCreatedAt());
        return dto;
    }
}
