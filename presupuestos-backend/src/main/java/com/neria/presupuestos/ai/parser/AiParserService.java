package com.neria.presupuestos.ai.parser;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.neria.presupuestos.ai.prompts.PromptTemplates;
import com.neria.presupuestos.config.openai.OpenAIProperties;
import com.neria.presupuestos.model.dto.AiParseRequest;
import com.neria.presupuestos.model.dto.AiParseResponse;
import com.neria.presupuestos.model.entity.AiRequest;
import com.neria.presupuestos.model.entity.OptionValue;
import com.neria.presupuestos.model.entity.Product;
import com.neria.presupuestos.model.entity.ProductOption;
import com.neria.presupuestos.model.entity.PricingType;
import com.neria.presupuestos.model.entity.Formula;
import com.neria.presupuestos.repository.ai.AiProfileRepository;
import com.neria.presupuestos.repository.ai.AiRequestRepository;
import com.neria.presupuestos.repository.formula.FormulaRepository;
import com.neria.presupuestos.repository.product.OptionValueRepository;
import com.neria.presupuestos.repository.product.ProductOptionRepository;
import com.neria.presupuestos.repository.product.ProductRepository;
import com.neria.presupuestos.repository.sector.SectorRepository;
import com.neria.presupuestos.util.TenantResolver;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.text.Normalizer;
import java.util.Set;
import java.util.Comparator;
import java.util.stream.Collectors;

@Service
public class AiParserService {

    private final RestTemplate restTemplate;
    private final OpenAIProperties properties;
    private final ObjectMapper objectMapper;
    private final AiRequestRepository aiRequestRepository;
    private final AiProfileRepository aiProfileRepository;
    private final ProductRepository productRepository;
    private final ProductOptionRepository productOptionRepository;
    private final OptionValueRepository optionValueRepository;
    private final SectorRepository sectorRepository;
    private final FormulaRepository formulaRepository;

    public AiParserService(RestTemplateBuilder builder,
                           OpenAIProperties properties,
                           ObjectMapper objectMapper,
                           AiRequestRepository aiRequestRepository,
                           AiProfileRepository aiProfileRepository,
                           ProductRepository productRepository,
                           ProductOptionRepository productOptionRepository,
                           OptionValueRepository optionValueRepository,
                           SectorRepository sectorRepository,
                           FormulaRepository formulaRepository) {
        this.restTemplate = builder.rootUri(properties.getBaseUrl()).build();
        this.properties = properties;
        this.objectMapper = objectMapper;
        this.aiRequestRepository = aiRequestRepository;
        this.aiProfileRepository = aiProfileRepository;
        this.productRepository = productRepository;
        this.productOptionRepository = productOptionRepository;
        this.optionValueRepository = optionValueRepository;
        this.sectorRepository = sectorRepository;
        this.formulaRepository = formulaRepository;
    }

