package com.neria.presupuestos.model.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "presupuestos_quote_items")
public class QuoteItem {
    @Id
    @Column(length = 36, columnDefinition = "CHAR(36)")
    private String id;

    @Column(name = "quote_id", length = 36, nullable = false, columnDefinition = "CHAR(36)")
    private String quoteId;

    @Column(name = "product_id", length = 36, columnDefinition = "CHAR(36)")
    private String productId;

    @Column(name = "formula_id", length = 36, columnDefinition = "CHAR(36)")
    private String formulaId;

    private Integer quantity;

    @Column(name = "unit_price")
    private BigDecimal unitPrice;

    @Column(name = "total_price")
    private BigDecimal totalPrice;

    @PrePersist
    void onCreate() {
        if (id == null || id.isBlank()) {
            id = UUID.randomUUID().toString();
        }
    }
}
