package com.neria.presupuestos.model.dto;

import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class AiParseResponse {
    private String product;
    private String productId;
    private Integer quantity;
    private Map<String, String> options;
    private Float confidence;
    private List<String> missingFields;
    private Map<String, List<String>> optionSuggestions;
    private List<String> formulaSuggestions;
}