    public AiParseResponse parse(AiParseRequest request) {
        if (properties.getApiKey() == null || properties.getApiKey().isBlank()) {
            throw new IllegalStateException("OPENAI_API_KEY is not configured");
        }
        if (request == null || request.getText() == null || request.getText().isBlank()) {
            throw new IllegalArgumentException("Text is required");
        }

        String tenantId = TenantResolver.requireTenantId();
        String sectorId = resolveSectorId(tenantId, request.getSectorId(), request.getSector());
        List<Product> products = loadProductsForSector(tenantId, sectorId);
        String sectorName = resolveSectorName(tenantId, sectorId, request.getSector());
        String productsBlock = buildProductsBlock(products);
        String optionsBlock = buildOptionsBlock(products);
        String promptInstructions = resolvePromptInstructions(tenantId, sectorId);
        String userPrompt = PromptTemplates.buildDynamicPrompt(sectorName, productsBlock, optionsBlock, promptInstructions) +
                "\n\nRequest:\n" + request.getText();

        Map<String, Object> body = Map.of(
                "model", properties.getModel(),
                "messages", List.of(
                        Map.of("role", "system", "content", PromptTemplates.SYSTEM_PROMPT),
                        Map.of("role", "user", "content", userPrompt)
                ),
                "temperature", 0,
                "response_format", Map.of("type", "json_object")
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(properties.getApiKey());

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        String json = null;
        Float confidence = null;
        String errorMessage = null;
        AiParseResponse parsed = new AiParseResponse();

        ResponseEntity<Map> response;
        try {
            response = restTemplate.postForEntity("/chat/completions", entity, Map.class);
        } catch (Exception ex) {
            errorMessage = "OPENAI_ERROR: " + ex.getMessage();
            saveAiRequest(request.getText(), null, null, errorMessage);
            throw ex;
        }

        String content = extractContent(response.getBody());
        json = extractJson(content);

        try {
            parsed = objectMapper.readValue(json, AiParseResponse.class);
            confidence = parsed.getConfidence();
        } catch (Exception ex) {
            errorMessage = "PARSE_ERROR: " + ex.getMessage();
        }

        String fallbackProduct = resolveProductFallback(parsed.getProduct(), request.getText(), products);
        if (fallbackProduct != null) {
            parsed.setProduct(fallbackProduct);
        }

        enrichWithMissingData(parsed, request.getText(), products, sectorId);

        saveAiRequest(request.getText(), json, confidence, errorMessage);
        return parsed;
    }

    private List<Product> loadProductsForSector(String tenantId, String sectorId) {
        List<Product> products;
        if (sectorId == null || sectorId.isBlank()) {
            products = productRepository.findByTenantId(tenantId);
        } else {
            products = productRepository.findByTenantIdAndSectorId(tenantId, sectorId);
        }
        return products.stream()
                .filter(Product::isActive)
                .toList();
    }

    private String resolveSectorId(String tenantId, String sectorId, String sectorName) {
        if (sectorId != null && !sectorId.isBlank()) {
            return sectorId;
        }
        if (sectorName == null || sectorName.isBlank()) {
            return null;
        }
        return sectorRepository.findByTenantIdAndNameIgnoreCase(tenantId, sectorName)
                .map(sector -> sector.getId())
                .orElse(null);
    }

    private String resolveSectorName(String tenantId, String sectorId, String sectorName) {
        if (sectorName != null && !sectorName.isBlank()) {
            return sectorName;
        }
        if (sectorId == null || sectorId.isBlank()) {
            return null;
        }
        return sectorRepository.findById(sectorId)
                .filter(sector -> tenantId.equals(sector.getTenantId()))
                .map(sector -> sector.getName())
                .orElse(null);
    }

    private String buildProductsBlock(List<Product> products) {
        if (products.isEmpty()) {
            return "(none)";
        }
        return products.stream()
                .map(Product::getName)
                .filter(name -> name != null && !name.isBlank())
                .distinct()
                .map(name -> "- " + name)
                .collect(Collectors.joining("\n"));
    }

    private String buildOptionsBlock(List<Product> products) {
        if (products.isEmpty()) {
            return "(none)";
        }
        StringBuilder builder = new StringBuilder();
        for (Product product : products) {
            if (product.getName() == null || product.getName().isBlank()) {
                continue;
            }
            builder.append(product.getName()).append(":\n");
            List<ProductOption> options = productOptionRepository.findByProductId(product.getId());
            if (options.isEmpty()) {
                builder.append("- (no options)\n\n");
                continue;
            }
            for (ProductOption option : options) {
                List<OptionValue> values = optionValueRepository.findByOptionId(option.getId());
                List<String> valueNames = new ArrayList<>();
                for (OptionValue value : values) {
                    if (value.getValue() != null && !value.getValue().isBlank()) {
                        valueNames.add(value.getValue());
                    }
                }
                String valuesText = valueNames.isEmpty() ? "null" : String.join(", ", valueNames);
                builder.append("- ").append(option.getName())
                        .append(" (").append(option.getOptionType()).append(")")
                        .append(": ").append(valuesText)
                        .append("\n");
            }
            builder.append("\n");
        }
        String result = builder.toString().trim();
        return result.isEmpty() ? "(none)" : result;
    }

    private void saveAiRequest(String inputText, String parsedJson, Float confidence, String errorMessage) {
        String tenantId = TenantResolver.requireTenantId();
        AiRequest log = new AiRequest();
        log.setTenantId(tenantId);
        log.setInputText(inputText);
        log.setParsedJson(parsedJson);
        log.setConfidence(confidence);
        log.setErrorMessage(errorMessage);
        aiRequestRepository.save(log);
    }

    private String resolvePromptInstructions(String tenantId, String sectorId) {
        if (sectorId == null || sectorId.isBlank()) {
            return null;
        }
        return aiProfileRepository.findFirstByTenantIdAndSectorIdAndProductIdIsNullAndActiveTrue(tenantId, sectorId)
                .map(profile -> profile.getPromptInstructions())
                .orElse(null);
    }

    private void enrichWithMissingData(AiParseResponse parsed, String inputText, List<Product> products, String sectorId) {
        if (parsed == null) {
            return;
        }
        String tenantId = TenantResolver.requireTenantId();
        Set<String> missing = new LinkedHashSet<>();
        Map<String, List<String>> optionSuggestions = new LinkedHashMap<>();
        List<String> formulaSuggestions = new ArrayList<>();

        Product matched = matchProduct(parsed.getProduct(), inputText, products);
        if (matched == null) {
            missing.add("product");
            parsed.setMissingFields(new ArrayList<>(missing));
            return;
        }

        parsed.setProductId(matched.getId());
        parsed.setProduct(matched.getName());

        if (parsed.getQuantity() == null || parsed.getQuantity() <= 0) {
            missing.add("quantity");
        }

        Map<String, String> aiOptions = parsed.getOptions();
        List<ProductOption> options = productOptionRepository.findByProductId(matched.getId());
        for (ProductOption option : options) {
            String optionName = option.getName();
            String rawValue = aiOptions == null || optionName == null ? null : aiOptions.get(optionName);
            boolean hasValue = rawValue != null && !rawValue.isBlank();
            if (!hasValue && option.isRequired()) {
                missing.add("option:" + optionName);
                optionSuggestions.put(optionName, buildOptionSuggestionValues(option));
                continue;
            }
            if (!hasValue) {
                continue;
            }
            if (option.getOptionType() == null) {
                continue;
            }
            switch (option.getOptionType()) {
                case SELECT -> {
                    List<OptionValue> values = optionValueRepository.findByOptionId(option.getId());
                    boolean match = values.stream()
                            .map(OptionValue::getValue)
                            .filter(value -> value != null && !value.isBlank())
                            .anyMatch(value -> normalizeText(value).equals(normalizeText(rawValue)));
                    if (!match) {
                        missing.add("option:" + optionName);
                        optionSuggestions.put(optionName, buildOptionSuggestionValues(option));
                    }
                }
                case NUMBER -> {
                    try {
                        Double.parseDouble(rawValue);
                    } catch (NumberFormatException ex) {
                        missing.add("option:" + optionName);
                    }
                }
                case BOOLEAN -> {
                    String normalized = normalizeText(rawValue);
                    boolean valid = normalized.equals("true") || normalized.equals("false")
                            || normalized.equals("si") || normalized.equals("sí")
                            || normalized.equals("no") || normalized.equals("yes")
                            || normalized.equals("1") || normalized.equals("0");
                    if (!valid) {
                        missing.add("option:" + optionName);
                        optionSuggestions.put(optionName, List.of("true", "false"));
                    }
                }
                default -> {
                }
            }
        }

        if (matched.getPricingType() == PricingType.FORMULA) {
            List<Formula> productFormulas = formulaRepository
                    .findByTenantIdAndProductId(tenantId, matched.getId())
                    .stream()
                    .filter(Formula::isActive)
                    .toList();
            if (productFormulas.size() > 1) {
                missing.add("formula");
                formulaSuggestions = productFormulas.stream()
                        .map(Formula::getName)
                        .filter(name -> name != null && !name.isBlank())
                        .distinct()
                        .toList();
            } else if (productFormulas.isEmpty() && (matched.getFormulaId() == null || matched.getFormulaId().isBlank())) {
                missing.add("formula");
            }
        }

        if (!missing.isEmpty()) {
            parsed.setMissingFields(new ArrayList<>(missing));
        }
        if (!optionSuggestions.isEmpty()) {
            parsed.setOptionSuggestions(optionSuggestions);
        }
        if (!formulaSuggestions.isEmpty()) {
            parsed.setFormulaSuggestions(formulaSuggestions);
        }
    }

    private List<String> buildOptionSuggestionValues(ProductOption option) {
        if (option.getOptionType() == null) {
            return List.of();
        }
        if (option.getOptionType() == com.neria.presupuestos.model.entity.OptionType.BOOLEAN) {
            return List.of("true", "false");
        }
        if (option.getOptionType() != com.neria.presupuestos.model.entity.OptionType.SELECT) {
            return List.of();
        }
        List<OptionValue> values = optionValueRepository.findByOptionId(option.getId());
        return values.stream()
                .map(OptionValue::getValue)
                .filter(value -> value != null && !value.isBlank())
                .distinct()
                .toList();
    }

    private Product matchProduct(String aiProduct, String inputText, List<Product> products) {
        if (products == null || products.isEmpty()) {
            return null;
        }
        String candidate = aiProduct;
        if (candidate == null || candidate.isBlank()) {
            candidate = resolveProductFallback(aiProduct, inputText, products);
        }
        if (candidate == null || candidate.isBlank()) {
            return null;
        }
        String normalizedCandidate = normalizeText(candidate);
        return products.stream()
                .filter(product -> product.getName() != null)
                .filter(product -> normalizeText(product.getName()).equals(normalizedCandidate))
                .findFirst()
                .orElseGet(() -> products.stream()
                        .filter(product -> product.getName() != null)
                        .filter(product -> matchesName(normalizedCandidate, normalizeText(product.getName())))
                        .findFirst()
                        .orElse(null));
    }

    @SuppressWarnings("unchecked")
    private String extractContent(Map body) {
        if (body == null) {
            return "{}";
        }
        Object choicesObj = body.get("choices");
        if (choicesObj instanceof List<?> choices && !choices.isEmpty()) {
            Object first = choices.get(0);
            if (first instanceof Map<?, ?> choice) {
                Object messageObj = choice.get("message");
                if (messageObj instanceof Map<?, ?> message) {
                    Object content = message.get("content");
                    return content == null ? "{}" : content.toString();
                }
            }
        }
        return "{}";
    }

    private String extractJson(String content) {
        if (content == null) {
            return "{}";
        }
        String trimmed = content.trim();
        if (trimmed.startsWith("```")) {
            trimmed = trimmed.replaceFirst("^```(json)?", "").trim();
            if (trimmed.endsWith("```")) {
                trimmed = trimmed.substring(0, trimmed.length() - 3).trim();
            }
        }
        return trimmed;
    }

    private String resolveProductFallback(String aiProduct, String inputText, List<Product> products) {
        if (products == null || products.isEmpty()) {
            return null;
        }
        String normalizedInput = normalizeText(inputText);
        if (normalizedInput.isBlank()) {
            return null;
        }

        String aiNormalized = normalizeText(aiProduct);
        if (!aiNormalized.isBlank()) {
            for (Product product : products) {
                String name = normalizeText(product.getName());
                if (name.isBlank()) continue;
                if (matchesName(aiNormalized, name)) {
                    return product.getName();
                }
            }
        }

        return products.stream()
                .map(Product::getName)
                .filter(name -> name != null && !name.isBlank())
                .map(name -> Map.entry(name, bestMatchScore(normalizedInput, normalizeText(name))))
                .filter(entry -> entry.getValue() > 0)
                .max(Comparator.comparingInt(Map.Entry::getValue))
                .map(Map.Entry::getKey)
                .orElse(null);
    }

    private int bestMatchScore(String text, String name) {
        if (name.isBlank()) return 0;
        if (text.contains(name)) return name.length();
        String singular = singularize(name);
        if (!singular.equals(name) && text.contains(singular)) return singular.length();
        String[] parts = name.split("\\s+");
        for (String part : parts) {
            if (part.length() > 3 && text.contains(part)) {
                return part.length();
            }
        }
        return 0;
    }

    private boolean matchesName(String aiValue, String productName) {
        if (aiValue.equals(productName)) return true;
        String aiSingular = singularize(aiValue);
        String productSingular = singularize(productName);
        return aiValue.contains(productName) || productName.contains(aiValue)
                || aiSingular.equals(productName) || productSingular.equals(aiValue)
                || aiSingular.equals(productSingular);
    }

    private String normalizeText(String text) {
        if (text == null) return "";
        String normalized = Normalizer.normalize(text, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase()
                .replaceAll("[^a-z0-9\\s]", " ")
                .replaceAll("\\s+", " ")
                .trim();
        return normalized;
    }

    private String singularize(String value) {
        if (value == null) return "";
        if (value.endsWith("es") && value.length() > 3) {
            return value.substring(0, value.length() - 2);
        }
        if (value.endsWith("s") && value.length() > 2) {
            return value.substring(0, value.length() - 1);
        }
        return value;
    }
}
