package com.neria.presupuestos.service.ai;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.neria.presupuestos.model.dto.AiProfileCreateRequest;
import com.neria.presupuestos.model.dto.AiProfileDto;
import com.neria.presupuestos.model.dto.AiProfileUpdateRequest;
import com.neria.presupuestos.model.entity.AiProfile;
import com.neria.presupuestos.model.entity.Product;
import com.neria.presupuestos.model.entity.Sector;
import com.neria.presupuestos.repository.ai.AiProfileRepository;
import com.neria.presupuestos.repository.product.ProductRepository;
import com.neria.presupuestos.repository.sector.SectorRepository;
import com.neria.presupuestos.util.TenantResolver;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;

@Service
public class AiProfileService {

    private final AiProfileRepository profileRepository;
    private final SectorRepository sectorRepository;
    private final ProductRepository productRepository;
    private final ObjectMapper objectMapper;

    public AiProfileService(AiProfileRepository profileRepository,
                            SectorRepository sectorRepository,
                            ProductRepository productRepository,
                            ObjectMapper objectMapper) {
        this.profileRepository = profileRepository;
        this.sectorRepository = sectorRepository;
        this.productRepository = productRepository;
        this.objectMapper = objectMapper;
    }

    public List<AiProfileDto> list() {
        String tenantId = TenantResolver.requireTenantId();
        return profileRepository.findByTenantId(tenantId).stream().map(this::toDto).toList();
    }

    public AiProfileDto resolve(String sectorId, String productId) {
        String tenantId = TenantResolver.requireTenantId();
        AiProfile profile = null;
        if (productId != null && !productId.isBlank()) {
            profile = profileRepository.findFirstByTenantIdAndProductIdAndActiveTrue(tenantId, productId)
                    .orElse(null);
        }
        if (profile == null && sectorId != null && !sectorId.isBlank()) {
            profile = profileRepository.findFirstByTenantIdAndSectorIdAndProductIdIsNullAndActiveTrue(tenantId, sectorId)
                    .orElse(null);
        }
        return profile == null ? null : toDto(profile);
    }

    @Transactional
    public AiProfileDto create(AiProfileCreateRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Request is required");
        }
        String tenantId = TenantResolver.requireTenantId();
        String sectorId = request.getSectorId();
        String productId = request.getProductId();

        if ((sectorId == null || sectorId.isBlank()) && (productId == null || productId.isBlank())) {
            throw new IllegalArgumentException("Sector or product is required");
        }

        Product product = null;
        if (productId != null && !productId.isBlank()) {
            product = validateProduct(tenantId, productId);
            if (sectorId == null || sectorId.isBlank()) {
                sectorId = product.getSectorId();
            }
        }
        if (sectorId != null && !sectorId.isBlank()) {
            validateSector(tenantId, sectorId);
            if (product != null && product.getSectorId() != null && !product.getSectorId().equals(sectorId)) {
                throw new IllegalArgumentException("Product does not belong to sector");
            }
        }

        if (productId != null && !productId.isBlank()) {
            profileRepository.findFirstByTenantIdAndProductId(tenantId, productId)
                    .ifPresent(existing -> {
                        throw new IllegalArgumentException("Profile already exists for this product");
                    });
        } else if (sectorId != null && !sectorId.isBlank()) {
            profileRepository.findFirstByTenantIdAndSectorIdAndProductIdIsNull(tenantId, sectorId)
                    .ifPresent(existing -> {
                        throw new IllegalArgumentException("Profile already exists for this sector");
                    });
        }

