package com.neria.presupuestos.model.dto;

import com.neria.presupuestos.model.entity.OptionType;
import lombok.Data;

@Data
public class ProductOptionCreateRequest {
    private String name;
    private OptionType optionType;
    private Boolean required;
}
