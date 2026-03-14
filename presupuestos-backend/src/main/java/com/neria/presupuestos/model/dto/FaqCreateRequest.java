package com.neria.presupuestos.model.dto;

import lombok.Data;

@Data
public class FaqCreateRequest {
    private String question;
    private String answer;
    private Integer orderIndex;
}