        AiProfile profile = new AiProfile();
        profile.setTenantId(tenantId);
        profile.setSectorId(sectorId);
        profile.setProductId(productId);
        profile.setRequiredOptions(serializeRequiredOptions(request.getRequiredOptionNames()));
        profile.setPromptInstructions(request.getPromptInstructions());
        String quantityLabel = request.getQuantityLabel();
        if (quantityLabel == null || quantityLabel.isBlank()) {
            quantityLabel = resolveDefaultQuantityLabel(tenantId, sectorId, productId);
        }
        profile.setQuantityLabel(quantityLabel);
        if (request.getActive() != null) {
            profile.setActive(request.getActive());
        }
        return toDto(profileRepository.save(profile));
    }

    @Transactional
    public AiProfileDto update(String id, AiProfileUpdateRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Request is required");
        }
        AiProfile profile = getOrThrow(id);
        String tenantId = profile.getTenantId();

        if (request.getSectorId() != null) {
            if (!request.getSectorId().isBlank()) {
                validateSector(tenantId, request.getSectorId());
                profile.setSectorId(request.getSectorId());
            } else {
                profile.setSectorId(null);
            }
        }
        if (request.getProductId() != null) {
            if (!request.getProductId().isBlank()) {
                Product product = validateProduct(tenantId, request.getProductId());
                if (profile.getSectorId() != null && product.getSectorId() != null
                        && !product.getSectorId().equals(profile.getSectorId())) {
                    throw new IllegalArgumentException("Product does not belong to sector");
                }
                profile.setProductId(request.getProductId());
            } else {
                profile.setProductId(null);
            }
        }
        if (request.getRequiredOptionNames() != null) {
            profile.setRequiredOptions(serializeRequiredOptions(request.getRequiredOptionNames()));
        }
        if (request.getPromptInstructions() != null) {
            profile.setPromptInstructions(request.getPromptInstructions());
        }
        if (request.getQuantityLabel() != null) {
            String label = request.getQuantityLabel().trim();
            profile.setQuantityLabel(label.isBlank() ? null : label);
        }
        if (request.getActive() != null) {
            profile.setActive(request.getActive());
        }

        return toDto(profileRepository.save(profile));
    }

    @Transactional
    public void delete(String id) {
        AiProfile profile = getOrThrow(id);
        profileRepository.delete(profile);
    }

    private AiProfile getOrThrow(String id) {
        String tenantId = TenantResolver.requireTenantId();
        return profileRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new IllegalArgumentException("Profile not found"));
    }

    private Sector validateSector(String tenantId, String sectorId) {
        return sectorRepository.findById(sectorId)
                .filter(sector -> tenantId.equals(sector.getTenantId()))
                .orElseThrow(() -> new IllegalArgumentException("Sector not found"));
    }

    private Product validateProduct(String tenantId, String productId) {
        return productRepository.findById(productId)
                .filter(product -> tenantId.equals(product.getTenantId()))
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));
    }

    private AiProfileDto toDto(AiProfile profile) {
        AiProfileDto dto = new AiProfileDto();
        dto.setId(profile.getId());
        dto.setTenantId(profile.getTenantId());
        dto.setSectorId(profile.getSectorId());
        if (profile.getSectorId() != null) {
            sectorRepository.findById(profile.getSectorId())
                    .filter(sector -> profile.getTenantId().equals(sector.getTenantId()))
                    .ifPresent(sector -> dto.setSectorName(sector.getName()));
        }
        dto.setProductId(profile.getProductId());
        if (profile.getProductId() != null) {
            productRepository.findById(profile.getProductId())
                    .filter(product -> profile.getTenantId().equals(product.getTenantId()))
                    .ifPresent(product -> dto.setProductName(product.getName()));
        }
        dto.setRequiredOptionNames(parseRequiredOptions(profile.getRequiredOptions()));
        dto.setPromptInstructions(profile.getPromptInstructions());
        dto.setQuantityLabel(profile.getQuantityLabel());
        dto.setActive(profile.isActive());
        dto.setCreatedAt(profile.getCreatedAt());
        dto.setUpdatedAt(profile.getUpdatedAt());
        return dto;
    }

    private List<String> parseRequiredOptions(String payload) {
        if (payload == null || payload.isBlank()) {
            return Collections.emptyList();
        }
        try {
            return objectMapper.readValue(payload, new TypeReference<List<String>>() {});
        } catch (JsonProcessingException ex) {
            return Collections.emptyList();
        }
    }

    private String serializeRequiredOptions(List<String> options) {
        if (options == null || options.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(options);
        } catch (JsonProcessingException ex) {
            throw new IllegalArgumentException("Invalid required options format");
        }
    }

    private String resolveDefaultQuantityLabel(String tenantId, String sectorId, String productId) {
        String sectorName = "";
        String productName = "";
        if (sectorId != null && !sectorId.isBlank()) {
            sectorName = sectorRepository.findById(sectorId)
                    .filter(sector -> tenantId.equals(sector.getTenantId()))
                    .map(Sector::getName)
                    .orElse("");
        }
        if (productId != null && !productId.isBlank()) {
            productName = productRepository.findById(productId)
                    .filter(product -> tenantId.equals(product.getTenantId()))
                    .map(Product::getName)
                    .orElse("");
        }
        String sectorNormalized = sectorName.toLowerCase();
        String productNormalized = productName.toLowerCase();
        if (sectorNormalized.contains("reformas") || sectorNormalized.contains("pintura")) {
            return "m²";
        }
        if (sectorNormalized.contains("servicios") || sectorNormalized.contains("domest")
                || productNormalized.contains("limpieza") || productNormalized.contains("mantenimiento")) {
            return "horas";
        }
        if (sectorNormalized.contains("taller")
                || productNormalized.contains("reparacion")
                || productNormalized.contains("reparación")) {
            return "servicios";
        }
        if (sectorNormalized.contains("imprenta")) {
            return "unidades";
        }
        return null;
    }
}
