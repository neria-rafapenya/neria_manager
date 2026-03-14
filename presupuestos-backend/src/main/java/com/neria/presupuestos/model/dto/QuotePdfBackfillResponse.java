package com.neria.presupuestos.model.dto;

import lombok.Data;

@Data
public class QuotePdfBackfillResponse {
    private int totalQuotes;
    private int createdPdfs;
    private int skipped;
    private int removedInvalid;
}
