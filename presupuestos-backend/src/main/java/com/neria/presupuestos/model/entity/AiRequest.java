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
@Table(name = "presupuestos_ai_requests")
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
public class AiRequest {
    @Id
    @Column(length = 36, columnDefinition = "CHAR(36)")
    private String id;

    @Column(name = "tenant_id", length = 36, columnDefinition = "CHAR(36)")
    private String tenantId;

    @Column(name = "input_text", columnDefinition = "TEXT")
    private String inputText;

    @Column(name = "parsed_json", columnDefinition = "JSON")
    private String parsedJson;

    private Float confidence;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

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