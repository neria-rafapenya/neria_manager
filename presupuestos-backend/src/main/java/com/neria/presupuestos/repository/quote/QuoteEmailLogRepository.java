package com.neria.presupuestos.repository.quote;

import com.neria.presupuestos.model.entity.QuoteEmailLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuoteEmailLogRepository extends JpaRepository<QuoteEmailLog, String> {
    List<QuoteEmailLog> findByQuoteId(String quoteId);
}
