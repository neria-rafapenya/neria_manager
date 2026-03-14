package com.neria.presupuestos.repository.quote;

import com.neria.presupuestos.model.entity.QuoteAttachment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuoteAttachmentRepository extends JpaRepository<QuoteAttachment, String> {
    List<QuoteAttachment> findByQuoteId(String quoteId);
    List<QuoteAttachment> findByTenantId(String tenantId);
}
