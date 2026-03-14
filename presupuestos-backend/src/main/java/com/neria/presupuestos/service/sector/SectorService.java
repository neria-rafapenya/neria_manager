package com.neria.presupuestos.service.sector;

import com.neria.presupuestos.model.dto.SectorConnectionTestResponse;
import com.neria.presupuestos.model.dto.SectorCreateRequest;
import com.neria.presupuestos.model.dto.SectorDto;
import com.neria.presupuestos.model.dto.SectorUpdateRequest;
import com.neria.presupuestos.model.entity.Sector;
import com.neria.presupuestos.model.entity.SectorCatalogType;
import com.neria.presupuestos.repository.product.ProductRepository;
import com.neria.presupuestos.repository.sector.SectorRepository;
import com.neria.presupuestos.util.TenantResolver;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;

@Service
public class SectorService {

    private final SectorRepository sectorRepository;
    private final ProductRepository productRepository;
    private final HttpClient httpClient = HttpClient.newHttpClient();

    private static final String DEFAULT_PRODUCTS_ENDPOINT = "/catalog/products";
    private static final String DEFAULT_PRODUCT_ENDPOINT = "/catalog/products/{id}";
    private static final String DEFAULT_PRODUCT_OPTIONS_ENDPOINT = "/catalog/products/{id}/options";
    private static final String DEFAULT_OPTION_VALUES_ENDPOINT = "/catalog/options/{id}/values";

    public SectorService(SectorRepository sectorRepository, ProductRepository productRepository) {
        this.sectorRepository = sectorRepository;
        this.productRepository = productRepository;
    }

    public List<SectorDto> list(boolean activeOnly) {
        String tenantId = TenantResolver.requireTenantId();
        List<Sector> sectors = activeOnly
                ? sectorRepository.findByTenantIdAndActiveTrue(tenantId)
                : sectorRepository.findByTenantId(tenantId);
        return sectors.stream().map(this::toDto).toList();
    }

    @Transactional
    public SectorDto create(SectorCreateRequest request) {
        if (request == null || request.getName() == null || request.getName().isBlank()) {
            throw new IllegalArgumentException("Name is required");
        }
        String tenantId = TenantResolver.requireTenantId();
        sectorRepository.findByTenantIdAndNameIgnoreCase(tenantId, request.getName())
                .ifPresent(existing -> {
                    throw new IllegalArgumentException("Sector already exists");
                });
        Sector sector = new Sector();
        sector.setTenantId(tenantId);
        sector.setName(request.getName().trim());
        if (request.getActive() != null) {
            sector.setActive(request.getActive());
        }
        applyCatalogSettings(sector, request.getCatalogType(), request.getExternalApiBaseUrl(),
                request.getExternalApiToken(), request.getExternalProductsEndpoint(),
                request.getExternalProductEndpoint(), request.getExternalProductOptionsEndpoint(),
                request.getExternalOptionValuesEndpoint(), true);
        return toDto(sectorRepository.save(sector));
    }

    @Transactional
    public SectorDto update(String id, SectorUpdateRequest request) {
        Sector sector = getOrThrow(id);
        if (request.getName() != null && !request.getName().isBlank()) {
            String nextName = request.getName().trim();
            sectorRepository.findByTenantIdAndNameIgnoreCase(sector.getTenantId(), nextName)
                    .filter(existing -> !existing.getId().equals(sector.getId()))
                    .ifPresent(existing -> {
                        throw new IllegalArgumentException("Sector already exists");
                    });
            sector.setName(nextName);
        }
        if (request.getActive() != null) {
            sector.setActive(request.getActive());
        }
        if (request.getCatalogType() != null
                || request.getExternalApiBaseUrl() != null
                || request.getExternalApiToken() != null
                || request.getExternalProductsEndpoint() != null
                || request.getExternalProductEndpoint() != null
                || request.getExternalProductOptionsEndpoint() != null
                || request.getExternalOptionValuesEndpoint() != null) {
            applyCatalogSettings(sector, request.getCatalogType(), request.getExternalApiBaseUrl(),
                    request.getExternalApiToken(), request.getExternalProductsEndpoint(),
                    request.getExternalProductEndpoint(), request.getExternalProductOptionsEndpoint(),
                    request.getExternalOptionValuesEndpoint(), false);
        }
        return toDto(sectorRepository.save(sector));
    }

    @Transactional
    public void delete(String id) {
        Sector sector = getOrThrow(id);
        if (productRepository.existsByTenantIdAndSectorId(sector.getTenantId(), sector.getId())) {
            throw new IllegalArgumentException("Sector has assigned products");
        }
        sectorRepository.delete(sector);
    }

