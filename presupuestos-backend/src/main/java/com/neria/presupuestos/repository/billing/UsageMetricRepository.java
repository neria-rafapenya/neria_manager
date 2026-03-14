package com.neria.presupuestos.repository.billing;

import com.neria.presupuestos.model.entity.UsageMetric;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UsageMetricRepository extends JpaRepository<UsageMetric, String> {
    List<UsageMetric> findByTenantId(String tenantId);
}
