package com.neria.presupuestos.repository.quote;

import com.neria.presupuestos.model.entity.QuoteItemOption;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuoteItemOptionRepository extends JpaRepository<QuoteItemOption, String> {
    List<QuoteItemOption> findByQuoteItemId(String quoteItemId);
    List<QuoteItemOption> findByQuoteItemIdIn(List<String> quoteItemIds);
}
