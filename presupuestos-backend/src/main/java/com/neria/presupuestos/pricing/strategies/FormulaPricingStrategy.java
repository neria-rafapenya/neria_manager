package com.neria.presupuestos.pricing.strategies;

import com.neria.presupuestos.model.entity.Formula;
import com.neria.presupuestos.model.entity.OptionValue;
import com.neria.presupuestos.model.entity.PricingType;
import com.neria.presupuestos.model.entity.Product;
import com.neria.presupuestos.pricing.engine.PriceResult;
import com.neria.presupuestos.repository.formula.FormulaRepository;
import com.neria.presupuestos.repository.product.OptionValueRepository;
import com.neria.presupuestos.util.TenantResolver;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Map;

@Component
public class FormulaPricingStrategy implements PricingStrategy {

    private final FormulaRepository formulaRepository;
    private final OptionValueRepository optionValueRepository;

    public FormulaPricingStrategy(FormulaRepository formulaRepository,
                                  OptionValueRepository optionValueRepository) {
        this.formulaRepository = formulaRepository;
        this.optionValueRepository = optionValueRepository;
    }

    @Override
    public PricingType getType() {
        return PricingType.FORMULA;
    }

    @Override
    public PriceResult calculate(Product product, int quantity, Map<String, String> options) {
        return calculate(product, quantity, options, null);
    }

    public PriceResult calculate(Product product, int quantity, Map<String, String> options, String formulaIdOverride) {
        String formulaId = formulaIdOverride;
        if (formulaId == null || formulaId.isBlank()) {
            formulaId = product.getFormulaId();
        }
        if (formulaId == null || formulaId.isBlank()) {
            throw new IllegalArgumentException("Formula is required for FORMULA pricing");
        }
        String tenantId = TenantResolver.requireTenantId();
        Formula formula = formulaRepository.findById(formulaId)
                .orElseThrow(() -> new IllegalArgumentException("Formula not found"));
        if (!tenantId.equals(formula.getTenantId())) {
            throw new IllegalArgumentException("Formula not found");
        }
        if (product.getSectorId() != null && formula.getSectorId() != null
                && !product.getSectorId().equals(formula.getSectorId())) {
            throw new IllegalArgumentException("Formula does not match product sector");
        }

        BigDecimal base = formula.getBasePrice() == null ? BigDecimal.ZERO : formula.getBasePrice();
        BigDecimal unit = formula.getUnitPrice() == null ? BigDecimal.ZERO : formula.getUnitPrice();
        BigDecimal baseTotal = base.add(unit.multiply(BigDecimal.valueOf(quantity)));

        BigDecimal modifiers = BigDecimal.ZERO;
        if (options != null) {
            for (Map.Entry<String, String> entry : options.entrySet()) {
                String optionId = entry.getKey();
                String value = entry.getValue();
                if (optionId == null || value == null) {
                    continue;
                }
                for (OptionValue optionValue : optionValueRepository.findByOptionId(optionId)) {
                    if (value.equalsIgnoreCase(optionValue.getValue())) {
                        if (optionValue.getPriceModifier() != null) {
                            modifiers = modifiers.add(optionValue.getPriceModifier());
                        }
                    }
                }
            }
        }

        PriceResult result = new PriceResult();
        result.setBasePrice(baseTotal);
        result.setModifiers(modifiers);
        result.setTotal(baseTotal.add(modifiers));
        return result;
    }
}
