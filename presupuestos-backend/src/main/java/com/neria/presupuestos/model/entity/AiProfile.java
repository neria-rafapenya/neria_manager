package com.neria.presupuestos.model.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.Filter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "presupuestos_ai_profiles")
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
public class AiProfile {
    @Id
    @Column(length = 36, columnDefinition = "CHAR(36)")
    private String id;

    @Column(name = "tenant_id", length = 36, columnDefinition = "CHAR(36)", nullable = false)
    private String tenantId;

    @Column(name = "sector_id", length = 36, columnDefinition = "CHAR(36)")
    private String sectorId;

    @Column(name = "product_id", length = 36, columnDefinition = "CHAR(36)")
    private String productId;

    @Column(name = "required_options", columnDefinition = "TEXT")
    private String requiredOptions;

    @Column(name = "prompt_instructions", columnDefinition = "TEXT")
    private String promptInstructions;

    @Column(name = "quantity_label")
    private String quantityLabel;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        if (id == null || id.isBlank()) {
            id = UUID.randomUUID().toString();
        }
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (updatedAt == null) {
            updatedAt = LocalDateTime.now();
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
