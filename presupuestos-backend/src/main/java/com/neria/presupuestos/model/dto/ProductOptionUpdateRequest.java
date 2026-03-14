package com.neria.presupuestos.model.dto;

import com.neria.presupuestos.model.entity.OptionType;

public class ProductOptionUpdateRequest {

    private String name;
    private OptionType optionType;
    private Boolean required;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public OptionType getOptionType() {
        return optionType;
    }

    public void setOptionType(OptionType optionType) {
        this.optionType = optionType;
    }

    public Boolean getRequired() {
        return required;
    }

    public void setRequired(Boolean required) {
        this.required = required;
    }
}
