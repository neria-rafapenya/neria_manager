package com.neria.presupuestos.service.material;

import com.neria.presupuestos.model.entity.Material;
import com.neria.presupuestos.model.entity.MaterialRuleType;
import com.neria.presupuestos.model.entity.Product;
import com.neria.presupuestos.model.entity.ProductMaterial;
import com.neria.presupuestos.model.entity.ProductOption;
import com.neria.presupuestos.model.entity.QuoteItem;
import com.neria.presupuestos.model.entity.QuoteMaterial;
import com.neria.presupuestos.repository.material.MaterialRepository;
import com.neria.presupuestos.repository.material.ProductMaterialRepository;
import com.neria.presupuestos.repository.product.ProductOptionRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

@Service
public class MaterialCalculationService {

    private final ProductMaterialRepository productMaterialRepository;
    private final MaterialRepository materialRepository;
    private final ProductOptionRepository productOptionRepository;

    public MaterialCalculationService(ProductMaterialRepository productMaterialRepository,
                                      MaterialRepository materialRepository,
                                      ProductOptionRepository productOptionRepository) {
        this.productMaterialRepository = productMaterialRepository;
        this.materialRepository = materialRepository;
        this.productOptionRepository = productOptionRepository;
    }

    public List<QuoteMaterial> calculateMaterials(Product product,
                                                  QuoteItem item,
                                                  Map<String, String> optionValues) {
        if (product == null || item == null) {
            return List.of();
        }
        List<ProductMaterial> rules = productMaterialRepository.findByProductId(product.getId());
        if (rules.isEmpty()) {
            return List.of();
        }

        Map<String, String> optionsByName = resolveOptionValuesByName(product.getId(), optionValues);
        String qualityTier = resolveQualityTier(optionsByName);

        BigDecimal floorArea = resolveNumber(optionsByName, "m²", "m2", "metro", "metros", "suelo", "superficie");
        if (floorArea == null || floorArea.compareTo(BigDecimal.ZERO) <= 0) {
            floorArea = BigDecimal.valueOf(item.getQuantity() == null ? 0 : item.getQuantity());
        }
        BigDecimal wallPerimeter = resolveNumber(optionsByName, "perimetro", "perímetro", "pared");
        BigDecimal wallHeight = resolveNumber(optionsByName, "altura", "alicat");
        final BigDecimal finalFloorArea = floorArea;
        final BigDecimal finalWallPerimeter = wallPerimeter;
        final BigDecimal finalWallHeight = wallHeight;

        return rules.stream()
                .filter(ProductMaterial::isActive)
                .filter(rule -> matchesQuality(rule.getQualityTier(), qualityTier))
                .map(rule -> buildQuoteMaterial(rule, finalFloorArea, finalWallPerimeter, finalWallHeight))
                .flatMap(Optional::stream)
                .toList();
    }

    private Optional<QuoteMaterial> buildQuoteMaterial(ProductMaterial rule,
                                                       BigDecimal floorArea,
                                                       BigDecimal wallPerimeter,
                                                       BigDecimal wallHeight) {
        Material material = materialRepository.findById(rule.getMaterialId()).orElse(null);
        if (material == null) {
            return Optional.empty();
        }

        BigDecimal base = BigDecimal.ZERO;
        MaterialRuleType type = rule.getRuleType() == null ? MaterialRuleType.PER_UNIT : rule.getRuleType();

        switch (type) {
            case FLOOR_AREA -> {
                if (floorArea == null || floorArea.compareTo(BigDecimal.ZERO) <= 0) {
                    return Optional.empty();
                }
                base = floorArea;
            }
            case WALL_AREA -> {
                if (wallPerimeter == null || wallHeight == null) {
                    return Optional.empty();
                }
                base = wallPerimeter.multiply(wallHeight);
            }
            case LINEAR -> {
                if (wallPerimeter == null || wallPerimeter.compareTo(BigDecimal.ZERO) <= 0) {
                    return Optional.empty();
                }
                base = wallPerimeter;
            }
            case FIXED -> base = BigDecimal.ONE;
            case PER_UNIT -> base = floorArea == null ? BigDecimal.ZERO : floorArea;
        }

        BigDecimal factor = rule.getQuantityFactor() == null ? BigDecimal.ONE : rule.getQuantityFactor();
        BigDecimal quantity = type == MaterialRuleType.FIXED ? factor : base.multiply(factor);

        BigDecimal waste = rule.getWastePercent() == null ? BigDecimal.ZERO : rule.getWastePercent();
        if (waste.compareTo(BigDecimal.ZERO) > 0) {
            quantity = quantity.multiply(BigDecimal.ONE.add(waste.divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP)));
        }