    public SectorConnectionTestResponse testConnection(String id) {
        Sector sector = getOrThrow(id);
        SectorConnectionTestResponse response = new SectorConnectionTestResponse();
        if (sector.getCatalogType() != SectorCatalogType.EXTERNAL) {
            response.setOk(false);
            response.setStatus(400);
            response.setMessage("El sector no usa catálogo externo.");
            return response;
        }
        if (sector.getExternalApiBaseUrl() == null || sector.getExternalApiBaseUrl().isBlank()) {
            response.setOk(false);
            response.setStatus(400);
            response.setMessage("Falta API Base URL.");
            return response;
        }
        String endpoint = sector.getExternalProductsEndpoint() == null
                ? DEFAULT_PRODUCTS_ENDPOINT
                : sector.getExternalProductsEndpoint();
        String url = joinUrl(sector.getExternalApiBaseUrl(), endpoint);
        try {
            HttpRequest.Builder builder = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .GET();
            if (sector.getExternalApiToken() != null && !sector.getExternalApiToken().isBlank()) {
                builder.header("Authorization", "Bearer " + sector.getExternalApiToken().trim());
            }
            HttpRequest request = builder.build();
            HttpResponse<Void> httpResponse = httpClient.send(request, HttpResponse.BodyHandlers.discarding());
            int status = httpResponse.statusCode();
            response.setStatus(status);
            response.setOk(status >= 200 && status < 300);
            response.setMessage(response.isOk() ? "Conexión OK." : "Error al conectar con API externa.");
            return response;
        } catch (Exception ex) {
            response.setOk(false);
            response.setStatus(500);
            response.setMessage("Error al conectar: " + ex.getMessage());
            return response;
        }
    }

    private Sector getOrThrow(String id) {
        String tenantId = TenantResolver.requireTenantId();
        Sector sector = sectorRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Sector not found"));
        if (!tenantId.equals(sector.getTenantId())) {
            throw new IllegalArgumentException("Sector not found");
        }
        return sector;
    }

    private SectorDto toDto(Sector sector) {
        SectorDto dto = new SectorDto();
        dto.setId(sector.getId());
        dto.setTenantId(sector.getTenantId());
        dto.setName(sector.getName());
        dto.setActive(sector.isActive());
        dto.setCatalogType(sector.getCatalogType() == null ? null : sector.getCatalogType().name());
        dto.setExternalApiBaseUrl(sector.getExternalApiBaseUrl());
        dto.setExternalProductsEndpoint(sector.getExternalProductsEndpoint());
        dto.setExternalProductEndpoint(sector.getExternalProductEndpoint());
        dto.setExternalProductOptionsEndpoint(sector.getExternalProductOptionsEndpoint());
        dto.setExternalOptionValuesEndpoint(sector.getExternalOptionValuesEndpoint());
        dto.setCreatedAt(sector.getCreatedAt());
        return dto;
    }

    private void applyCatalogSettings(Sector sector,
                                      String catalogTypeRaw,
                                      String apiBaseUrl,
                                      String apiToken,
                                      String productsEndpoint,
                                      String productEndpoint,
                                      String productOptionsEndpoint,
                                      String optionValuesEndpoint,
                                      boolean isCreate) {
        SectorCatalogType catalogType = resolveCatalogType(catalogTypeRaw, sector.getCatalogType());
        sector.setCatalogType(catalogType);
        if (catalogType == SectorCatalogType.EXTERNAL) {
            if (apiBaseUrl == null || apiBaseUrl.isBlank()) {
                throw new IllegalArgumentException("API Base URL is required for external catalog");
            }
            sector.setExternalApiBaseUrl(apiBaseUrl.trim());
            if (apiToken != null) {
                sector.setExternalApiToken(apiToken.isBlank() ? null : apiToken.trim());
            } else if (isCreate && sector.getExternalApiToken() == null) {
                sector.setExternalApiToken(null);
            }
            sector.setExternalProductsEndpoint(
                    productsEndpoint == null || productsEndpoint.isBlank() ? DEFAULT_PRODUCTS_ENDPOINT : productsEndpoint.trim()
            );
            sector.setExternalProductEndpoint(
                    productEndpoint == null || productEndpoint.isBlank() ? DEFAULT_PRODUCT_ENDPOINT : productEndpoint.trim()
            );
            sector.setExternalProductOptionsEndpoint(
                    productOptionsEndpoint == null || productOptionsEndpoint.isBlank()
                            ? DEFAULT_PRODUCT_OPTIONS_ENDPOINT
                            : productOptionsEndpoint.trim()
            );
            sector.setExternalOptionValuesEndpoint(
                    optionValuesEndpoint == null || optionValuesEndpoint.isBlank()
                            ? DEFAULT_OPTION_VALUES_ENDPOINT
                            : optionValuesEndpoint.trim()
            );
        } else {
            sector.setExternalApiBaseUrl(null);
            if (apiToken != null && apiToken.isBlank()) {
                sector.setExternalApiToken(null);
            }
        }
    }

    private SectorCatalogType resolveCatalogType(String raw, SectorCatalogType fallback) {
        if (raw == null || raw.isBlank()) {
            return fallback == null ? SectorCatalogType.INTERNAL : fallback;
        }
        try {
            return SectorCatalogType.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            return fallback == null ? SectorCatalogType.INTERNAL : fallback;
        }
    }

    private String joinUrl(String base, String path) {
        String normalizedBase = base.endsWith("/") ? base.substring(0, base.length() - 1) : base;
        String normalizedPath = path.startsWith("/") ? path : "/" + path;
        return normalizedBase + normalizedPath;
    }
}
