package com.neria.presupuestos.model.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class UsageMetricDto {
    private String id;
    private String tenantId;
    private String metricType;
    private Integer value;
    private LocalDateTime createdAt;
}
