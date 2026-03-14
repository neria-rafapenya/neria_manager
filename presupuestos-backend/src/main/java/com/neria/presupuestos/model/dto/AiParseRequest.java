package com.neria.presupuestos.model.dto;

import lombok.Data;

@Data
public class AiParseRequest {
    private String text;
    private String sector;
    private String sectorId;
}
