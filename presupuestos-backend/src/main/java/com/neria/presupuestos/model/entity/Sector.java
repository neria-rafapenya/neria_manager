package com.neria.presupuestos.model.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Id;
import jakarta.persistence.Enumerated;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.Filter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "presupuestos_sectors")
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
public class Sector {
    @Id
    @Column(length = 36, columnDefinition = "CHAR(36)")
    private String id;

    @Column(name = "tenant_id", length = 36, columnDefinition = "CHAR(36)")
    private String tenantId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private boolean active = true;

    @Enumerated(EnumType.STRING)
    @Column(name = "catalog_type", nullable = false)
    private SectorCatalogType catalogType = SectorCatalogType.INTERNAL;

    @Column(name = "external_api_base_url")
    private String externalApiBaseUrl;

    @Column(name = "external_api_token")
    private String externalApiToken;

    @Column(name = "external_products_endpoint")
    private String externalProductsEndpoint;

    @Column(name = "external_product_endpoint")
    private String externalProductEndpoint;

    @Column(name = "external_product_options_endpoint")
    private String externalProductOptionsEndpoint;

    @Column(name = "external_option_values_endpoint")
    private String externalOptionValuesEndpoint;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (id == null || id.isBlank()) {
            id = UUID.randomUUID().toString();
        }
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
