package com.neria.presupuestos.service.quote;

import com.neria.presupuestos.model.dto.PriceResultDto;
import com.neria.presupuestos.model.dto.QuoteCalculationRequest;
import com.neria.presupuestos.model.dto.QuoteCalculationResponse;
import com.neria.presupuestos.model.dto.QuoteCreateRequest;
import com.neria.presupuestos.model.dto.QuoteDto;
import com.neria.presupuestos.model.dto.QuoteItemCreateRequest;
import com.neria.presupuestos.model.dto.QuoteItemDto;
import com.neria.presupuestos.model.dto.QuoteItemOptionCreateRequest;
import com.neria.presupuestos.model.dto.QuoteItemOptionDto;
import com.neria.presupuestos.model.dto.QuoteMaterialDto;
import com.neria.presupuestos.model.dto.QuoteUpdateRequest;
import com.neria.presupuestos.model.entity.Product;
import com.neria.presupuestos.model.entity.Quote;
import com.neria.presupuestos.model.entity.QuoteItem;
import com.neria.presupuestos.model.entity.QuoteItemOption;
import com.neria.presupuestos.pricing.engine.PriceResult;
import com.neria.presupuestos.pricing.engine.QuotePricingEngine;
import com.neria.presupuestos.repository.product.ProductRepository;
import com.neria.presupuestos.repository.quote.QuoteItemOptionRepository;
import com.neria.presupuestos.repository.quote.QuoteItemRepository;
import com.neria.presupuestos.repository.quote.QuoteRepository;
import com.neria.presupuestos.repository.quote.QuoteAttachmentRepository;
import com.neria.presupuestos.repository.material.QuoteMaterialRepository;
import com.neria.presupuestos.repository.material.MaterialRepository;
import com.neria.presupuestos.repository.customer.CustomerRepository;
import com.neria.presupuestos.repository.formula.FormulaRepository;
import com.neria.presupuestos.util.TenantResolver;
import com.neria.presupuestos.config.security.JwtUser;
import com.neria.presupuestos.model.entity.Customer;
import com.neria.presupuestos.model.entity.UserRole;
import com.neria.presupuestos.model.entity.QuoteAttachment;
import com.neria.presupuestos.model.entity.QuoteMaterial;
import com.neria.presupuestos.model.dto.QuoteAttachmentCreateRequest;
import com.neria.presupuestos.service.storage.CloudinaryUploadService;
import com.neria.presupuestos.service.material.MaterialCalculationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class QuoteService {

    private final QuoteRepository quoteRepository;
    private final QuoteItemRepository quoteItemRepository;
    private final QuoteItemOptionRepository quoteItemOptionRepository;
    private final ProductRepository productRepository;
    private final QuotePricingEngine pricingEngine;
    private final CustomerRepository customerRepository;
    private final FormulaRepository formulaRepository;
    private final QuoteAttachmentRepository quoteAttachmentRepository;
    private final QuoteAttachmentService quoteAttachmentService;
    private final QuotePdfService quotePdfService;
    private final CloudinaryUploadService uploadService;
    private final MaterialCalculationService materialCalculationService;
    private final QuoteMaterialRepository quoteMaterialRepository;
    private final MaterialRepository materialRepository;

    public QuoteService(QuoteRepository quoteRepository,
                        QuoteItemRepository quoteItemRepository,
                        QuoteItemOptionRepository quoteItemOptionRepository,
                        ProductRepository productRepository,
                        QuotePricingEngine pricingEngine,
                        CustomerRepository customerRepository,
                        FormulaRepository formulaRepository,
                        QuoteAttachmentRepository quoteAttachmentRepository,
                        QuoteAttachmentService quoteAttachmentService,
                        QuotePdfService quotePdfService,
                        CloudinaryUploadService uploadService,
                        MaterialCalculationService materialCalculationService,
                        QuoteMaterialRepository quoteMaterialRepository,
                        MaterialRepository materialRepository) {
        this.quoteRepository = quoteRepository;
        this.quoteItemRepository = quoteItemRepository;
        this.quoteItemOptionRepository = quoteItemOptionRepository;
        this.productRepository = productRepository;
        this.pricingEngine = pricingEngine;
        this.customerRepository = customerRepository;
        this.formulaRepository = formulaRepository;
        this.quoteAttachmentRepository = quoteAttachmentRepository;
        this.quoteAttachmentService = quoteAttachmentService;
        this.quotePdfService = quotePdfService;
        this.uploadService = uploadService;
        this.materialCalculationService = materialCalculationService;
        this.quoteMaterialRepository = quoteMaterialRepository;
        this.materialRepository = materialRepository;
    }

    public List<QuoteDto> list() {
        String tenantId = TenantResolver.requireTenantId();
        JwtUser user = currentUser();
        if (user != null && user.getRole() == UserRole.STAFF) {
            Customer customer = resolveCustomerForUser(tenantId, user);
            if (customer == null) {
                return List.of();
            }
            return quoteRepository.findByTenantIdAndCustomerId(tenantId, customer.getId())
                    .stream()
                    .map(this::toQuoteDto)
                    .toList();
        }
        return quoteRepository.findByTenantId(tenantId)
                .stream()
                .map(this::toQuoteDto)
                .toList();
    }

    public QuoteDto get(String id) {
        Quote quote = getQuoteOrThrow(id);
        enforceUserOwnership(quote);
        return toQuoteDto(quote);
    }

    @Transactional
    public QuoteDto create(QuoteCreateRequest request) {
        String tenantId = TenantResolver.requireTenantId();
        JwtUser user = currentUser();
        if (user != null && user.getRole() == UserRole.STAFF && request.getCustomerId() == null) {
            Customer customer = resolveCustomerForUser(tenantId, user);
            if (customer == null) {
                customer = createCustomerForUser(tenantId, user);
            }
            request.setCustomerId(customer.getId());
        }
        Quote quote = new Quote();
        quote.setTenantId(tenantId);
        quote.setCustomerId(request.getCustomerId());
        quote.setSector(request.getSector());
        quote = quoteRepository.save(quote);

        BigDecimal total = BigDecimal.ZERO;
        if (request.getItems() != null) {
            for (QuoteItemCreateRequest itemRequest : request.getItems()) {
                total = total.add(createQuoteItem(quote, itemRequest));
            }
        }
        quote.setTotalPrice(total);
        quoteRepository.save(quote);
        ensurePdfAttachment(quote);
        return toQuoteDto(quote);
    }

    @Transactional
    public QuoteDto update(String id, QuoteUpdateRequest request) {
        Quote quote = getQuoteOrThrow(id);
        enforceUserOwnership(quote);
        if (request.getStatus() != null) {
            quote.setStatus(request.getStatus());
        }
        if (request.getSector() != null) {
            quote.setSector(request.getSector());
        }
        if (request.getItems() != null) {
            deleteQuoteItems(quote.getId());
            BigDecimal total = BigDecimal.ZERO;
            for (QuoteItemCreateRequest itemRequest : request.getItems()) {
                total = total.add(createQuoteItem(quote, itemRequest));
            }
            quote.setTotalPrice(total);
        }
        Quote saved = quoteRepository.save(quote);
        ensurePdfAttachment(saved);
        return toQuoteDto(saved);
    }

    public QuoteCalculationResponse calculate(QuoteCalculationRequest request) {
        Product product = getProductOrThrow(request.getProductId());
        int quantity = request.getQuantity() == null ? 1 : request.getQuantity();
        Map<String, String> options = request.getOptions() == null ? Map.of() : request.getOptions();
        PriceResult result = pricingEngine.calculate(product, quantity, options);

        QuoteCalculationResponse response = new QuoteCalculationResponse();
        response.setTotalPrice(result.getTotal());
        response.setBreakdown(toPriceResultDto(result));
        return response;
    }

    private BigDecimal createQuoteItem(Quote quote, QuoteItemCreateRequest itemRequest) {
        Product product = getProductOrThrow(itemRequest.getProductId());
        int quantity = itemRequest.getQuantity() == null ? 1 : Math.max(itemRequest.getQuantity(), 1);

        Map<String, String> options = new HashMap<>();
        if (itemRequest.getOptions() != null) {
            for (QuoteItemOptionCreateRequest optionRequest : itemRequest.getOptions()) {
                options.put(optionRequest.getOptionId(), optionRequest.getValue());
            }
        }
        String formulaIdOverride = resolveFormulaOverride(itemRequest, product);
        PriceResult result = pricingEngine.calculate(product, quantity, options, formulaIdOverride);

        QuoteItem item = new QuoteItem();
        item.setQuoteId(quote.getId());
        item.setProductId(product.getId());
        item.setFormulaId(formulaIdOverride);
        item.setQuantity(quantity);
        item.setUnitPrice(BigDecimal.ZERO);
        item.setTotalPrice(result.getTotal());
        item = quoteItemRepository.save(item);

        if (itemRequest.getOptions() != null) {
            for (QuoteItemOptionCreateRequest optionRequest : itemRequest.getOptions()) {
                QuoteItemOption option = new QuoteItemOption();
                option.setQuoteItemId(item.getId());
                option.setOptionId(optionRequest.getOptionId());
                option.setValue(optionRequest.getValue());
                option.setPriceModifier(optionRequest.getPriceModifier());
                quoteItemOptionRepository.save(option);
            }
        }

        List<QuoteMaterial> materials = materialCalculationService.calculateMaterials(product, item, options);
        BigDecimal materialsTotal = BigDecimal.ZERO;
        for (QuoteMaterial material : materials) {
            material.setQuoteItemId(item.getId());
            QuoteMaterial saved = quoteMaterialRepository.save(material);
            if (saved.getTotalCost() != null) {
                materialsTotal = materialsTotal.add(saved.getTotalCost());
            }
        }

        BigDecimal itemTotal = result.getTotal().add(materialsTotal);
        BigDecimal unitPrice = quantity > 0
                ? itemTotal.divide(BigDecimal.valueOf(quantity), 2, RoundingMode.HALF_UP)
                : itemTotal;
        item.setUnitPrice(unitPrice);
        item.setTotalPrice(itemTotal);
        quoteItemRepository.save(item);
        return itemTotal;
    }

    private void deleteQuoteItems(String quoteId) {
        List<QuoteItem> items = quoteItemRepository.findByQuoteId(quoteId);
        for (QuoteItem item : items) {
            List<QuoteItemOption> options = quoteItemOptionRepository.findByQuoteItemId(item.getId());
            quoteItemOptionRepository.deleteAll(options);
            quoteMaterialRepository.deleteByQuoteItemId(item.getId());
        }
        quoteItemRepository.deleteAll(items);
    }

    private QuoteDto toQuoteDto(Quote quote) {
        QuoteDto dto = new QuoteDto();
        dto.setId(quote.getId());
        dto.setTenantId(quote.getTenantId());
        dto.setCustomerId(quote.getCustomerId());
        dto.setSector(quote.getSector());
        dto.setStatus(quote.getStatus());
        dto.setTotalPrice(quote.getTotalPrice());
        dto.setCreatedAt(quote.getCreatedAt());

        List<QuoteItemDto> items = quoteItemRepository.findByQuoteId(quote.getId())
                .stream()
                .map(this::toQuoteItemDto)
                .toList();
        dto.setItems(items);
        return dto;
    }

    private QuoteItemDto toQuoteItemDto(QuoteItem item) {
        QuoteItemDto dto = new QuoteItemDto();
        dto.setId(item.getId());
        dto.setQuoteId(item.getQuoteId());
        dto.setProductId(item.getProductId());
        dto.setFormulaId(item.getFormulaId());
        dto.setQuantity(item.getQuantity());
        dto.setUnitPrice(item.getUnitPrice());
        dto.setTotalPrice(item.getTotalPrice());

        List<QuoteItemOptionDto> options = quoteItemOptionRepository.findByQuoteItemId(item.getId())
                .stream()
                .map(this::toQuoteItemOptionDto)
                .toList();
        dto.setOptions(options);
        List<QuoteMaterialDto> materials = quoteMaterialRepository.findByQuoteItemId(item.getId())
                .stream()
                .map(this::toQuoteMaterialDto)
                .toList();
        dto.setMaterials(materials);
        return dto;
    }

    private QuoteMaterialDto toQuoteMaterialDto(QuoteMaterial material) {
        QuoteMaterialDto dto = new QuoteMaterialDto();
        dto.setId(material.getId());
        dto.setQuoteItemId(material.getQuoteItemId());
        dto.setMaterialId(material.getMaterialId());
        dto.setQuantity(material.getQuantity());
        dto.setUnitCost(material.getUnitCost());
        dto.setTotalCost(material.getTotalCost());
        materialRepository.findById(material.getMaterialId())
                .ifPresent(mat -> {
                    dto.setMaterialName(mat.getName());
                    dto.setUnit(mat.getUnit());
                });
        return dto;
    }

    private QuoteItemOptionDto toQuoteItemOptionDto(QuoteItemOption option) {
        QuoteItemOptionDto dto = new QuoteItemOptionDto();
        dto.setId(option.getId());
        dto.setQuoteItemId(option.getQuoteItemId());
        dto.setOptionId(option.getOptionId());
        dto.setValue(option.getValue());
        dto.setPriceModifier(option.getPriceModifier());
        return dto;
    }

    private String resolveFormulaOverride(QuoteItemCreateRequest itemRequest, Product product) {
        if (itemRequest == null) {
            return null;
        }
        if (itemRequest.getFormulaId() != null && !itemRequest.getFormulaId().isBlank()) {
            return itemRequest.getFormulaId();
        }
        if (itemRequest.getFormulaName() == null || itemRequest.getFormulaName().isBlank()) {
            if (product.getFormulaId() != null && !product.getFormulaId().isBlank()) {
                return product.getFormulaId();
            }
            String tenantId = TenantResolver.requireTenantId();
            List<String> productFormulas = formulaRepository.findByTenantIdAndProductId(tenantId, product.getId())
                    .stream()
                    .filter(formula -> formula.isActive())
                    .map(formula -> formula.getId())
                    .toList();
            if (productFormulas.size() == 1) {
                return productFormulas.get(0);
            }
            return null;
        }
        String tenantId = TenantResolver.requireTenantId();
        return formulaRepository.findByTenantIdAndNameIgnoreCase(tenantId, itemRequest.getFormulaName())
                .filter(formula -> product.getSectorId() == null
                        || formula.getSectorId() == null
                        || product.getSectorId().equals(formula.getSectorId()))
                .filter(formula -> formula.getProductId() == null
                        || formula.getProductId().equals(product.getId()))
                .map(formula -> formula.getId())
                .orElse(product.getFormulaId());
    }

    private JwtUser currentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getPrincipal() == null) {
            return null;
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof JwtUser jwtUser) {
            return jwtUser;
        }
        return null;
    }

    private void enforceUserOwnership(Quote quote) {
        JwtUser user = currentUser();
        if (user == null || user.getRole() != UserRole.STAFF) {
            return;
        }
        String tenantId = TenantResolver.requireTenantId();
        Customer customer = customerRepository.findByTenantIdAndUserId(tenantId, user.getUserId());
        if (customer == null) {
            customer = resolveCustomerForUser(tenantId, user);
        }
        if (customer == null || !customer.getId().equals(quote.getCustomerId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Quote not accessible");
        }
    }

    private Customer resolveCustomerForUser(String tenantId, JwtUser user) {
        Customer customer = customerRepository.findByTenantIdAndUserId(tenantId, user.getUserId());
        if (customer != null) {
            return customer;
        }
        if (user.getEmail() == null || user.getEmail().isBlank()) {
            return null;
        }
        customer = customerRepository.findByTenantIdAndEmailIgnoreCase(tenantId, user.getEmail());
        if (customer != null && (customer.getUserId() == null || customer.getUserId().isBlank())) {
            customer.setUserId(user.getUserId());
            customerRepository.save(customer);
        }
        return customer;
    }

    private Customer createCustomerForUser(String tenantId, JwtUser user) {
        Customer customer = new Customer();
        customer.setTenantId(tenantId);
        customer.setEmail(user.getEmail());
        customer.setName(user.getEmail());
        customer.setUserId(user.getUserId());
        return customerRepository.save(customer);
    }

    private Quote getQuoteOrThrow(String id) {
        String tenantId = TenantResolver.requireTenantId();
        Quote quote = quoteRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Quote not found"));
        if (!tenantId.equals(quote.getTenantId())) {
            throw new IllegalArgumentException("Quote not found");
        }
        return quote;
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

    private PriceResultDto toPriceResultDto(PriceResult result) {
        PriceResultDto dto = new PriceResultDto();
        dto.setBasePrice(result.getBasePrice());
        dto.setModifiers(result.getModifiers());
        dto.setTotal(result.getTotal());
        return dto;
    }

    private void ensurePdfAttachment(Quote quote) {
        List<QuoteAttachment> attachments = quoteAttachmentRepository.findByQuoteId(quote.getId());
        List<QuoteAttachment> pdfAttachments = attachments.stream()
                .filter(att -> {
                    String contentType = att.getContentType() == null ? "" : att.getContentType().toLowerCase();
                    String fileName = att.getFileName() == null ? "" : att.getFileName().toLowerCase();
                    String url = att.getUrl() == null ? "" : att.getUrl().toLowerCase();
                    return contentType.contains("pdf") || fileName.endsWith(".pdf") || url.endsWith(".pdf");
                })
                .toList();
        boolean hasValidPdf = pdfAttachments.stream()
                .anyMatch(att -> {
                    String url = att.getUrl() == null ? "" : att.getUrl().toLowerCase();
                    return url.contains("/raw/upload/");
                });
        if (hasValidPdf) {
            return;
        }
        List<QuoteAttachment> invalidPdfs = pdfAttachments.stream()
                .filter(att -> {
                    String url = att.getUrl() == null ? "" : att.getUrl().toLowerCase();
                    return url.contains("/image/upload/");
                })
                .toList();
        if (!invalidPdfs.isEmpty()) {
            quoteAttachmentRepository.deleteAll(invalidPdfs);
        }
        byte[] pdfBytes = quotePdfService.generatePdf(quote.getId());
        String fileName = "quote-" + quote.getId() + ".pdf";
        var upload = uploadService.uploadBytes(pdfBytes, fileName, "application/pdf", "presupuestos/quotes");
        QuoteAttachmentCreateRequest request = new QuoteAttachmentCreateRequest();
        request.setUrl(upload.getSecureUrl() != null ? upload.getSecureUrl() : upload.getUrl());
        request.setFileName(fileName);
        request.setContentType("application/pdf");
        quoteAttachmentService.create(quote.getId(), request);
    }
}
