package com.neria.presupuestos.service.material;

import com.neria.presupuestos.model.dto.MaterialCreateRequest;
import com.neria.presupuestos.model.dto.MaterialDto;
import com.neria.presupuestos.model.dto.MaterialUpdateRequest;
import com.neria.presupuestos.model.entity.Material;
import com.neria.presupuestos.repository.material.MaterialRepository;
import com.neria.presupuestos.util.TenantResolver;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class MaterialService {

    private final MaterialRepository materialRepository;

    public MaterialService(MaterialRepository materialRepository) {
        this.materialRepository = materialRepository;
    }

    public List<MaterialDto> list(String sectorId) {
        String tenantId = TenantResolver.requireTenantId();
        if (sectorId == null || sectorId.isBlank()) {
            return materialRepository.findByTenantId(tenantId).stream().map(this::toDto).toList();
        }
        return materialRepository.findByTenantIdAndSectorId(tenantId, sectorId).stream().map(this::toDto).toList();
    }

    @Transactional
    public MaterialDto create(MaterialCreateRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Request is required");
        }
        if (request.getName() == null || request.getName().isBlank()) {
            throw new IllegalArgumentException("Name is required");
        }
        if (request.getUnit() == null || request.getUnit().isBlank()) {
            throw new IllegalArgumentException("Unit is required");
        }
        if (request.getSectorId() == null || request.getSectorId().isBlank()) {
            throw new IllegalArgumentException("Sector is required");
        }
        String tenantId = TenantResolver.requireTenantId();
        Material material = new Material();
        material.setTenantId(tenantId);
        material.setSectorId(request.getSectorId());
        material.setName(request.getName().trim());
        material.setUnit(request.getUnit().trim());
        material.setCostPerUnit(request.getCostPerUnit() == null ? BigDecimal.ZERO : request.getCostPerUnit());
        if (request.getActive() != null) {
            material.setActive(request.getActive());
        }
        return toDto(materialRepository.save(material));
    }

    @Transactional
    public MaterialDto update(String id, MaterialUpdateRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Request is required");
        }
        Material material = getOrThrow(id);
        if (request.getName() != null) {
            material.setName(request.getName().trim());
        }
        if (request.getSectorId() != null && !request.getSectorId().isBlank()) {
            material.setSectorId(request.getSectorId());
        }
        if (request.getUnit() != null) {
            material.setUnit(request.getUnit().trim());
        }
        if (request.getCostPerUnit() != null) {
            material.setCostPerUnit(request.getCostPerUnit());
        }
        if (request.getActive() != null) {
            material.setActive(request.getActive());
        }
        return toDto(materialRepository.save(material));
    }

    @Transactional
    public void delete(String id) {
        Material material = getOrThrow(id);
        materialRepository.delete(material);
    }

    private Material getOrThrow(String id) {
        String tenantId = TenantResolver.requireTenantId();
        return materialRepository.findById(id)
                .filter(material -> tenantId.equals(material.getTenantId()))
                .orElseThrow(() -> new IllegalArgumentException("Material not found"));
    }

    private MaterialDto toDto(Material material) {
        MaterialDto dto = new MaterialDto();
        dto.setId(material.getId());
        dto.setTenantId(material.getTenantId());
        dto.setSectorId(material.getSectorId());
        dto.setName(material.getName());
        dto.setUnit(material.getUnit());
        dto.setCostPerUnit(material.getCostPerUnit());
        dto.setActive(material.isActive());
        dto.setCreatedAt(material.getCreatedAt());
        return dto;
    }
}
