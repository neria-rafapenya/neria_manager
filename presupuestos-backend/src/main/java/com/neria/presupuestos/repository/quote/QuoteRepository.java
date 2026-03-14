package com.neria.presupuestos.repository.quote;

import com.neria.presupuestos.model.entity.Quote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuoteRepository extends JpaRepository<Quote, String> {
    List<Quote> findByTenantId(String tenantId);

    List<Quote> findByTenantIdAndCustomerId(String tenantId, String customerId);
}
