package com.neria.presupuestos.model.dto;

import java.time.LocalDateTime;
import java.util.List;

public class AiProfileDto {
    private String id;
    private String tenantId;
    private String sectorId;
    private String sectorName;
    private String productId;
    private String productName;
    private List<String> requiredOptionNames;
    private String promptInstructions;
    private String quantityLabel;
    private Boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTenantId() {
        return tenantId;
    }

    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }

    public String getSectorId() {
        return sectorId;
    }

    public void setSectorId(String sectorId) {
        this.sectorId = sectorId;
    }

    public String getSectorName() {
        return sectorName;
    }

    public void setSectorName(String sectorName) {
        this.sectorName = sectorName;
    }

    public String getProductId() {
        return productId;
    }

    public void setProductId(String productId) {
        this.productId = productId;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public List<String> getRequiredOptionNames() {
        return requiredOptionNames;
    }

    public void setRequiredOptionNames(List<String> requiredOptionNames) {
        this.requiredOptionNames = requiredOptionNames;
    }

    public String getPromptInstructions() {
        return promptInstructions;
    }

    public void setPromptInstructions(String promptInstructions) {
        this.promptInstructions = promptInstructions;
    }

    public String getQuantityLabel() {
        return quantityLabel;
    }

    public void setQuantityLabel(String quantityLabel) {
        this.quantityLabel = quantityLabel;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
