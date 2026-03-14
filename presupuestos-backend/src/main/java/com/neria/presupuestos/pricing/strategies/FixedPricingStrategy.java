package com.neria.presupuestos.pricing.strategies;

import com.neria.presupuestos.model.entity.PricingType;
import com.neria.presupuestos.model.entity.Product;
import com.neria.presupuestos.pricing.engine.PriceResult;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Map;

@Component
public class FixedPricingStrategy implements PricingStrategy {
    @Override
    public PricingType getType() {
        return PricingType.FIXED;
    }

    @Override
    public PriceResult calculate(Product product, int quantity, Map<String, String> options) {
        PriceResult result = new PriceResult();
        BigDecimal base = product.getBasePrice() == null ? BigDecimal.ZERO : product.getBasePrice();
        result.setBasePrice(base);
        result.setModifiers(BigDecimal.ZERO);
        result.setTotal(base);
        return result;
    }
}
