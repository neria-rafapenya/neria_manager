package com.neria.presupuestos.model.dto;

import com.neria.presupuestos.model.entity.SubscriptionPlan;
import com.neria.presupuestos.model.entity.SubscriptionStatus;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class SubscriptionDto {
    private String id;
    private String tenantId;
    private SubscriptionPlan plan;
    private String stripeCustomerId;
    private String stripeSubscriptionId;
    private SubscriptionStatus status;
    private LocalDateTime createdAt;
}
