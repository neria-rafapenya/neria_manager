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
@Table(name = "presupuestos_quote_item_options")
public class QuoteItemOption {
    @Id
    @Column(length = 36, columnDefinition = "CHAR(36)")
    private String id;

    @Column(name = "quote_item_id", length = 36, columnDefinition = "CHAR(36)")
    private String quoteItemId;

    @Column(name = "option_id", length = 36, columnDefinition = "CHAR(36)")
    private String optionId;

    private String value;

    @Column(name = "price_modifier")
    private BigDecimal priceModifier;

    @PrePersist
    void onCreate() {
        if (id == null || id.isBlank()) {
            id = UUID.randomUUID().toString();
        }
    }
}