        if (quantity.compareTo(BigDecimal.ZERO) <= 0) {
            return Optional.empty();
        }

        BigDecimal unitCost = material.getCostPerUnit() == null ? BigDecimal.ZERO : material.getCostPerUnit();
        BigDecimal total = unitCost.multiply(quantity).setScale(2, RoundingMode.HALF_UP);

        QuoteMaterial quoteMaterial = new QuoteMaterial();
        quoteMaterial.setMaterialId(material.getId());
        quoteMaterial.setQuantity(quantity.setScale(4, RoundingMode.HALF_UP));
        quoteMaterial.setUnitCost(unitCost);
        quoteMaterial.setTotalCost(total);
        return Optional.of(quoteMaterial);
    }

    private Map<String, String> resolveOptionValuesByName(String productId, Map<String, String> optionValues) {
        Map<String, String> resolved = new HashMap<>();
        if (optionValues == null || optionValues.isEmpty()) {
            return resolved;
        }
        List<ProductOption> options = productOptionRepository.findByProductId(productId);
        Map<String, String> idToName = new HashMap<>();
        for (ProductOption option : options) {
            if (option.getId() != null && option.getName() != null) {
                idToName.put(option.getId(), option.getName());
            }
        }
        optionValues.forEach((optionId, value) -> {
            String name = idToName.get(optionId);
            if (name != null) {
                resolved.put(name, value);
            }
        });
        return resolved;
    }

    private String resolveQualityTier(Map<String, String> optionsByName) {
        for (Map.Entry<String, String> entry : optionsByName.entrySet()) {
            String name = normalize(entry.getKey());
            if (!name.contains("calidad")) {
                continue;
            }
            String value = normalize(entry.getValue());
            if (value.contains("basica") || value.contains("básica")) {
                return "BASIC";
            }
            if (value.contains("media")) {
                return "MEDIUM";
            }
            if (value.contains("alta") || value.contains("premium")) {
                return "PREMIUM";
            }
        }
        return null;
    }

    private boolean matchesQuality(String ruleTier, String selectedTier) {
        if (ruleTier == null || ruleTier.isBlank() || ruleTier.equalsIgnoreCase("ANY")) {
            return true;
        }
        if (selectedTier == null || selectedTier.isBlank()) {
            return false;
        }
        return ruleTier.trim().equalsIgnoreCase(selectedTier.trim());
    }

    private BigDecimal resolveNumber(Map<String, String> optionsByName, String... tokens) {
        for (Map.Entry<String, String> entry : optionsByName.entrySet()) {
            String normalized = normalize(entry.getKey());
            for (String token : tokens) {
                if (normalized.contains(normalize(token))) {
                    return extractNumber(entry.getValue());
                }
            }
        }
        return null;
    }

    private BigDecimal extractNumber(String raw) {
        if (raw == null) {
            return null;
        }
        String value = raw.replace(",", ".").trim();
        java.util.regex.Matcher matcher =
                java.util.regex.Pattern.compile("(\\d+(?:\\.\\d+)?)").matcher(value);
        BigDecimal first = null;
        BigDecimal max = null;
        while (matcher.find()) {
            try {
                BigDecimal num = new BigDecimal(matcher.group(1));
                if (first == null) {
                    first = num;
                }
                if (max == null || num.compareTo(max) > 0) {
                    max = num;
                }
            } catch (Exception ignored) {
                // ignore invalid numbers
            }
        }
        if (first == null) {
            return null;
        }
        if (value.contains("-") && max != null) {
            return max;
        }
        return first;
    }

    private String normalize(String value) {
        if (value == null) return "";
        return value.toLowerCase(Locale.ROOT).trim();
    }
}
