package com.neria.presupuestos.service.quote;

import com.neria.presupuestos.model.entity.Customer;
import com.neria.presupuestos.model.entity.Material;
import com.neria.presupuestos.model.entity.Product;
import com.neria.presupuestos.model.entity.ProductOption;
import com.neria.presupuestos.model.entity.Quote;
import com.neria.presupuestos.model.entity.QuoteItem;
import com.neria.presupuestos.model.entity.QuoteItemOption;
import com.neria.presupuestos.model.entity.QuoteMaterial;
import com.neria.presupuestos.model.entity.Tenant;
import com.neria.presupuestos.repository.customer.CustomerRepository;
import com.neria.presupuestos.repository.product.ProductOptionRepository;
import com.neria.presupuestos.repository.product.ProductRepository;
import com.neria.presupuestos.repository.quote.QuoteItemOptionRepository;
import com.neria.presupuestos.repository.quote.QuoteItemRepository;
import com.neria.presupuestos.repository.quote.QuoteRepository;
import com.neria.presupuestos.repository.material.QuoteMaterialRepository;
import com.neria.presupuestos.repository.material.MaterialRepository;
import com.neria.presupuestos.repository.tenant.TenantRepository;
import com.neria.presupuestos.util.TenantResolver;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.graphics.image.LosslessFactory;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.URL;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class QuotePdfService {

    private final QuoteRepository quoteRepository;
    private final QuoteItemRepository quoteItemRepository;
    private final QuoteItemOptionRepository quoteItemOptionRepository;
    private final ProductRepository productRepository;
    private final ProductOptionRepository productOptionRepository;
    private final CustomerRepository customerRepository;
    private final TenantRepository tenantRepository;
    private final QuoteMaterialRepository quoteMaterialRepository;
    private final MaterialRepository materialRepository;

    public QuotePdfService(QuoteRepository quoteRepository,
                           QuoteItemRepository quoteItemRepository,
                           QuoteItemOptionRepository quoteItemOptionRepository,
                           ProductRepository productRepository,
                           ProductOptionRepository productOptionRepository,
                           CustomerRepository customerRepository,
                           TenantRepository tenantRepository,
                           QuoteMaterialRepository quoteMaterialRepository,
                           MaterialRepository materialRepository) {
        this.quoteRepository = quoteRepository;
        this.quoteItemRepository = quoteItemRepository;
        this.quoteItemOptionRepository = quoteItemOptionRepository;
        this.productRepository = productRepository;
        this.productOptionRepository = productOptionRepository;
        this.customerRepository = customerRepository;
        this.tenantRepository = tenantRepository;
        this.quoteMaterialRepository = quoteMaterialRepository;
        this.materialRepository = materialRepository;
    }

    public byte[] generatePdf(String quoteId) {
        Quote quote = getQuoteOrThrow(quoteId);
        Tenant tenant = loadTenant(quote.getTenantId());
        List<QuoteItem> items = quoteItemRepository.findByQuoteId(quote.getId());
        Map<String, String> productNames = loadProductNames(items, quote.getTenantId());
        Map<String, String> optionNames = loadOptionNames(items, quote.getTenantId());
        Map<String, List<QuoteItemOption>> optionsByItem = loadOptionsByItem(items);
        Map<String, List<QuoteMaterial>> materialsByItem = loadMaterialsByItem(items);
        Map<String, Material> materialsById = loadMaterialsById(materialsByItem);
        Customer customer = loadCustomer(quote.getCustomerId(), quote.getTenantId());

        try (PDDocument document = new PDDocument(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            PDPage page = new PDPage(PDRectangle.A4);
            document.addPage(page);

            try (PDPageContentStream content = new PDPageContentStream(document, page)) {
                float y = 770;

                if (tenant != null && tenant.getLogoUrl() != null && !tenant.getLogoUrl().isBlank()) {
                    try {
                        BufferedImage image = ImageIO.read(new URL(tenant.getLogoUrl()));
                        if (image != null) {
                            float targetWidth = 120f;
                            float ratio = targetWidth / image.getWidth();
                            int targetHeight = Math.max(1, Math.round(image.getHeight() * ratio));
                            BufferedImage scaled = new BufferedImage((int) targetWidth, targetHeight, BufferedImage.TYPE_INT_RGB);
                            scaled.getGraphics().drawImage(image, 0, 0, (int) targetWidth, targetHeight, null);
                            PDImageXObject pdImage = org.apache.pdfbox.pdmodel.graphics.image.JPEGFactory.createFromImage(document, scaled, 0.6f);
                            content.drawImage(pdImage, 50, y - targetHeight, targetWidth, targetHeight);
                        }
                    } catch (Exception ignored) {
                        // Ignore logo errors, continue without image
                    }
                }

                content.setFont(PDType1Font.HELVETICA_BOLD, 18);
                content.beginText();
                content.newLineAtOffset(200, y);
                content.showText("Presupuesto");
                content.endText();

                y -= 30;
                content.setFont(PDType1Font.HELVETICA, 12);
                content.beginText();
                content.newLineAtOffset(50, y);
                content.showText("ID: " + quote.getId());
                content.endText();

                y -= 18;
                content.beginText();
                content.newLineAtOffset(50, y);
                content.showText("Estado: " + quote.getStatus());
                content.endText();

                y -= 18;
                content.beginText();
                content.newLineAtOffset(50, y);
                String created = quote.getCreatedAt() == null ? "-" : quote.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE);
                content.showText("Fecha: " + created);
                content.endText();

                y -= 22;
                content.setFont(PDType1Font.HELVETICA_BOLD, 12);
                content.beginText();
                content.newLineAtOffset(50, y);
                content.showText("Empresa");
                content.endText();

                y -= 16;
                content.setFont(PDType1Font.HELVETICA, 11);
                content.beginText();
                content.newLineAtOffset(50, y);
                content.showText("Nombre: " + safe(tenant == null ? null : tenant.getName()));
                content.endText();

                y -= 14;
                content.beginText();
                content.newLineAtOffset(50, y);
                content.showText("Email: " + safe(tenant == null ? null : tenant.getCompanyEmail()));
                content.endText();

                y -= 14;
                content.beginText();
                content.newLineAtOffset(50, y);
                content.showText("Telefono: " + safe(tenant == null ? null : tenant.getCompanyPhone()));
                content.endText();

                y -= 14;
                content.beginText();
                content.newLineAtOffset(50, y);
                content.showText("Direccion: " + safe(tenant == null ? null : tenant.getCompanyAddress()));
                content.endText();

                y -= 20;
                content.setFont(PDType1Font.HELVETICA_BOLD, 12);
                content.beginText();
                content.newLineAtOffset(50, y);
                content.showText("Cliente");
                content.endText();

                y -= 16;
                content.setFont(PDType1Font.HELVETICA, 11);
                content.beginText();
                content.newLineAtOffset(50, y);
                content.showText("Nombre: " + (customer == null ? "-" : safe(customer.getName())));
                content.endText();

                y -= 14;
                content.beginText();
                content.newLineAtOffset(50, y);
                content.showText("Email: " + (customer == null ? "-" : safe(customer.getEmail())));
                content.endText();

                y -= 14;
                content.beginText();
                content.newLineAtOffset(50, y);
                content.showText("Telefono: " + (customer == null ? "-" : safe(customer.getPhone())));
                content.endText();

                y -= 24;
                content.setFont(PDType1Font.HELVETICA_BOLD, 12);
                content.beginText();
                content.newLineAtOffset(50, y);
                content.showText("Items");
                content.endText();

                y -= 18;
                content.setFont(PDType1Font.HELVETICA, 11);
                for (QuoteItem item : items) {
                    String productName = productNames.getOrDefault(item.getProductId(), item.getProductId());
                    content.beginText();
                    content.newLineAtOffset(50, y);
                    content.showText("Producto: " + productName);
                    content.endText();
                    y -= 14;
                    content.beginText();
                    content.newLineAtOffset(60, y);
                    content.showText("Cantidad: " + item.getQuantity() + " | Unit: " + item.getUnitPrice() + " | Total: " + item.getTotalPrice());
                    content.endText();
                    y -= 14;

                    List<QuoteItemOption> itemOptions = optionsByItem.getOrDefault(item.getId(), List.of());
                    for (QuoteItemOption option : itemOptions) {
                        String optionName = optionNames.getOrDefault(option.getOptionId(), option.getOptionId());
                        String value = option.getValue() == null ? "" : option.getValue();
                        content.beginText();
                        content.newLineAtOffset(70, y);
                        content.showText("- " + optionName + ": " + value);
                        content.endText();
                        y -= 12;
                    }

                    List<QuoteMaterial> itemMaterials = materialsByItem.getOrDefault(item.getId(), List.of());
                    if (!itemMaterials.isEmpty()) {
                        content.beginText();
                        content.newLineAtOffset(70, y);
                        content.showText("Materiales:");
                        content.endText();
                        y -= 12;
                        for (QuoteMaterial material : itemMaterials) {
                            Material mat = materialsById.get(material.getMaterialId());
                            String matName = mat == null ? material.getMaterialId() : safe(mat.getName());
                            String matUnit = mat == null ? "" : safe(mat.getUnit());
                            String qty = formatQuantity(material.getQuantity());
                            String unitCost = formatMoney(material.getUnitCost());
                            String totalCost = formatMoney(material.getTotalCost());
                            content.beginText();
                            content.newLineAtOffset(80, y);
                            content.showText("- " + matName + ": " + qty + " " + matUnit
                                    + " x " + unitCost + " = " + totalCost + " EUR");
                            content.endText();
                            y -= 12;
                        }
                    }

                    y -= 8;
                }

                BigDecimal subtotal = items.stream()
                        .map(this::resolveItemTotal)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                BigDecimal discount = BigDecimal.ZERO;
                BigDecimal vat = subtotal.multiply(new BigDecimal("0.21"));
                BigDecimal total = subtotal.subtract(discount).add(vat);

                y -= 8;
                content.setFont(PDType1Font.HELVETICA_BOLD, 12);
                content.beginText();
                content.newLineAtOffset(50, y);
                content.showText("Resumen");
                content.endText();

                y -= 16;
                content.setFont(PDType1Font.HELVETICA, 11);
                content.beginText();
                content.newLineAtOffset(50, y);
                content.showText("Subtotal: " + formatMoney(subtotal) + " EUR");
                content.endText();

                y -= 14;
                content.beginText();
                content.newLineAtOffset(50, y);
                content.showText("Descuento: " + formatMoney(discount) + " EUR");
                content.endText();

                y -= 14;
                content.beginText();
                content.newLineAtOffset(50, y);
                content.showText("IVA (21%): " + formatMoney(vat) + " EUR");
                content.endText();

                y -= 16;
                content.setFont(PDType1Font.HELVETICA_BOLD, 12);
                content.beginText();
                content.newLineAtOffset(50, y);
                content.showText("Total: " + formatMoney(total) + " EUR");
                content.endText();
            }

            document.save(out);
            return out.toByteArray();
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to generate PDF", ex);
        }
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

    private Tenant loadTenant(String tenantId) {
        return tenantRepository.findById(tenantId).orElse(null);
    }

    private Map<String, String> loadProductNames(List<QuoteItem> items, String tenantId) {
        List<String> productIds = items.stream()
                .map(QuoteItem::getProductId)
                .filter(id -> id != null && !id.isBlank())
                .distinct()
                .toList();
        if (productIds.isEmpty()) {
            return Map.of();
        }
        List<Product> products = productRepository.findAllById(productIds);
        return products.stream()
                .filter(product -> tenantId.equals(product.getTenantId()))
                .collect(Collectors.toMap(Product::getId, Product::getName, (a, b) -> a, HashMap::new));
    }

    private Map<String, String> loadOptionNames(List<QuoteItem> items, String tenantId) {
        List<String> optionIds = loadOptionsByItem(items).values().stream()
                .flatMap(List::stream)
                .map(QuoteItemOption::getOptionId)
                .filter(id -> id != null && !id.isBlank())
                .distinct()
                .toList();
        if (optionIds.isEmpty()) {
            return Map.of();
        }
        List<ProductOption> options = productOptionRepository.findAllById(optionIds);
        return options.stream()
                .collect(Collectors.toMap(ProductOption::getId, ProductOption::getName, (a, b) -> a, HashMap::new));
    }

    private Map<String, List<QuoteItemOption>> loadOptionsByItem(List<QuoteItem> items) {
        List<String> itemIds = items.stream()
                .map(QuoteItem::getId)
                .toList();
        if (itemIds.isEmpty()) {
            return Map.of();
        }
        List<QuoteItemOption> options = quoteItemOptionRepository.findByQuoteItemIdIn(itemIds);
        Map<String, List<QuoteItemOption>> map = new HashMap<>();
        for (QuoteItemOption option : options) {
            map.computeIfAbsent(option.getQuoteItemId(), key -> new java.util.ArrayList<>()).add(option);
        }
        return map;
    }

    private Map<String, List<QuoteMaterial>> loadMaterialsByItem(List<QuoteItem> items) {
        List<String> itemIds = items.stream()
                .map(QuoteItem::getId)
                .toList();
        if (itemIds.isEmpty()) {
            return Map.of();
        }
        List<QuoteMaterial> materials = quoteMaterialRepository.findByQuoteItemIdIn(itemIds);
        Map<String, List<QuoteMaterial>> map = new HashMap<>();
        for (QuoteMaterial material : materials) {
            map.computeIfAbsent(material.getQuoteItemId(), key -> new java.util.ArrayList<>()).add(material);
        }
        return map;
    }

    private Map<String, Material> loadMaterialsById(Map<String, List<QuoteMaterial>> materialsByItem) {
        List<String> materialIds = materialsByItem.values().stream()
                .flatMap(List::stream)
                .map(QuoteMaterial::getMaterialId)
                .distinct()
                .toList();
        if (materialIds.isEmpty()) {
            return Map.of();
        }
        return materialRepository.findAllById(materialIds)
                .stream()
                .collect(Collectors.toMap(Material::getId, material -> material, (a, b) -> a, HashMap::new));
    }

    private Customer loadCustomer(String customerId, String tenantId) {
        if (customerId == null || customerId.isBlank()) {
            return null;
        }
        return customerRepository.findById(customerId)
                .filter(customer -> tenantId.equals(customer.getTenantId()))
                .orElse(null);
    }

    private String safe(String value) {
        return value == null || value.isBlank() ? "-" : value;
    }

    private BigDecimal resolveItemTotal(QuoteItem item) {
        if (item.getTotalPrice() != null) {
            return item.getTotalPrice();
        }
        BigDecimal unit = item.getUnitPrice() == null ? BigDecimal.ZERO : item.getUnitPrice();
        int qty = item.getQuantity() == null ? 1 : item.getQuantity();
        return unit.multiply(BigDecimal.valueOf(qty));
    }

    private String formatMoney(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP).toPlainString();
    }

    private String formatQuantity(BigDecimal value) {
        if (value == null) {
            return "0";
        }
        return value.setScale(4, RoundingMode.HALF_UP).stripTrailingZeros().toPlainString();
    }
}
