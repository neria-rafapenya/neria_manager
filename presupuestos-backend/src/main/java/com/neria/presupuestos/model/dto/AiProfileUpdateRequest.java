package com.neria.presupuestos.model.dto;

import java.util.List;

public class AiProfileUpdateRequest {
    private String sectorId;
    private String productId;
    private List<String> requiredOptionNames;
    private String promptInstructions;
    private String quantityLabel;
    private Boolean active;

    public String getSectorId() {
        return sectorId;
    }

    public void setSectorId(String sectorId) {
        this.sectorId = sectorId;
    }

    public String getProductId() {
        return productId;
    }

    public void setProductId(String productId) {
        this.productId = productId;
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
}
