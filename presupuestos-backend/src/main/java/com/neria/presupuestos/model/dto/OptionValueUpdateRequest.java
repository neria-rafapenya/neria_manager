package com.neria.presupuestos.model.dto;

import java.math.BigDecimal;

public class OptionValueUpdateRequest {

    private String value;
    private BigDecimal priceModifier;

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }

    public BigDecimal getPriceModifier() {
        return priceModifier;
    }

    public void setPriceModifier(BigDecimal priceModifier) {
        this.priceModifier = priceModifier;
    }
}
