package com.neria.presupuestos.pricing.strategies;

import com.neria.presupuestos.model.entity.PricingType;
import com.neria.presupuestos.model.entity.Product;
import com.neria.presupuestos.pricing.engine.PriceResult;

import java.util.Map;

public interface PricingStrategy {
    PricingType getType();
    PriceResult calculate(Product product, int quantity, Map<String, String> options);
}
