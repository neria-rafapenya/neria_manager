package com.neria.presupuestos.service.formula;

import com.neria.presupuestos.model.dto.FormulaCreateRequest;
import com.neria.presupuestos.model.dto.FormulaDto;
import com.neria.presupuestos.model.dto.FormulaUpdateRequest;
import com.neria.presupuestos.model.entity.Formula;
import com.neria.presupuestos.repository.sector.SectorRepository;
import com.neria.presupuestos.repository.formula.FormulaRepository;
import com.neria.presupuestos.repository.product.ProductRepository;
import com.neria.presupuestos.util.TenantResolver;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class FormulaService {

    private final FormulaRepository formulaRepository;
    private final ProductRepository productRepository;
    private final SectorRepository sectorRepository;

    public FormulaService(FormulaRepository formulaRepository,
                          ProductRepository productRepository,
                          SectorRepository sectorRepository) {
        this.formulaRepository = formulaRepository;
        this.productRepository = productRepository;
        this.sectorRepository = sectorRepository;
    }

    public List<FormulaDto> list(boolean activeOnly) {
        String tenantId = TenantResolver.requireTenantId();
        List<Formula> formulas = activeOnly
                ? formulaRepository.findByTenantIdAndActiveTrue(tenantId)
                : formulaRepository.findByTenantId(tenantId);
        return formulas.stream().map(this::toDto).toList();
    }

    @Transactional
    public FormulaDto create(FormulaCreateRequest request) {
        if (request == null || request.getName() == null || request.getName().isBlank()) {
            throw new IllegalArgumentException("Name is required");
        }
        String tenantId = TenantResolver.requireTenantId();
        if (request.getSectorId() == null || request.getSectorId().isBlank()) {
            throw new IllegalArgumentException("Sector is required");
        }
        validateSector(tenantId, request.getSectorId());
        if (request.getProductId() != null && !request.getProductId().isBlank()) {
            validateProduct(tenantId, request.getProductId(), request.getSectorId());
        }
        formulaRepository.findByTenantIdAndNameIgnoreCase(tenantId, request.getName())
                .ifPresent(existing -> {
                    throw new IllegalArgumentException("Formula already exists");
                });
        Formula formula = new Formula();
        formula.setTenantId(tenantId);
        formula.setSectorId(request.getSectorId());
        formula.setProductId(request.getProductId());
        formula.setName(request.getName().trim());
        formula.setDescription(request.getDescription());
        formula.setBasePrice(request.getBasePrice());
        formula.setUnitPrice(request.getUnitPrice());
        if (request.getActive() != null) {
            formula.setActive(request.getActive());
        }
        return toDto(formulaRepository.save(formula));
    }

    @Transactional
    public FormulaDto update(String id, FormulaUpdateRequest request) {
        Formula formula = getOrThrow(id);
        if (request.getName() != null && !request.getName().isBlank()) {
            String nextName = request.getName().trim();
            formulaRepository.findByTenantIdAndNameIgnoreCase(formula.getTenantId(), nextName)
                    .filter(existing -> !existing.getId().equals(formula.getId()))
                    .ifPresent(existing -> {
                        throw new IllegalArgumentException("Formula already exists");
                    });
            formula.setName(nextName);
        }
        if (request.getSectorId() != null && !request.getSectorId().isBlank()) {
            validateSector(formula.getTenantId(), request.getSectorId());
            formula.setSectorId(request.getSectorId());
        }
        if (request.getProductId() != null) {
            if (!request.getProductId().isBlank()) {
                validateProduct(formula.getTenantId(), request.getProductId(),
                        request.getSectorId() != null ? request.getSectorId() : formula.getSectorId());
                formula.setProductId(request.getProductId());
            } else {
                formula.setProductId(null);
            }
        }
        if (request.getDescription() != null) {
            formula.setDescription(request.getDescription());
        }
        if (request.getBasePrice() != null) {
            formula.setBasePrice(request.getBasePrice());
        }
        if (request.getUnitPrice() != null) {
            formula.setUnitPrice(request.getUnitPrice());
        }
        if (request.getActive() != null) {
            formula.setActive(request.getActive());
        }
        return toDto(formulaRepository.save(formula));
    }

    @Transactional
    public void delete(String id) {
        Formula formula = getOrThrow(id);
        if (productRepository.existsByTenantIdAndFormulaId(formula.getTenantId(), formula.getId())) {
            throw new IllegalArgumentException("Formula is assigned to products");
        }
        formulaRepository.delete(formula);
    }

    private Formula getOrThrow(String id) {
        String tenantId = TenantResolver.requireTenantId();
        Formula formula = formulaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Formula not found"));
        if (!tenantId.equals(formula.getTenantId())) {
            throw new IllegalArgumentException("Formula not found");
        }
        return formula;
    }

    private FormulaDto toDto(Formula formula) {
        FormulaDto dto = new FormulaDto();
        dto.setId(formula.getId());
        dto.setTenantId(formula.getTenantId());
        dto.setSectorId(formula.getSectorId());
        if (formula.getSectorId() != null) {
            sectorRepository.findById(formula.getSectorId())
                    .ifPresent(sector -> dto.setSectorName(sector.getName()));
        }
        dto.setProductId(formula.getProductId());
        if (formula.getProductId() != null) {
            productRepository.findById(formula.getProductId())
                    .filter(product -> formula.getTenantId().equals(product.getTenantId()))
                    .ifPresent(product -> dto.setProductName(product.getName()));
        }
        dto.setName(formula.getName());
        dto.setDescription(formula.getDescription());
        dto.setBasePrice(formula.getBasePrice());
        dto.setUnitPrice(formula.getUnitPrice());
        dto.setActive(formula.isActive());
        dto.setCreatedAt(formula.getCreatedAt());
        return dto;
    }

    private void validateSector(String tenantId, String sectorId) {
        sectorRepository.findById(sectorId)
                .filter(sector -> tenantId.equals(sector.getTenantId()))
                .orElseThrow(() -> new IllegalArgumentException("Sector not found"));
    }

    private void validateProduct(String tenantId, String productId, String sectorId) {
        productRepository.findById(productId)
                .filter(product -> tenantId.equals(product.getTenantId()))
                .filter(product -> sectorId == null || sectorId.isBlank()
                        || sectorId.equals(product.getSectorId()))
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));
    }
}
