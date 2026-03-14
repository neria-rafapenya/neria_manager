package com.neria.presupuestos.model.dto;

import com.neria.presupuestos.model.entity.OptionType;
import lombok.Data;

@Data
public class ProductOptionDto {
    private String id;
    private String productId;
    private String name;
    private OptionType optionType;
    private boolean required;
}
