package com.neria.presupuestos.repository.quote;

import com.neria.presupuestos.model.entity.QuoteItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuoteItemRepository extends JpaRepository<QuoteItem, String> {
    List<QuoteItem> findByQuoteId(String quoteId);

    boolean existsByProductId(String productId);
}
