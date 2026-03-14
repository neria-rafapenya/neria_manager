package com.neria.presupuestos.pricing.engine;

import com.neria.presupuestos.model.entity.PricingType;
import com.neria.presupuestos.model.entity.Product;
import com.neria.presupuestos.pricing.strategies.PricingStrategy;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Component
public class QuotePricingEngine {

    private final Map<PricingType, PricingStrategy> strategies = new EnumMap<>(PricingType.class);

    public QuotePricingEngine(List<PricingStrategy> strategyList) {
        for (PricingStrategy strategy : strategyList) {
            strategies.put(strategy.getType(), strategy);
        }
    }

    public PriceResult calculate(Product product, int quantity, Map<String, String> options) {
        return calculate(product, quantity, options, null);
    }

    public PriceResult calculate(Product product, int quantity, Map<String, String> options, String formulaIdOverride) {
        if (product == null || product.getPricingType() == null) {
            throw new IllegalArgumentException("Product and pricing type are required");
        }
        PricingStrategy strategy = strategies.get(product.getPricingType());
        if (strategy == null) {
            throw new IllegalStateException("No pricing strategy for type " + product.getPricingType());
        }
        if (product.getPricingType() == PricingType.FORMULA
                && formulaIdOverride != null
                && strategy instanceof com.neria.presupuestos.pricing.strategies.FormulaPricingStrategy formulaStrategy) {
            return formulaStrategy.calculate(product, quantity, options, formulaIdOverride);
        }
        return strategy.calculate(product, quantity, options);
    }
}
