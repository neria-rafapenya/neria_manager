package com.neria.presupuestos.model.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
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
@Table(name = "presupuestos_customers")
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
public class Customer {
    @Id
    @Column(length = 36, columnDefinition = "CHAR(36)")
    private String id;

    @Column(name = "tenant_id", length = 36, nullable = false, columnDefinition = "CHAR(36)")
    private String tenantId;

    private String name;

    private String email;

    private String phone;

    @Column(name = "user_id", length = 36, columnDefinition = "CHAR(36)")
    private String userId;

    @Column(name = "created_at", nullable = false)
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