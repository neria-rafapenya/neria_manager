package com.neria.presupuestos.repository.material;

import com.neria.presupuestos.model.entity.QuoteMaterial;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuoteMaterialRepository extends JpaRepository<QuoteMaterial, String> {
    List<QuoteMaterial> findByQuoteItemId(String quoteItemId);
    List<QuoteMaterial> findByQuoteItemIdIn(List<String> quoteItemIds);
    void deleteByQuoteItemId(String quoteItemId);
}
