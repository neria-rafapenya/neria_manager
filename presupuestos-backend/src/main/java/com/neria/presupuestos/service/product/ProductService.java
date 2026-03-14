package com.neria.presupuestos.service.product;

import com.neria.presupuestos.model.dto.OptionValueCreateRequest;
import com.neria.presupuestos.model.dto.OptionValueDto;
import com.neria.presupuestos.model.dto.OptionValueUpdateRequest;
import com.neria.presupuestos.model.dto.ProductCreateRequest;
import com.neria.presupuestos.model.dto.ProductDto;
import com.neria.presupuestos.model.dto.ProductOptionCreateRequest;
import com.neria.presupuestos.model.dto.ProductOptionDto;
import com.neria.presupuestos.model.dto.ProductOptionUpdateRequest;
import com.neria.presupuestos.model.dto.ProductUpdateRequest;
import com.neria.presupuestos.model.entity.OptionValue;
import com.neria.presupuestos.model.entity.PricingType;
import com.neria.presupuestos.model.entity.Product;
import com.neria.presupuestos.model.entity.ProductOption;
import com.neria.presupuestos.repository.formula.FormulaRepository;
import com.neria.presupuestos.repository.ai.AiProfileRepository;
import com.neria.presupuestos.repository.product.OptionValueRepository;
import com.neria.presupuestos.repository.product.ProductOptionRepository;
import com.neria.presupuestos.repository.product.ProductRepository;
import com.neria.presupuestos.repository.quote.QuoteItemRepository;
import com.neria.presupuestos.repository.sector.SectorRepository;
import com.neria.presupuestos.util.TenantResolver;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductOptionRepository productOptionRepository;
    private final OptionValueRepository optionValueRepository;
    private final SectorRepository sectorRepository;
    private final FormulaRepository formulaRepository;
    private final QuoteItemRepository quoteItemRepository;
    private final AiProfileRepository aiProfileRepository;

    public ProductService(ProductRepository productRepository,
                          ProductOptionRepository productOptionRepository,
                          OptionValueRepository optionValueRepository,
                          SectorRepository sectorRepository,
                          FormulaRepository formulaRepository,
                          QuoteItemRepository quoteItemRepository,
                          AiProfileRepository aiProfileRepository) {
        this.productRepository = productRepository;
        this.productOptionRepository = productOptionRepository;
        this.optionValueRepository = optionValueRepository;
        this.sectorRepository = sectorRepository;
        this.formulaRepository = formulaRepository;
        this.quoteItemRepository = quoteItemRepository;
        this.aiProfileRepository = aiProfileRepository;
    }

    public List<ProductDto> list() {
        String tenantId = TenantResolver.requireTenantId();
        return productRepository.findByTenantId(tenantId)
                .stream()
                .map(this::toProductDto)
                .toList();
    }

    @Transactional
    public ProductDto create(ProductCreateRequest request) {
        String tenantId = TenantResolver.requireTenantId();
        validateSectorId(tenantId, request.getSectorId());
        Product product = new Product();
        product.setTenantId(tenantId);
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setSectorId(request.getSectorId());
        product.setPricingType(request.getPricingType());
        product.setBasePrice(request.getBasePrice());
        String resolvedFormulaId = resolveFormulaId(tenantId, request.getPricingType(), request.getFormulaId());
        if (request.getPricingType() == PricingType.FORMULA && (request.getSectorId() == null || request.getSectorId().isBlank())) {
            throw new IllegalArgumentException("Sector is required for FORMULA pricing");
        }
        if (request.getPricingType() == PricingType.FORMULA && request.getSectorId() != null) {
            formulaRepository.findById(resolvedFormulaId)
                    .filter(formula -> request.getSectorId().equals(formula.getSectorId()))
                    .orElseThrow(() -> new IllegalArgumentException("Formula does not belong to sector"));
        }
        product.setFormulaId(resolvedFormulaId);
        if (request.getActive() != null) {
            product.setActive(request.getActive());
        }
        return toProductDto(productRepository.save(product));
    }

    @Transactional
    public ProductDto update(String id, ProductUpdateRequest request) {
        Product product = getProductOrThrow(id);
        if (request.getName() != null) {
            product.setName(request.getName());
        }
        if (request.getDescription() != null) {
            product.setDescription(request.getDescription());
        }
        if (request.getSectorId() != null) {
            validateSectorId(product.getTenantId(), request.getSectorId());
            product.setSectorId(request.getSectorId());
        }
        if (request.getPricingType() != null) {
            product.setPricingType(request.getPricingType());
        }
        if (request.getPricingType() != null || request.getFormulaId() != null) {
            PricingType pricingType = request.getPricingType() != null ? request.getPricingType() : product.getPricingType();
            String formulaId = resolveFormulaId(product.getTenantId(), pricingType, request.getFormulaId());
            String sectorId = request.getSectorId() != null ? request.getSectorId() : product.getSectorId();
            if (pricingType == PricingType.FORMULA && (sectorId == null || sectorId.isBlank())) {
                throw new IllegalArgumentException("Sector is required for FORMULA pricing");
            }
            if (pricingType == PricingType.FORMULA && sectorId != null) {
                formulaRepository.findById(formulaId)
                        .filter(formula -> sectorId.equals(formula.getSectorId()))
                        .orElseThrow(() -> new IllegalArgumentException("Formula does not belong to sector"));
            }
            product.setFormulaId(formulaId);
        }
        if (request.getBasePrice() != null) {
            product.setBasePrice(request.getBasePrice());
        }
        if (request.getActive() != null) {
            product.setActive(request.getActive());
        }
        return toProductDto(productRepository.save(product));
    }

    @Transactional
    public void delete(String id) {
        Product product = getProductOrThrow(id);
        if (quoteItemRepository.existsByProductId(product.getId())) {
            throw new IllegalArgumentException("Product has quotes and cannot be deleted");
        }
        List<ProductOption> productOptions = productOptionRepository.findByProductId(product.getId());
        if (!productOptions.isEmpty()) {
            List<String> optionIds = productOptions.stream()
                    .map(ProductOption::getId)
                    .toList();
            optionValueRepository.deleteByOptionIdIn(optionIds);
            productOptionRepository.deleteByProductId(product.getId());
        }
        aiProfileRepository.deleteByProductId(product.getId());
        productRepository.delete(product);
    }

    public List<ProductOptionDto> listOptions(String productId) {
        Product product = getProductOrThrow(productId);
        return productOptionRepository.findByProductId(product.getId())
                .stream()
                .map(this::toOptionDto)
                .toList();
    }

    @Transactional
    public ProductOptionDto createOption(String productId, ProductOptionCreateRequest request) {
        Product product = getProductOrThrow(productId);
        ProductOption option = new ProductOption();
        option.setProductId(product.getId());
        option.setName(request.getName());
        option.setOptionType(request.getOptionType());
        if (request.getRequired() != null) {
            option.setRequired(request.getRequired());
        }
        return toOptionDto(productOptionRepository.save(option));
    }

    public List<OptionValueDto> listOptionValues(String optionId) {
        ProductOption option = getOptionOrThrow(optionId);
        return optionValueRepository.findByOptionId(option.getId())
                .stream()
                .map(this::toOptionValueDto)
                .toList();
    }

    @Transactional
    public OptionValueDto createOptionValue(String optionId, OptionValueCreateRequest request) {
        ProductOption option = getOptionOrThrow(optionId);
        OptionValue value = new OptionValue();
        value.setOptionId(option.getId());
        value.setValue(request.getValue());
        value.setPriceModifier(request.getPriceModifier());
        return toOptionValueDto(optionValueRepository.save(value));
    }

    @Transactional
    public ProductOptionDto updateOption(String optionId, ProductOptionUpdateRequest request) {
        ProductOption option = getOptionOrThrow(optionId);
        if (request.getName() != null) {
            option.setName(request.getName());
        }
        if (request.getOptionType() != null) {
            option.setOptionType(request.getOptionType());
        }
        if (request.getRequired() != null) {
            option.setRequired(request.getRequired());
        }
        return toOptionDto(productOptionRepository.save(option));
    }

    @Transactional
    public void deleteOption(String optionId) {
        ProductOption option = getOptionOrThrow(optionId);
        optionValueRepository.deleteAll(optionValueRepository.findByOptionId(option.getId()));
        productOptionRepository.delete(option);
    }

    @Transactional
    public OptionValueDto updateOptionValue(String valueId, OptionValueUpdateRequest request) {
        OptionValue value = getValueOrThrow(valueId);
        if (request.getValue() != null) {
            value.setValue(request.getValue());
        }
        if (request.getPriceModifier() != null) {
            value.setPriceModifier(request.getPriceModifier());
        }
        return toOptionValueDto(optionValueRepository.save(value));
    }

    @Transactional
    public void deleteOptionValue(String valueId) {
        OptionValue value = getValueOrThrow(valueId);
        optionValueRepository.delete(value);
    }

    private Product getProductOrThrow(String id) {
        String tenantId = TenantResolver.requireTenantId();
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));
        if (!tenantId.equals(product.getTenantId())) {
            throw new IllegalArgumentException("Product not found");
        }
        return product;
    }

    private ProductOption getOptionOrThrow(String optionId) {
        ProductOption option = productOptionRepository.findById(optionId)
                .orElseThrow(() -> new IllegalArgumentException("Option not found"));
        Product product = getProductOrThrow(option.getProductId());
        if (!product.getId().equals(option.getProductId())) {
            throw new IllegalArgumentException("Option not found");
        }
        return option;
    }

    private OptionValue getValueOrThrow(String valueId) {
        OptionValue value = optionValueRepository.findById(valueId)
                .orElseThrow(() -> new IllegalArgumentException("Option value not found"));
        getOptionOrThrow(value.getOptionId());
        return value;
    }

    private void validateSectorId(String tenantId, String sectorId) {
        if (sectorId == null || sectorId.isBlank()) {
            return;
        }
        sectorRepository.findById(sectorId)
                .filter(sector -> tenantId.equals(sector.getTenantId()))
                .orElseThrow(() -> new IllegalArgumentException("Sector not found"));
    }

    private String resolveFormulaId(String tenantId, PricingType pricingType, String formulaId) {
        if (pricingType != PricingType.FORMULA) {
            return null;
        }
        if (formulaId == null || formulaId.isBlank()) {
            throw new IllegalArgumentException("Formula is required for FORMULA pricing");
        }
        formulaRepository.findById(formulaId)
                .filter(formula -> tenantId.equals(formula.getTenantId()))
                .orElseThrow(() -> new IllegalArgumentException("Formula not found"));
        return formulaId;
    }

    private ProductDto toProductDto(Product product) {
        ProductDto dto = new ProductDto();
        dto.setId(product.getId());
        dto.setTenantId(product.getTenantId());
        dto.setName(product.getName());
        dto.setDescription(product.getDescription());
        dto.setSectorId(product.getSectorId());
        if (product.getSectorId() != null) {
            sectorRepository.findById(product.getSectorId())
                    .ifPresent(sector -> dto.setSectorName(sector.getName()));
        }
        dto.setPricingType(product.getPricingType());
        dto.setFormulaId(product.getFormulaId());
        if (product.getFormulaId() != null) {
            formulaRepository.findById(product.getFormulaId())
                    .ifPresent(formula -> dto.setFormulaName(formula.getName()));
        }
        dto.setBasePrice(product.getBasePrice());
        dto.setActive(product.isActive());
        dto.setCreatedAt(product.getCreatedAt());
        return dto;
    }

    private ProductOptionDto toOptionDto(ProductOption option) {
        ProductOptionDto dto = new ProductOptionDto();
        dto.setId(option.getId());
        dto.setProductId(option.getProductId());
        dto.setName(option.getName());
        dto.setOptionType(option.getOptionType());
        dto.setRequired(option.isRequired());
        return dto;
    }

    private OptionValueDto toOptionValueDto(OptionValue value) {
        OptionValueDto dto = new OptionValueDto();
        dto.setId(value.getId());
        dto.setOptionId(value.getOptionId());
        dto.setValue(value.getValue());
        dto.setPriceModifier(value.getPriceModifier());
        return dto;
    }
}
