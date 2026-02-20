package com.neria.manager.subscriptions;

import com.neria.manager.auth.TenantServiceApiKeysService;
import com.neria.manager.common.entities.AdminUser;
import com.neria.manager.common.entities.ServiceCatalog;
import com.neria.manager.common.entities.Subscription;
import com.neria.manager.common.entities.SubscriptionHistory;
import com.neria.manager.common.entities.SubscriptionPaymentRequest;
import com.neria.manager.common.entities.SubscriptionService;
import com.neria.manager.common.entities.TenantInvoice;
import com.neria.manager.common.entities.TenantInvoiceItem;
import com.neria.manager.common.repos.AdminUserRepository;
import com.neria.manager.common.repos.ServiceCatalogRepository;
import com.neria.manager.common.repos.SubscriptionHistoryRepository;
import com.neria.manager.common.repos.SubscriptionPaymentRequestRepository;
import com.neria.manager.common.repos.SubscriptionRepository;
import com.neria.manager.common.repos.SubscriptionServiceRepository;
import com.neria.manager.common.repos.TenantInvoiceItemRepository;
import com.neria.manager.common.repos.TenantInvoiceRepository;
import com.neria.manager.common.repos.TenantServiceConfigRepository;
import com.neria.manager.common.repos.TenantServiceEndpointRepository;
import com.neria.manager.common.repos.TenantServiceUserRepository;
import com.neria.manager.common.services.EmailService;
import com.neria.manager.tenants.TenantsService;
import com.stripe.Stripe;
import com.stripe.model.Event;
import com.stripe.model.Invoice;
import com.stripe.model.StripeObject;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import com.stripe.param.checkout.SessionCreateParams;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class SubscriptionsService {
  private static final Logger log = LoggerFactory.getLogger(SubscriptionsService.class);
  private final SubscriptionRepository subscriptionRepository;
  private final SubscriptionServiceRepository subscriptionServiceRepository;
  private final SubscriptionHistoryRepository subscriptionHistoryRepository;
  private final SubscriptionPaymentRequestRepository paymentRepository;
  private final TenantServiceApiKeysService tenantServiceApiKeysService;
  private final ServiceCatalogRepository catalogRepository;
  private final TenantInvoiceRepository invoiceRepository;
  private final TenantInvoiceItemRepository invoiceItemRepository;
  private final TenantServiceConfigRepository tenantServiceConfigRepository;
  private final TenantServiceEndpointRepository tenantServiceEndpointRepository;
  private final TenantServiceUserRepository tenantServiceUserRepository;
  private final TenantsService tenantsService;
  private final EmailService emailService;
  private final AdminUserRepository adminUserRepository;

  public SubscriptionsService(
      SubscriptionRepository subscriptionRepository,
      SubscriptionServiceRepository subscriptionServiceRepository,
      SubscriptionHistoryRepository subscriptionHistoryRepository,
      SubscriptionPaymentRequestRepository paymentRepository,
      TenantServiceApiKeysService tenantServiceApiKeysService,
      ServiceCatalogRepository catalogRepository,
      TenantInvoiceRepository invoiceRepository,
      TenantInvoiceItemRepository invoiceItemRepository,
      TenantServiceConfigRepository tenantServiceConfigRepository,
      TenantServiceEndpointRepository tenantServiceEndpointRepository,
      TenantServiceUserRepository tenantServiceUserRepository,
      TenantsService tenantsService,
      EmailService emailService,
      AdminUserRepository adminUserRepository) {
    this.subscriptionRepository = subscriptionRepository;
    this.subscriptionServiceRepository = subscriptionServiceRepository;
    this.subscriptionHistoryRepository = subscriptionHistoryRepository;
    this.paymentRepository = paymentRepository;
    this.tenantServiceApiKeysService = tenantServiceApiKeysService;
    this.catalogRepository = catalogRepository;
    this.invoiceRepository = invoiceRepository;
    this.invoiceItemRepository = invoiceItemRepository;
    this.tenantServiceConfigRepository = tenantServiceConfigRepository;
    this.tenantServiceEndpointRepository = tenantServiceEndpointRepository;
    this.tenantServiceUserRepository = tenantServiceUserRepository;
    this.tenantsService = tenantsService;
    this.emailService = emailService;
    this.adminUserRepository = adminUserRepository;
  }

  private LocalDateTime buildPeriodEnd(LocalDateTime start, String period) {
    return "annual".equals(period) ? start.plusYears(1) : start.plusMonths(1);
  }

  private int countPeriods(LocalDateTime start, LocalDateTime end, String period) {
    if (end.isBefore(start)) {
      return 0;
    }
    if ("annual".equals(period)) {
      int years = end.getYear() - start.getYear();
      boolean reached =
          end.getMonthValue() > start.getMonthValue()
              || (end.getMonthValue() == start.getMonthValue()
                  && end.getDayOfMonth() >= start.getDayOfMonth());
      return years + (reached ? 1 : 0);
    }
    int months = (end.getYear() - start.getYear()) * 12 + (end.getMonthValue() - start.getMonthValue());
    boolean reached = end.getDayOfMonth() >= start.getDayOfMonth();
    return months + (reached ? 1 : 0);
  }

  private void reconcileServiceStates(String subscriptionId) {
    LocalDateTime now = LocalDateTime.now();
    List<SubscriptionService> pending =
        subscriptionServiceRepository.findBySubscriptionId(subscriptionId).stream()
            .filter(item -> "pending".equals(item.getStatus()))
            .filter(item -> item.getActivateAt() != null && !item.getActivateAt().isAfter(now))
            .toList();
    if (!pending.isEmpty()) {
      pending.forEach(item -> {
        item.setStatus("active");
        item.setActivateAt(null);
      });
      subscriptionServiceRepository.saveAll(pending);
    }

    List<SubscriptionService> pendingRemoval =
        subscriptionServiceRepository.findBySubscriptionId(subscriptionId).stream()
            .filter(item -> "pending_removal".equals(item.getStatus()))
            .filter(item -> item.getDeactivateAt() != null && !item.getDeactivateAt().isAfter(now))
            .toList();
    if (!pendingRemoval.isEmpty()) {
      subscriptionServiceRepository.deleteAll(pendingRemoval);
    }
  }

  private Map<String, Object> buildResponse(Subscription subscription) {
    if (subscription == null) {
      Map<String, Object> empty = new HashMap<>();
      empty.put("subscription", null);
      empty.put("services", List.of());
      empty.put("totals", null);
      return empty;
    }

    reconcileServiceStates(subscription.getId());

    List<SubscriptionService> services =
        subscriptionServiceRepository.findBySubscriptionId(subscription.getId());
    Map<String, ServiceCatalog> catalogMap =
        services.isEmpty()
            ? Map.of()
            : catalogRepository.findAllById(
                    services.stream().map(SubscriptionService::getServiceCode).distinct().toList())
                .stream()
                .collect(Collectors.toMap(ServiceCatalog::getCode, item -> item, (a, b) -> a));

    List<SubscriptionService> activeServices =
        services.stream()
            .filter(item -> "active".equals(item.getStatus()) || "pending_removal".equals(item.getStatus()))
            .toList();
    BigDecimal servicesTotal =
        activeServices.stream()
            .map(item -> toMoney(item.getPriceEur()))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    BigDecimal basePrice = toMoney(subscription.getBasePriceEur());
    BigDecimal subtotal = basePrice.add(servicesTotal);
    TaxBreakdown tax = computeTax(subtotal, null);
    BigDecimal totalWithTax = tax.totalEur();
    LocalDateTime endDate =
        "cancelled".equals(subscription.getStatus())
            ? subscription.getCurrentPeriodEnd()
            : LocalDateTime.now();
    int periods =
        "pending".equals(subscription.getStatus())
            ? 0
            : countPeriods(subscription.getCurrentPeriodStart(), endDate, subscription.getPeriod());
    BigDecimal billedSinceStart =
        totalWithTax.multiply(BigDecimal.valueOf(periods)).setScale(2, RoundingMode.HALF_UP);

    List<Map<String, Object>> responseServices =
        services.stream()
            .map(
                item -> {
                  ServiceCatalog catalog = catalogMap.get(item.getServiceCode());
                  Map<String, Object> row = new HashMap<>();
                  row.put("serviceCode", item.getServiceCode());
                  row.put("status", item.getStatus());
                  row.put("activateAt", item.getActivateAt());
                  row.put("deactivateAt", item.getDeactivateAt());
                  row.put("priceEur", item.getPriceEur());
                  row.put("name", catalog != null ? catalog.getName() : null);
                  row.put("description", catalog != null ? catalog.getDescription() : null);
                  row.put("priceMonthlyEur", catalog != null ? catalog.getPriceMonthlyEur() : null);
                  row.put("priceAnnualEur", catalog != null ? catalog.getPriceAnnualEur() : null);
                  return row;
                })
            .toList();

    Map<String, Object> totals =
        Map.of(
            "basePriceEur",
            basePrice,
            "servicesPriceEur",
            servicesTotal,
            "subtotalEur",
            subtotal,
            "taxRate",
            tax.rate(),
            "taxEur",
            tax.taxEur(),
            "totalEur",
            totalWithTax,
            "billedSinceStartEur",
            billedSinceStart);

    return Map.of("subscription", subscription, "services", responseServices, "totals", totals);
  }

  private String getBillingMode() {
    String explicit = System.getenv("BILLING_PAYMENT_MODE");
    if ("stripe".equalsIgnoreCase(explicit) || "mock".equalsIgnoreCase(explicit)) {
      return explicit.toLowerCase();
    }
    String env = System.getenv().getOrDefault("APP_ENV", "development");
    return "production".equalsIgnoreCase(env) ? "stripe" : "mock";
  }

  private LocalDateTime getPaymentExpiresAt() {
    int ttlHours = Integer.parseInt(System.getenv().getOrDefault("SUBSCRIPTION_PAYMENT_TTL_HOURS", "48"));
    return LocalDateTime.now().plusHours(ttlHours);
  }

  private String hashToken(String token) {
    try {
      MessageDigest digest = MessageDigest.getInstance("SHA-256");
      byte[] hashed = digest.digest(token.getBytes(java.nio.charset.StandardCharsets.UTF_8));
      return Base64.getEncoder().encodeToString(hashed);
    } catch (Exception ex) {
      throw new IllegalStateException("Unable to hash token", ex);
    }
  }

  private BigDecimal resolveTaxRate() {
    String raw = System.getenv().getOrDefault("BILLING_TAX_RATE", "0.21");
    try {
      BigDecimal rate = new BigDecimal(raw.trim());
      if (rate.compareTo(BigDecimal.ONE) > 0) {
        rate = rate.divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
      }
      if (rate.compareTo(BigDecimal.ZERO) < 0) {
        return BigDecimal.ZERO.setScale(4, RoundingMode.HALF_UP);
      }
      return rate.setScale(4, RoundingMode.HALF_UP);
    } catch (Exception ex) {
      return BigDecimal.ZERO.setScale(4, RoundingMode.HALF_UP);
    }
  }

  private BigDecimal toMoney(BigDecimal value) {
    if (value == null) {
      return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
    }
    return value.setScale(2, RoundingMode.HALF_UP);
  }

  private long toStripeAmount(BigDecimal value) {
    return toMoney(value).multiply(BigDecimal.valueOf(100)).setScale(0, RoundingMode.HALF_UP).longValue();
  }

  private TaxBreakdown computeTax(BigDecimal subtotal, BigDecimal totalOverride) {
    BigDecimal safeSubtotal = toMoney(subtotal);
    BigDecimal taxRate = resolveTaxRate();
    BigDecimal taxEur;
    BigDecimal total;
    if (totalOverride != null) {
      total = toMoney(totalOverride);
      taxEur = toMoney(total.subtract(safeSubtotal).max(BigDecimal.ZERO));
      if (safeSubtotal.compareTo(BigDecimal.ZERO) > 0) {
        taxRate = taxEur.divide(safeSubtotal, 4, RoundingMode.HALF_UP);
      }
    } else {
      taxEur = toMoney(safeSubtotal.multiply(taxRate));
      total = toMoney(safeSubtotal.add(taxEur));
    }
    return new TaxBreakdown(taxRate, taxEur, total);
  }

  private record TaxBreakdown(BigDecimal rate, BigDecimal taxEur, BigDecimal totalEur) {}

  private Session createStripeCheckoutSession(
      String tenantId,
      String tenantName,
      String email,
      String period,
      BigDecimal basePriceEur,
      List<ServiceSummary> services,
      String paymentRequestId,
      String subscriptionId) {
    String secret = System.getenv("STRIPE_SECRET_KEY");
    if (secret == null || secret.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Stripe not configured");
    }
    Stripe.apiKey = secret;
    String successUrl =
        System.getenv().getOrDefault(
            "STRIPE_SUCCESS_URL",
            System.getenv("FRONTEND_BASE_URL") + "/billing/success?session_id={CHECKOUT_SESSION_ID}");
    String cancelUrl =
        System.getenv().getOrDefault(
            "STRIPE_CANCEL_URL", System.getenv("FRONTEND_BASE_URL") + "/billing/cancel");

    BigDecimal base = toMoney(basePriceEur);
    BigDecimal servicesTotal = servicesTotalAmount(services);
    BigDecimal subtotal = base.add(servicesTotal);
    TaxBreakdown tax = computeTax(subtotal, null);

    SessionCreateParams.LineItem.PriceData.Recurring.Interval interval =
        "annual".equals(period)
            ? SessionCreateParams.LineItem.PriceData.Recurring.Interval.YEAR
            : SessionCreateParams.LineItem.PriceData.Recurring.Interval.MONTH;
    SessionCreateParams.LineItem.PriceData.Recurring recurring =
        SessionCreateParams.LineItem.PriceData.Recurring.builder().setInterval(interval).build();

    List<SessionCreateParams.LineItem> lineItems = new ArrayList<>();
    if (base.compareTo(BigDecimal.ZERO) > 0) {
      lineItems.add(
          SessionCreateParams.LineItem.builder()
              .setQuantity(1L)
              .setPriceData(
                  SessionCreateParams.LineItem.PriceData.builder()
                      .setCurrency("eur")
                      .setUnitAmount(toStripeAmount(base))
                      .setRecurring(recurring)
                      .setProductData(
                          SessionCreateParams.LineItem.PriceData.ProductData.builder()
                              .setName("Suscripción base (" + period + ")")
                              .build())
                      .build())
              .build());
    }
    for (ServiceSummary service : services) {
      BigDecimal price = toMoney(BigDecimal.valueOf(service.priceEur));
      if (price.compareTo(BigDecimal.ZERO) <= 0) {
        continue;
      }
      lineItems.add(
          SessionCreateParams.LineItem.builder()
              .setQuantity(1L)
              .setPriceData(
                  SessionCreateParams.LineItem.PriceData.builder()
                      .setCurrency("eur")
                      .setUnitAmount(toStripeAmount(price))
                      .setRecurring(recurring)
                      .setProductData(
                          SessionCreateParams.LineItem.PriceData.ProductData.builder()
                              .setName(service.name)
                              .build())
                      .build())
              .build());
    }
    if (tax.taxEur().compareTo(BigDecimal.ZERO) > 0) {
      String taxLabel = "Impuesto (" + tax.rate().multiply(BigDecimal.valueOf(100)).setScale(0, RoundingMode.HALF_UP) + "%)";
      lineItems.add(
          SessionCreateParams.LineItem.builder()
              .setQuantity(1L)
              .setPriceData(
                  SessionCreateParams.LineItem.PriceData.builder()
                      .setCurrency("eur")
                      .setUnitAmount(toStripeAmount(tax.taxEur()))
                      .setRecurring(recurring)
                      .setProductData(
                          SessionCreateParams.LineItem.PriceData.ProductData.builder()
                              .setName(taxLabel)
                              .build())
                      .build())
              .build());
    }

    SessionCreateParams params =
        SessionCreateParams.builder()
            .setMode(SessionCreateParams.Mode.SUBSCRIPTION)
            .setCustomerEmail(email)
            .setSuccessUrl(successUrl)
            .setCancelUrl(cancelUrl)
            .addAllLineItem(lineItems)
            .putMetadata("paymentRequestId", paymentRequestId)
            .putMetadata("tenantName", tenantName)
            .putMetadata("tenantId", tenantId)
            .putMetadata("subscriptionId", subscriptionId)
            .build();

    try {
      return Session.create(params);
    } catch (Exception ex) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Stripe session failed");
    }
  }

  private SubscriptionPaymentRequest createPaymentRequest(
      String tenantId,
      String subscriptionId,
      String email,
      BigDecimal basePriceEur,
      List<ServiceSummary> services,
      String tenantName,
      String period) {
    BigDecimal base = toMoney(basePriceEur);
    BigDecimal servicesTotal = servicesTotalAmount(services);
    BigDecimal subtotal = base.add(servicesTotal);
    TaxBreakdown tax = computeTax(subtotal, null);
    BigDecimal total = tax.totalEur();

    String token = UUID.randomUUID().toString().replace("-", "");
    String tokenHash = hashToken(token);
    String provider = getBillingMode();
    SubscriptionPaymentRequest payment = new SubscriptionPaymentRequest();
    payment.setId(UUID.randomUUID().toString());
    payment.setTenantId(tenantId);
    payment.setSubscriptionId(subscriptionId);
    payment.setEmail(email);
    payment.setStatus("pending");
    payment.setProvider(provider);
    payment.setTokenHash(tokenHash);
    payment.setAmountEur(total);
    payment.setExpiresAt(getPaymentExpiresAt());
    payment.setCreatedAt(LocalDateTime.now());
    payment.setUpdatedAt(LocalDateTime.now());
    paymentRepository.save(payment);

    String paymentUrl =
        System.getenv("FRONTEND_BASE_URL") + "/billing/confirm?token=" + token;

    if ("stripe".equals(provider)) {
      Session session =
          createStripeCheckoutSession(
              tenantId,
              tenantName,
              email,
              period,
              base,
              services,
              payment.getId(),
              subscriptionId);
      payment.setProviderRef(session.getId());
      paymentRepository.save(payment);
      if (session.getUrl() != null) {
        paymentUrl = session.getUrl();
      }
    }

    emailService.sendSubscriptionPaymentEmail(email, paymentUrl, tenantName, total.doubleValue());
    return payment;
  }

  private double servicesTotal(List<ServiceSummary> services) {
    return servicesTotalAmount(services).doubleValue();
  }

  private BigDecimal servicesTotalAmount(List<ServiceSummary> services) {
    return services.stream()
        .map(item -> toMoney(BigDecimal.valueOf(item.priceEur)))
        .reduce(BigDecimal.ZERO, BigDecimal::add);
  }

  private void notifyAdminsServiceAssigned(String tenantId, String tenantName, List<ServiceCatalog> services) {
    if (services == null || services.isEmpty()) {
      return;
    }
    List<String> recipients =
        adminUserRepository.findByRoleIgnoreCaseAndStatusIgnoreCase("admin", "active").stream()
            .map(AdminUser::getEmail)
            .filter(email -> email != null && !email.isBlank())
            .distinct()
            .toList();
    if (recipients.isEmpty()) {
      return;
    }
    String subject = "Nuevo servicio asignado";
    String headerName = tenantName != null && !tenantName.isBlank() ? tenantName : tenantId;
    StringBuilder body = new StringBuilder();
    body.append("Se han asignado nuevos servicios a un tenant.\\n\\n");
    body.append("Tenant: ").append(headerName).append("\\n");
    body.append("ID: ").append(tenantId).append("\\n\\n");
    body.append("Servicios:\\n");
    for (ServiceCatalog service : services) {
      String label =
          service.getName() != null && !service.getName().isBlank()
              ? service.getName()
              : service.getCode();
      body.append("- ").append(label).append(" (").append(service.getCode()).append(")\\n");
    }
    emailService.sendGeneric(recipients, subject, body.toString());
  }

  public Map<String, Object> getByTenantId(String tenantId) {
    var tenant = tenantsService.getById(tenantId);
    if (tenant == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Tenant not found");
    }
    Optional<Subscription> subscription = subscriptionRepository.findByTenantId(tenantId);
    return buildResponse(subscription.orElse(null));
  }

  public Map<String, Object> create(String tenantId, CreateSubscriptionRequest dto) {
    var tenant = tenantsService.getById(tenantId);
    if (tenant == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Tenant not found");
    }
    if (tenant.getBillingEmail() == null || tenant.getBillingEmail().isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tenant billing email required");
    }

    Optional<Subscription> existingOpt = subscriptionRepository.findByTenantId(tenantId);
    if (existingOpt.isPresent() && !"cancelled".equals(existingOpt.get().getStatus())) {
      return update(
          tenantId,
          new UpdateSubscriptionRequest(dto.period, dto.basePriceEur, dto.serviceCodes, null, dto.cancelAtPeriodEnd));
    }

    Set<String> codes = dto.serviceCodes != null ? Set.copyOf(dto.serviceCodes) : Set.of();
    if (!codes.isEmpty()) {
      List<ServiceCatalog> catalog = catalogRepository.findAllByCodeIn(List.copyOf(codes));
      if (catalog.size() != codes.size()) {
        Set<String> found =
            catalog.stream().map(ServiceCatalog::getCode).collect(Collectors.toSet());
        Set<String> missing =
            codes.stream().filter(code -> !found.contains(code)).collect(Collectors.toSet());
        throw new ResponseStatusException(
            HttpStatus.NOT_FOUND,
            "One or more services not found: " + String.join(", ", missing));
      }
    }

    LocalDateTime now = LocalDateTime.now();
    Subscription subscription;
    if (existingOpt.isPresent()) {
      Subscription existing = existingOpt.get();
      existing.setStatus("pending");
      existing.setPeriod(dto.period);
      existing.setBasePriceEur(dto.basePriceEur);
      existing.setCurrency("EUR");
      existing.setCurrentPeriodStart(now);
      existing.setCurrentPeriodEnd(buildPeriodEnd(now, dto.period));
      existing.setCancelAtPeriodEnd(false);
      existing.setUpdatedAt(LocalDateTime.now());
      subscription = subscriptionRepository.save(existing);
      subscriptionServiceRepository.deleteAll(
          subscriptionServiceRepository.findBySubscriptionId(existing.getId()));
    } else {
      Subscription created = new Subscription();
      created.setId(UUID.randomUUID().toString());
      created.setTenantId(tenantId);
      created.setStatus("pending");
      created.setPeriod(dto.period);
      created.setBasePriceEur(dto.basePriceEur);
      created.setCurrency("EUR");
      created.setCurrentPeriodStart(now);
      created.setCurrentPeriodEnd(buildPeriodEnd(now, dto.period));
      created.setCancelAtPeriodEnd(false);
      created.setCreatedAt(LocalDateTime.now());
      created.setUpdatedAt(LocalDateTime.now());
      subscription = subscriptionRepository.save(created);
    }

    if (!codes.isEmpty()) {
      List<ServiceCatalog> catalog = catalogRepository.findAllByCodeIn(List.copyOf(codes));
      List<SubscriptionService> rows = new ArrayList<>();
      for (ServiceCatalog service : catalog) {
        SubscriptionService entry = new SubscriptionService();
        entry.setId(UUID.randomUUID().toString());
        entry.setSubscriptionId(subscription.getId());
        entry.setServiceCode(service.getCode());
        entry.setStatus("pending");
        entry.setActivateAt(null);
        entry.setDeactivateAt(null);
        entry.setPriceEur(
            "annual".equals(dto.period) ? service.getPriceAnnualEur() : service.getPriceMonthlyEur());
        entry.setCreatedAt(LocalDateTime.now());
        entry.setUpdatedAt(LocalDateTime.now());
        rows.add(entry);
      }
      subscriptionServiceRepository.saveAll(rows);
      tenantServiceApiKeysService.ensureKeys(tenantId, List.copyOf(codes));
      notifyAdminsServiceAssigned(tenantId, tenant.getName(), catalog);
    }

    List<ServiceSummary> servicesSummary =
        codes.isEmpty()
            ? List.of()
            : catalogRepository.findAllByCodeIn(List.copyOf(codes)).stream()
                .map(
                    service ->
                        new ServiceSummary(
                            service.getName(),
                            "annual".equals(dto.period)
                                ? service.getPriceAnnualEur().doubleValue()
                                : service.getPriceMonthlyEur().doubleValue()))
                .toList();
    SubscriptionPaymentRequest payment =
        createPaymentRequest(
        tenantId,
        subscription.getId(),
        tenant.getBillingEmail(),
        dto.basePriceEur,
        servicesSummary,
        tenant.getName(),
        dto.period);

    createInitialInvoice(payment, subscription);

    return buildResponse(subscription);
  }

  public Map<String, Object> update(String tenantId, UpdateSubscriptionRequest dto) {
    Subscription subscription =
        subscriptionRepository
            .findByTenantId(tenantId)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Subscription not found"));
    String previousStatus = subscription.getStatus();
    boolean wasCancelAtPeriodEnd = subscription.isCancelAtPeriodEnd();
    LocalDateTime now = LocalDateTime.now();
    if (dto.cancelAtPeriodEnd != null
        && !dto.cancelAtPeriodEnd
        && wasCancelAtPeriodEnd) {
      LocalDateTime periodEnd = subscription.getCurrentPeriodEnd();
      if (!"active".equals(subscription.getStatus())
          || periodEnd == null
          || !now.isBefore(periodEnd)) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Subscription period ended");
      }
    }

    if (dto.period != null && !dto.period.equals(subscription.getPeriod())) {
      subscription.setPeriod(dto.period);
      subscription.setCurrentPeriodEnd(buildPeriodEnd(subscription.getCurrentPeriodStart(), dto.period));
    }
    if (dto.basePriceEur != null) {
      subscription.setBasePriceEur(dto.basePriceEur);
    }
    if (dto.status != null) {
      subscription.setStatus(dto.status);
    }
    if (dto.cancelAtPeriodEnd != null) {
      subscription.setCancelAtPeriodEnd(dto.cancelAtPeriodEnd);
    }
    subscription.setUpdatedAt(LocalDateTime.now());
    subscriptionRepository.save(subscription);

    if (dto.status != null && !dto.status.equals(previousStatus)) {
      if ("pending".equals(dto.status)) {
        List<SubscriptionService> allServices =
            subscriptionServiceRepository.findBySubscriptionId(subscription.getId());
        if (!allServices.isEmpty()) {
          allServices.forEach(item -> {
            item.setStatus("pending");
            item.setActivateAt(null);
            item.setDeactivateAt(null);
            item.setUpdatedAt(LocalDateTime.now());
          });
          subscriptionServiceRepository.saveAll(allServices);
        }
      } else if ("active".equals(dto.status)) {
        if (previousStatus == null || !"active".equals(previousStatus)) {
          if (subscription.getCurrentPeriodEnd() == null || now.isAfter(subscription.getCurrentPeriodEnd())) {
            subscription.setCurrentPeriodStart(now);
            subscription.setCurrentPeriodEnd(buildPeriodEnd(now, subscription.getPeriod()));
            subscription.setUpdatedAt(LocalDateTime.now());
            subscriptionRepository.save(subscription);
          }
        }
        List<SubscriptionService> toActivate =
            subscriptionServiceRepository.findBySubscriptionId(subscription.getId()).stream()
                .filter(item -> "pending".equals(item.getStatus()))
                .toList();
        if (!toActivate.isEmpty()) {
          toActivate.forEach(item -> {
            item.setStatus("active");
            item.setActivateAt(null);
            item.setUpdatedAt(LocalDateTime.now());
          });
          subscriptionServiceRepository.saveAll(toActivate);
        }
      }
    }

    if (dto.cancelAtPeriodEnd != null && dto.cancelAtPeriodEnd) {
      List<SubscriptionService> allServices =
          subscriptionServiceRepository.findBySubscriptionId(subscription.getId());
      if (!allServices.isEmpty()) {
        LocalDateTime deactivateAt =
            now.isBefore(subscription.getCurrentPeriodEnd())
                ? subscription.getCurrentPeriodEnd()
                : now;
        allServices.forEach(item -> {
          item.setStatus("pending_removal");
          item.setDeactivateAt(deactivateAt);
          item.setUpdatedAt(LocalDateTime.now());
        });
        subscriptionServiceRepository.saveAll(allServices);
      }
    }
    if (dto.cancelAtPeriodEnd != null
        && !dto.cancelAtPeriodEnd
        && wasCancelAtPeriodEnd
        && "active".equals(subscription.getStatus())) {
      List<SubscriptionService> toRestore =
          subscriptionServiceRepository.findBySubscriptionId(subscription.getId()).stream()
              .filter(item -> "pending_removal".equals(item.getStatus()))
              .toList();
      if (!toRestore.isEmpty()) {
        toRestore.forEach(item -> {
          item.setStatus("active");
          item.setDeactivateAt(null);
          item.setUpdatedAt(LocalDateTime.now());
        });
        subscriptionServiceRepository.saveAll(toRestore);
      }
    }

    if (dto.removeServiceCodes != null && !dto.removeServiceCodes.isEmpty()) {
      Set<String> uniqueCodes = Set.copyOf(dto.removeServiceCodes);
      List<SubscriptionService> existingToRemove =
          subscriptionServiceRepository.findBySubscriptionId(subscription.getId()).stream()
              .filter(item -> uniqueCodes.contains(item.getServiceCode()))
              .toList();
      if (!existingToRemove.isEmpty()) {
        boolean shouldSchedule =
            "active".equals(subscription.getStatus()) && now.isBefore(subscription.getCurrentPeriodEnd());
        List<SubscriptionService> toSchedule = new ArrayList<>(existingToRemove);
        if (!toSchedule.isEmpty()) {
          LocalDateTime deactivateAt =
              shouldSchedule ? subscription.getCurrentPeriodEnd() : LocalDateTime.now();
          toSchedule.forEach(item -> {
            item.setStatus("pending_removal");
            item.setDeactivateAt(deactivateAt);
            item.setUpdatedAt(LocalDateTime.now());
          });
          subscriptionServiceRepository.saveAll(toSchedule);
        }
      }
    }

    if (dto.serviceCodes != null) {
      Set<String> codes = Set.copyOf(dto.serviceCodes);
      List<ServiceCatalog> catalog =
          codes.isEmpty() ? List.of() : catalogRepository.findAllByCodeIn(List.copyOf(codes));
      if (catalog.size() != codes.size()) {
        Set<String> found =
            catalog.stream().map(ServiceCatalog::getCode).collect(Collectors.toSet());
        Set<String> missing =
            codes.stream().filter(code -> !found.contains(code)).collect(Collectors.toSet());
        throw new ResponseStatusException(
            HttpStatus.NOT_FOUND,
            "One or more services not found: " + String.join(", ", missing));
      }

      List<SubscriptionService> existing = subscriptionServiceRepository.findBySubscriptionId(subscription.getId());
      Set<String> existingCodes =
          existing.stream().map(SubscriptionService::getServiceCode).collect(Collectors.toSet());

      List<SubscriptionService> toRestore =
          existing.stream()
              .filter(item -> "pending_removal".equals(item.getStatus()))
              .filter(item -> codes.contains(item.getServiceCode()))
              .toList();
      if (!toRestore.isEmpty()) {
        toRestore.forEach(item -> {
          item.setStatus("active");
          item.setDeactivateAt(null);
          item.setUpdatedAt(LocalDateTime.now());
        });
        subscriptionServiceRepository.saveAll(toRestore);
      }

      List<ServiceCatalog> toAdd = catalog.stream().filter(item -> !existingCodes.contains(item.getCode())).toList();
      if (!toAdd.isEmpty()) {
        List<SubscriptionService> rows = new ArrayList<>();
        for (ServiceCatalog service : toAdd) {
          boolean isPending =
              !"active".equals(subscription.getStatus())
                  || ("active".equals(subscription.getStatus()) && now.isBefore(subscription.getCurrentPeriodEnd()));
          SubscriptionService entry = new SubscriptionService();
          entry.setId(UUID.randomUUID().toString());
          entry.setSubscriptionId(subscription.getId());
          entry.setServiceCode(service.getCode());
          entry.setStatus(isPending ? "pending" : "active");
          entry.setActivateAt(isPending ? subscription.getCurrentPeriodEnd() : null);
          entry.setDeactivateAt(null);
          entry.setPriceEur(
              "annual".equals(subscription.getPeriod())
                  ? service.getPriceAnnualEur()
                  : service.getPriceMonthlyEur());
          entry.setCreatedAt(LocalDateTime.now());
          entry.setUpdatedAt(LocalDateTime.now());
          rows.add(entry);
        }
        subscriptionServiceRepository.saveAll(rows);
        var tenant = tenantsService.getById(tenantId);
        notifyAdminsServiceAssigned(tenantId, tenant != null ? tenant.getName() : null, toAdd);
      }
      if (!codes.isEmpty()) {
        tenantServiceApiKeysService.ensureKeys(tenantId, List.copyOf(codes));
      }
    }

    syncLatestInvoice(subscription);

    if ("cancelled".equals(dto.status)) {
      createHistoryFromSubscription(subscription);
    }

    return buildResponse(subscription);
  }

  @Transactional
  public Map<String, Object> deleteServiceAssignment(String tenantId, String tenantServiceId) {
    if (tenantServiceId == null || tenantServiceId.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing service assignment id");
    }
    SubscriptionService assignment =
        subscriptionServiceRepository
            .findById(tenantServiceId)
            .orElseThrow(
                () ->
                    new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Service assignment not found"));
    Subscription subscription =
        subscriptionRepository
            .findById(assignment.getSubscriptionId())
            .orElseThrow(
                () ->
                    new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Subscription not found"));
    if (!tenantId.equals(subscription.getTenantId())) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Service assignment not found");
    }

    String serviceCode = assignment.getServiceCode();
    subscriptionServiceRepository.delete(assignment);
    tenantServiceConfigRepository.deleteByTenantIdAndServiceCode(tenantId, serviceCode);
    tenantServiceEndpointRepository.deleteByTenantIdAndServiceCode(tenantId, serviceCode);
    tenantServiceUserRepository.deleteByTenantIdAndServiceCode(tenantId, serviceCode);
    tenantServiceApiKeysService.deleteByTenantAndServiceCode(tenantId, serviceCode);

    subscription.setUpdatedAt(LocalDateTime.now());
    subscriptionRepository.save(subscription);
    syncLatestInvoice(subscription);

    return buildResponse(subscription);
  }

  private void syncLatestInvoice(Subscription subscription) {
    if (subscription == null) {
      return;
    }
    List<TenantInvoice> invoices = invoiceRepository.findBySubscriptionId(subscription.getId());
    if (invoices.isEmpty()) {
      return;
    }
    TenantInvoice invoice =
        invoices.stream()
            .max(
                Comparator.comparing(
                    item -> item.getIssuedAt() != null ? item.getIssuedAt() : item.getCreatedAt()))
            .orElse(null);
    if (invoice == null) {
      return;
    }

    List<SubscriptionService> services =
        subscriptionServiceRepository.findBySubscriptionId(subscription.getId());
    double servicesTotal =
        services.stream().map(item -> item.getPriceEur().doubleValue()).reduce(0d, Double::sum);

    BigDecimal basePrice = toMoney(subscription.getBasePriceEur());
    BigDecimal servicesTotalAmount = toMoney(BigDecimal.valueOf(servicesTotal));
    BigDecimal subtotal = basePrice.add(servicesTotalAmount);
    TaxBreakdown tax = computeTax(subtotal, null);

    invoice.setBasePriceEur(basePrice);
    invoice.setServicesPriceEur(servicesTotalAmount);
    invoice.setTaxRate(tax.rate());
    invoice.setTaxEur(tax.taxEur());
    invoice.setTotalEur(tax.totalEur());
    invoiceRepository.save(invoice);

    List<TenantInvoiceItem> existingItems = invoiceItemRepository.findByInvoiceId(invoice.getId());
    Map<String, TenantInvoiceItem> itemMap =
        existingItems.stream()
            .collect(Collectors.toMap(TenantInvoiceItem::getServiceCode, item -> item, (a, b) -> a));
    List<TenantInvoiceItem> toSave = new ArrayList<>();
    LocalDateTime now = LocalDateTime.now();
    Set<String> serviceCodes =
        services.stream().map(SubscriptionService::getServiceCode).collect(Collectors.toSet());
    List<TenantInvoiceItem> toDelete =
        existingItems.stream()
            .filter(item -> !serviceCodes.contains(item.getServiceCode()))
            .toList();
    if (!toDelete.isEmpty()) {
      invoiceItemRepository.deleteAll(toDelete);
    }
    for (SubscriptionService service : services) {
      TenantInvoiceItem item = itemMap.get(service.getServiceCode());
      if (item == null) {
        TenantInvoiceItem created = new TenantInvoiceItem();
        created.setId(UUID.randomUUID().toString());
        created.setInvoiceId(invoice.getId());
        created.setServiceCode(service.getServiceCode());
        created.setDescription("Servicio " + service.getServiceCode());
        created.setPriceEur(service.getPriceEur());
        created.setStatus(service.getStatus());
        created.setCreatedAt(now);
        toSave.add(created);
      } else {
        item.setPriceEur(service.getPriceEur());
        item.setStatus(service.getStatus());
        toSave.add(item);
      }
    }
    if (!toSave.isEmpty()) {
      invoiceItemRepository.saveAll(toSave);
    }
  }

  @Transactional
  public Map<String, Object> deleteByTenantId(String tenantId) {
    var tenant = tenantsService.getById(tenantId);
    if (tenant == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Tenant not found");
    }

    Optional<Subscription> subscriptionOpt = subscriptionRepository.findByTenantId(tenantId);

    if (subscriptionOpt.isPresent()) {
      Subscription subscription = subscriptionOpt.get();
      try {
        List<TenantInvoice> invoices = invoiceRepository.findBySubscriptionId(subscription.getId());
        if (!invoices.isEmpty()) {
          List<String> invoiceIds = invoices.stream().map(TenantInvoice::getId).toList();
          if (!invoiceIds.isEmpty()) {
            invoiceItemRepository.deleteByInvoiceIdIn(invoiceIds);
          }
          invoiceRepository.deleteAll(invoices);
        }
      } catch (DataAccessException ex) {
        // Tables may not exist yet in some environments; ignore invoice cleanup in that case.
      }

      try {
        paymentRepository.deleteBySubscriptionId(subscription.getId());
      } catch (DataAccessException ex) {
        // Ignore missing/legacy columns in payment requests during cleanup.
      }

      try {
        subscriptionHistoryRepository.deleteBySubscriptionId(subscription.getId());
      } catch (DataAccessException ex) {
        // Ignore missing/legacy columns in history during cleanup.
      }

      subscriptionServiceRepository.deleteBySubscriptionId(subscription.getId());
      subscriptionRepository.delete(subscription);
    } else {
      try {
        paymentRepository.deleteByTenantId(tenantId);
      } catch (DataAccessException ex) {
        // Ignore missing/legacy columns in payment requests during cleanup.
      }

      try {
        subscriptionHistoryRepository.deleteByTenantId(tenantId);
      } catch (DataAccessException ex) {
        // Ignore missing/legacy columns in history during cleanup.
      }
    }

    return buildResponse(null);
  }

  private void createHistoryFromSubscription(Subscription subscription) {
    boolean exists =
        subscriptionHistoryRepository.findBySubscriptionIdAndStartedAt(
                subscription.getId(), subscription.getCurrentPeriodStart())
            .isPresent();
    if (exists) {
      return;
    }
    List<SubscriptionService> services =
        subscriptionServiceRepository.findBySubscriptionId(subscription.getId()).stream()
            .filter(item -> List.of("active", "pending_removal").contains(item.getStatus()))
            .toList();
    BigDecimal servicesTotal =
        services.stream()
            .map(item -> toMoney(item.getPriceEur()))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    BigDecimal basePrice = toMoney(subscription.getBasePriceEur());
    BigDecimal subtotal = basePrice.add(servicesTotal);
    TaxBreakdown tax = computeTax(subtotal, null);
    LocalDateTime endDate =
        subscription.isCancelAtPeriodEnd() ? subscription.getCurrentPeriodEnd() : LocalDateTime.now();
    int periods = countPeriods(subscription.getCurrentPeriodStart(), endDate, subscription.getPeriod());
    BigDecimal totalBilled =
        tax.totalEur().multiply(BigDecimal.valueOf(periods)).setScale(2, RoundingMode.HALF_UP);

    SubscriptionHistory history = new SubscriptionHistory();
    history.setId(UUID.randomUUID().toString());
    history.setTenantId(subscription.getTenantId());
    history.setSubscriptionId(subscription.getId());
    history.setPeriod(subscription.getPeriod());
    history.setBasePriceEur(basePrice);
    history.setServicesPriceEur(servicesTotal);
    history.setTotalBilledEur(totalBilled);
    history.setStartedAt(subscription.getCurrentPeriodStart());
    history.setEndedAt(endDate);
    history.setCreatedAt(LocalDateTime.now());
    subscriptionHistoryRepository.save(history);
  }

  public Map<String, Object> confirmPaymentByToken(String token) {
    String tokenHash = hashToken(token);
    SubscriptionPaymentRequest request =
        paymentRepository.findByTokenHashAndStatus(tokenHash, "pending").orElse(null);
    if (request == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment request not found");
    }
    if (request.getExpiresAt().isBefore(LocalDateTime.now())) {
      request.setStatus("expired");
      paymentRepository.save(request);
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment request expired");
    }
    return activateSubscription(request);
  }

  public Map<String, Object> confirmStripeSession(String sessionId) {
    String secret = System.getenv("STRIPE_SECRET_KEY");
    if (secret == null || secret.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Stripe not configured");
    }
    Stripe.apiKey = secret;
    try {
      Session session = Session.retrieve(sessionId);
      if (!List.of("paid", "no_payment_required").contains(session.getPaymentStatus())) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment not completed");
      }
      String paymentRequestId =
          session.getMetadata() != null ? session.getMetadata().get("paymentRequestId") : null;
      SubscriptionPaymentRequest request = null;
      if (paymentRequestId != null && !paymentRequestId.isBlank()) {
        request =
            paymentRepository.findById(paymentRequestId).orElse(null);
      }
      if (request == null) {
        request = paymentRepository.findByProviderRef(session.getId()).orElse(null);
      }
      if (request == null) {
        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment request not found");
      }
      Subscription subscription =
          subscriptionRepository
              .findById(request.getSubscriptionId())
              .orElseThrow(
                  () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Subscription not found"));
      applyStripeSession(subscription, session);
      if (!"pending".equals(request.getStatus())) {
        return buildResponse(subscription);
      }
      return activateSubscription(request, true, true);
    } catch (ResponseStatusException ex) {
      throw ex;
    } catch (Exception ex) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Stripe session failed");
    }
  }

  private void applyStripeSession(Subscription subscription, Session session) {
    if (subscription == null || session == null) {
      return;
    }
    if (session.getCustomer() != null) {
      subscription.setStripeCustomerId(session.getCustomer());
    }
    if (session.getSubscription() != null) {
      subscription.setStripeSubscriptionId(session.getSubscription());
      try {
        com.stripe.model.Subscription stripeSubscription =
            com.stripe.model.Subscription.retrieve(session.getSubscription());
        applyStripeSubscription(subscription, stripeSubscription);
      } catch (Exception ex) {
        log.warn("Failed to load stripe subscription {}: {}", session.getSubscription(), ex.getMessage());
      }
    }
    subscription.setUpdatedAt(LocalDateTime.now());
    subscriptionRepository.save(subscription);
  }

  private void applyStripeSubscription(
      Subscription subscription, com.stripe.model.Subscription stripeSubscription) {
    if (subscription == null || stripeSubscription == null) {
      return;
    }
    LocalDateTime start = toLocalDateTime(stripeSubscription.getCurrentPeriodStart());
    LocalDateTime end = toLocalDateTime(stripeSubscription.getCurrentPeriodEnd());
    if (start != null) {
      subscription.setCurrentPeriodStart(start);
    }
    if (end != null) {
      subscription.setCurrentPeriodEnd(end);
    }
    if (stripeSubscription.getCancelAtPeriodEnd() != null) {
      subscription.setCancelAtPeriodEnd(stripeSubscription.getCancelAtPeriodEnd());
    }
    String status = stripeSubscription.getStatus();
    if ("active".equals(status)) {
      subscription.setStatus("active");
    } else if ("past_due".equals(status)) {
      subscription.setStatus("past_due");
    } else if ("unpaid".equals(status)) {
      subscription.setStatus("past_due");
    } else if ("canceled".equals(status)) {
      subscription.setStatus("cancelled");
    }
  }

  private LocalDateTime toLocalDateTime(Long epochSeconds) {
    if (epochSeconds == null) {
      return null;
    }
    return LocalDateTime.ofEpochSecond(epochSeconds, 0, ZoneOffset.UTC);
  }

  public Map<String, Object> handleStripeWebhook(String payload, String signature) {
    String secret = System.getenv("STRIPE_WEBHOOK_SECRET");
    if (secret == null || secret.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Stripe webhook not configured");
    }
    if (signature == null || signature.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Stripe signature missing");
    }
    Event event;
    try {
      event = Webhook.constructEvent(payload, signature, secret);
    } catch (Exception ex) {
      log.warn("Stripe webhook signature failed: {}", ex.getMessage());
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid Stripe signature");
    }

    StripeObject stripeObject =
        event.getDataObjectDeserializer().getObject().orElse(null);
    if (stripeObject == null) {
      log.warn("Stripe webhook missing object for type {}", event.getType());
      return Map.of("received", true);
    }

    switch (event.getType()) {
      case "checkout.session.completed" -> {
        if (stripeObject instanceof Session session) {
          handleStripeCheckoutCompleted(session);
        }
      }
      case "invoice.paid" -> {
        if (stripeObject instanceof Invoice invoice) {
          handleStripeInvoicePaid(invoice);
        }
      }
      case "invoice.payment_failed" -> {
        if (stripeObject instanceof Invoice invoice) {
          handleStripeInvoicePaymentFailed(invoice);
        }
      }
      case "customer.subscription.updated" -> {
        if (stripeObject instanceof com.stripe.model.Subscription stripeSubscription) {
          handleStripeSubscriptionUpdated(stripeSubscription, false);
        }
      }
      case "customer.subscription.deleted" -> {
        if (stripeObject instanceof com.stripe.model.Subscription stripeSubscription) {
          handleStripeSubscriptionUpdated(stripeSubscription, true);
        }
      }
      default -> {
        // ignore
      }
    }

    return Map.of("received", true);
  }

  private void handleStripeCheckoutCompleted(Session session) {
    if (session == null) {
      return;
    }
    String paymentRequestId =
        session.getMetadata() != null ? session.getMetadata().get("paymentRequestId") : null;
    SubscriptionPaymentRequest request = null;
    if (paymentRequestId != null && !paymentRequestId.isBlank()) {
      request = paymentRepository.findById(paymentRequestId).orElse(null);
    }
    if (request == null) {
      request = paymentRepository.findByProviderRef(session.getId()).orElse(null);
    }
    if (request == null) {
      log.warn("Stripe checkout session without payment request {}", session.getId());
      return;
    }
    Subscription subscription =
        subscriptionRepository.findById(request.getSubscriptionId()).orElse(null);
    if (subscription == null) {
      log.warn("Stripe checkout session without subscription {}", session.getId());
      return;
    }
    applyStripeSession(subscription, session);
    if ("pending".equals(request.getStatus())) {
      activateSubscription(request, true, true);
    }
  }

  private void handleStripeInvoicePaid(Invoice invoice) {
    if (invoice == null) {
      return;
    }
    String stripeInvoiceId = invoice.getId();
    if (stripeInvoiceId != null && invoiceRepository.findByStripeInvoiceId(stripeInvoiceId).isPresent()) {
      return;
    }
    String stripeSubscriptionId = invoice.getSubscription();
    if (stripeSubscriptionId == null || stripeSubscriptionId.isBlank()) {
      return;
    }
    Subscription subscription =
        subscriptionRepository.findByStripeSubscriptionId(stripeSubscriptionId).orElse(null);
    if (subscription == null) {
      log.warn("Stripe invoice {} not linked to subscription", stripeInvoiceId);
      return;
    }

    subscription.setStatus("active");
    LocalDateTime periodStart = toLocalDateTime(invoice.getPeriodStart());
    LocalDateTime periodEnd = toLocalDateTime(invoice.getPeriodEnd());
    if (periodStart != null) {
      subscription.setCurrentPeriodStart(periodStart);
    }
    if (periodEnd != null) {
      subscription.setCurrentPeriodEnd(periodEnd);
    }
    subscription.setUpdatedAt(LocalDateTime.now());
    subscriptionRepository.save(subscription);

    String paymentRequestId =
        invoice.getMetadata() != null ? invoice.getMetadata().get("paymentRequestId") : null;
    SubscriptionPaymentRequest request = null;
    if (paymentRequestId != null && !paymentRequestId.isBlank()) {
      request = paymentRepository.findById(paymentRequestId).orElse(null);
    }
    if (request != null && "pending".equals(request.getStatus())) {
      request.setStatus("completed");
      request.setCompletedAt(LocalDateTime.now());
      request.setUpdatedAt(LocalDateTime.now());
      paymentRepository.save(request);
    }

    TenantInvoice invoiceRecord =
        invoiceRepository
            .findBySubscriptionId(subscription.getId())
            .stream()
            .filter(item -> "pending".equals(item.getStatus()) && item.getStripeInvoiceId() == null)
            .max(
                Comparator.comparing(
                    item -> item.getIssuedAt() != null ? item.getIssuedAt() : item.getCreatedAt()))
            .orElse(null);

    boolean isNew = false;
    if (invoiceRecord == null) {
      invoiceRecord = new TenantInvoice();
      invoiceRecord.setId(UUID.randomUUID().toString());
      invoiceRecord.setTenantId(subscription.getTenantId());
      invoiceRecord.setSubscriptionId(subscription.getId());
      if (paymentRequestId != null && !paymentRequestId.isBlank()) {
        invoiceRecord.setPaymentRequestId(paymentRequestId);
      }
      invoiceRecord.setPeriod(subscription.getPeriod());
      invoiceRecord.setIssuedAt(LocalDateTime.now());
      invoiceRecord.setCreatedAt(LocalDateTime.now());
      isNew = true;
    }

    long amountPaid = invoice.getAmountPaid() != null ? invoice.getAmountPaid() : 0L;
    if (amountPaid <= 0 && invoice.getAmountDue() != null) {
      amountPaid = invoice.getAmountDue();
    }
    BigDecimal totalEur =
        toMoney(BigDecimal.valueOf(amountPaid).divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP));
    List<SubscriptionService> services =
        subscriptionServiceRepository.findBySubscriptionId(subscription.getId()).stream()
            .filter(item -> List.of("active", "pending_removal").contains(item.getStatus()))
            .toList();
    BigDecimal servicesTotal =
        services.stream()
            .map(item -> toMoney(item.getPriceEur()))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    BigDecimal basePrice = toMoney(subscription.getBasePriceEur());
    BigDecimal subtotal = basePrice.add(servicesTotal);
    TaxBreakdown tax = computeTax(subtotal, totalEur.compareTo(BigDecimal.ZERO) > 0 ? totalEur : null);

    invoiceRecord.setBasePriceEur(basePrice);
    invoiceRecord.setServicesPriceEur(servicesTotal);
    invoiceRecord.setTaxRate(tax.rate());
    invoiceRecord.setTaxEur(tax.taxEur());
    invoiceRecord.setTotalEur(tax.totalEur());
    invoiceRecord.setCurrency(subscription.getCurrency() != null ? subscription.getCurrency() : "EUR");
    invoiceRecord.setStatus("paid");
    invoiceRecord.setStripeInvoiceId(stripeInvoiceId);
    invoiceRecord.setStripePaymentIntentId(invoice.getPaymentIntent());
    invoiceRecord.setPaidAt(LocalDateTime.now());
    invoiceRecord.setPeriodStart(periodStart);
    invoiceRecord.setPeriodEnd(periodEnd);
    invoiceRepository.save(invoiceRecord);

    if (isNew) {
      final String invoiceId = invoiceRecord.getId();
      List<TenantInvoiceItem> items =
          services.stream()
              .map(
                  service -> {
                    TenantInvoiceItem item = new TenantInvoiceItem();
                    item.setId(UUID.randomUUID().toString());
                    item.setInvoiceId(invoiceId);
                    item.setServiceCode(service.getServiceCode());
                    item.setDescription("Servicio " + service.getServiceCode());
                    item.setPriceEur(service.getPriceEur());
                    item.setStatus(service.getStatus());
                    item.setCreatedAt(LocalDateTime.now());
                    return item;
                  })
              .toList();
      if (!items.isEmpty()) {
        invoiceItemRepository.saveAll(items);
      }
    }
  }

  private void handleStripeInvoicePaymentFailed(Invoice invoice) {
    if (invoice == null) {
      return;
    }
    String stripeSubscriptionId = invoice.getSubscription();
    if (stripeSubscriptionId == null || stripeSubscriptionId.isBlank()) {
      return;
    }
    Subscription subscription =
        subscriptionRepository.findByStripeSubscriptionId(stripeSubscriptionId).orElse(null);
    if (subscription == null) {
      return;
    }
    subscription.setStatus("past_due");
    subscription.setUpdatedAt(LocalDateTime.now());
    subscriptionRepository.save(subscription);
  }

  private void handleStripeSubscriptionUpdated(
      com.stripe.model.Subscription stripeSubscription, boolean deleted) {
    if (stripeSubscription == null) {
      return;
    }
    Subscription subscription =
        subscriptionRepository.findByStripeSubscriptionId(stripeSubscription.getId()).orElse(null);
    if (subscription == null) {
      return;
    }
    applyStripeSubscription(subscription, stripeSubscription);
    if (deleted) {
      subscription.setStatus("cancelled");
      subscription.setCancelAtPeriodEnd(false);
      subscription.setCurrentPeriodEnd(LocalDateTime.now());
      subscription.setUpdatedAt(LocalDateTime.now());
      subscriptionRepository.save(subscription);
    }

    boolean cancelAtPeriodEnd =
        Boolean.TRUE.equals(stripeSubscription.getCancelAtPeriodEnd());
    if (cancelAtPeriodEnd) {
      List<SubscriptionService> services =
          subscriptionServiceRepository.findBySubscriptionId(subscription.getId());
      LocalDateTime deactivateAt =
          subscription.getCurrentPeriodEnd() != null
              ? subscription.getCurrentPeriodEnd()
              : LocalDateTime.now();
      services.forEach(item -> {
        item.setStatus("pending_removal");
        item.setDeactivateAt(deactivateAt);
        item.setUpdatedAt(LocalDateTime.now());
      });
      if (!services.isEmpty()) {
        subscriptionServiceRepository.saveAll(services);
      }
    } else if ("active".equals(subscription.getStatus())) {
      List<SubscriptionService> services =
          subscriptionServiceRepository.findBySubscriptionId(subscription.getId()).stream()
              .filter(item -> "pending_removal".equals(item.getStatus()))
              .toList();
      if (!services.isEmpty()) {
        services.forEach(item -> {
          item.setStatus("active");
          item.setDeactivateAt(null);
          item.setUpdatedAt(LocalDateTime.now());
        });
        subscriptionServiceRepository.saveAll(services);
      }
    }
  }

  public Map<String, Object> createStripePortalSession(String tenantId) {
    Subscription subscription =
        subscriptionRepository
            .findByTenantId(tenantId)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Subscription not found"));
    String secret = System.getenv("STRIPE_SECRET_KEY");
    if (secret == null || secret.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Stripe not configured");
    }
    Stripe.apiKey = secret;

    if (subscription.getStripeCustomerId() == null
        || subscription.getStripeCustomerId().isBlank()) {
      // Try to recover from existing Stripe subscription.
      if (subscription.getStripeSubscriptionId() != null
          && !subscription.getStripeSubscriptionId().isBlank()) {
        try {
          com.stripe.model.Subscription stripeSubscription =
              com.stripe.model.Subscription.retrieve(subscription.getStripeSubscriptionId());
          if (stripeSubscription.getCustomer() != null) {
            subscription.setStripeCustomerId(stripeSubscription.getCustomer());
            subscription.setUpdatedAt(LocalDateTime.now());
            subscriptionRepository.save(subscription);
          }
        } catch (Exception ex) {
          log.warn(
              "Failed to retrieve Stripe subscription {}: {}",
              subscription.getStripeSubscriptionId(),
              ex.getMessage());
        }
      }
    }

    if (subscription.getStripeCustomerId() == null
        || subscription.getStripeCustomerId().isBlank()) {
      var tenant = tenantsService.getById(tenantId);
      if (tenant == null || tenant.getBillingEmail() == null || tenant.getBillingEmail().isBlank()) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Stripe customer not configured");
      }
      try {
        com.stripe.model.Customer customer =
            com.stripe.model.Customer.create(
                com.stripe.param.CustomerCreateParams.builder()
                    .setEmail(tenant.getBillingEmail())
                    .setName(tenant.getName())
                    .putMetadata("tenantId", tenantId)
                    .putMetadata("subscriptionId", subscription.getId())
                    .build());
        subscription.setStripeCustomerId(customer.getId());
        subscription.setUpdatedAt(LocalDateTime.now());
        subscriptionRepository.save(subscription);
      } catch (Exception ex) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Stripe customer not configured");
      }
    }

    if (subscription.getStripeCustomerId() == null
        || subscription.getStripeCustomerId().isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Stripe customer not configured");
    }
    String returnUrl =
        System.getenv().getOrDefault(
            "STRIPE_PORTAL_RETURN_URL",
            System.getenv("FRONTEND_BASE_URL") + "/billing");
    try {
      com.stripe.model.billingportal.Session session =
          com.stripe.model.billingportal.Session.create(
              com.stripe.param.billingportal.SessionCreateParams.builder()
                  .setCustomer(subscription.getStripeCustomerId())
                  .setReturnUrl(returnUrl)
                  .build());
      return Map.of("url", session.getUrl());
    } catch (Exception ex) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Stripe portal failed");
    }
  }

  public Map<String, Object> approvePaymentByAdmin(String tenantId) {
    SubscriptionPaymentRequest request =
        paymentRepository.findFirstByTenantIdAndStatusOrderByCreatedAtDesc(tenantId, "pending")
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No pending payment requests"));
    return activateSubscription(request);
  }

  private Map<String, Object> activateSubscription(SubscriptionPaymentRequest request) {
    return activateSubscription(request, false, false);
  }

  private Map<String, Object> activateSubscription(
      SubscriptionPaymentRequest request, boolean skipInvoice) {
    return activateSubscription(request, skipInvoice, false);
  }

  private Map<String, Object> activateSubscription(
      SubscriptionPaymentRequest request, boolean skipInvoice, boolean preservePeriod) {
    request.setStatus("completed");
    request.setCompletedAt(LocalDateTime.now());
    request.setUpdatedAt(LocalDateTime.now());
    paymentRepository.save(request);

    Subscription subscription =
        subscriptionRepository
            .findById(request.getSubscriptionId())
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Subscription not found"));
    LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
    subscription.setStatus("active");
    if (!preservePeriod
        || subscription.getCurrentPeriodStart() == null
        || subscription.getCurrentPeriodEnd() == null) {
      subscription.setCurrentPeriodStart(now);
      subscription.setCurrentPeriodEnd(buildPeriodEnd(now, subscription.getPeriod()));
    }
    subscription.setCancelAtPeriodEnd(false);
    subscription.setUpdatedAt(LocalDateTime.now());
    subscriptionRepository.save(subscription);

    List<SubscriptionService> pending =
        subscriptionServiceRepository.findBySubscriptionId(subscription.getId()).stream()
            .filter(item -> "pending".equals(item.getStatus()))
            .toList();
    if (!pending.isEmpty()) {
      pending.forEach(item -> {
        item.setStatus("active");
        item.setActivateAt(null);
        item.setUpdatedAt(LocalDateTime.now());
      });
      subscriptionServiceRepository.saveAll(pending);
    }

    if (!skipInvoice) {
      createInvoiceFromPayment(request, subscription);
    }

    return buildResponse(subscription);
  }

  private void createInvoiceFromPayment(SubscriptionPaymentRequest request, Subscription subscription) {
    if (request == null || subscription == null) {
      return;
    }
    Optional<TenantInvoice> existingInvoice =
        invoiceRepository.findFirstByPaymentRequestId(request.getId());

    List<SubscriptionService> services =
        subscriptionServiceRepository.findBySubscriptionId(subscription.getId()).stream()
            .filter(item -> List.of("active", "pending_removal").contains(item.getStatus()))
            .toList();
    BigDecimal servicesTotal =
        services.stream()
            .map(item -> toMoney(item.getPriceEur()))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    BigDecimal basePrice = toMoney(subscription.getBasePriceEur());
    BigDecimal subtotal = basePrice.add(servicesTotal);
    TaxBreakdown tax = computeTax(subtotal, request.getAmountEur());
    LocalDateTime now = LocalDateTime.now();

    TenantInvoice invoice;
    if (existingInvoice.isPresent()) {
      invoice = existingInvoice.get();
      invoice.setBasePriceEur(basePrice);
      invoice.setServicesPriceEur(servicesTotal);
      invoice.setTaxRate(tax.rate());
      invoice.setTaxEur(tax.taxEur());
      invoice.setTotalEur(tax.totalEur());
      invoice.setCurrency(subscription.getCurrency() != null ? subscription.getCurrency() : "EUR");
      invoice.setStatus("paid");
      invoice.setPaidAt(now);
      invoice.setPeriodStart(subscription.getCurrentPeriodStart());
      invoice.setPeriodEnd(subscription.getCurrentPeriodEnd());
      invoiceRepository.save(invoice);
    } else {
      invoice = new TenantInvoice();
      invoice.setId(UUID.randomUUID().toString());
      invoice.setTenantId(request.getTenantId());
      invoice.setSubscriptionId(subscription.getId());
      invoice.setPaymentRequestId(request.getId());
      invoice.setPeriod(subscription.getPeriod());
      invoice.setBasePriceEur(basePrice);
      invoice.setServicesPriceEur(servicesTotal);
      invoice.setTaxRate(tax.rate());
      invoice.setTaxEur(tax.taxEur());
      invoice.setTotalEur(tax.totalEur());
      invoice.setCurrency(subscription.getCurrency() != null ? subscription.getCurrency() : "EUR");
      invoice.setStatus("paid");
      invoice.setIssuedAt(now);
      invoice.setPaidAt(now);
      invoice.setPeriodStart(subscription.getCurrentPeriodStart());
      invoice.setPeriodEnd(subscription.getCurrentPeriodEnd());
      invoice.setCreatedAt(now);
      invoiceRepository.save(invoice);
    }

    List<TenantInvoiceItem> existingItems = invoiceItemRepository.findByInvoiceId(invoice.getId());
    if (existingItems.isEmpty()) {
      List<TenantInvoiceItem> items =
          services.stream()
              .map(
                  service -> {
                    TenantInvoiceItem item = new TenantInvoiceItem();
                    item.setId(UUID.randomUUID().toString());
                    item.setInvoiceId(invoice.getId());
                    item.setServiceCode(service.getServiceCode());
                    item.setDescription("Servicio " + service.getServiceCode());
                    item.setPriceEur(service.getPriceEur());
                    item.setStatus(service.getStatus());
                    item.setCreatedAt(now);
                    return item;
                  })
              .toList();
      if (!items.isEmpty()) {
        invoiceItemRepository.saveAll(items);
      }
    }
  }

  private void createInitialInvoice(SubscriptionPaymentRequest request, Subscription subscription) {
    if (request == null || subscription == null) {
      return;
    }
    if (invoiceRepository.findFirstByPaymentRequestId(request.getId()).isPresent()) {
      return;
    }

    List<SubscriptionService> services =
        subscriptionServiceRepository.findBySubscriptionId(subscription.getId());
    BigDecimal servicesTotal =
        services.stream()
            .map(item -> toMoney(item.getPriceEur()))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    BigDecimal basePrice = toMoney(subscription.getBasePriceEur());
    BigDecimal subtotal = basePrice.add(servicesTotal);
    TaxBreakdown tax = computeTax(subtotal, request.getAmountEur());
    LocalDateTime now = LocalDateTime.now();

    TenantInvoice invoice = new TenantInvoice();
    invoice.setId(UUID.randomUUID().toString());
    invoice.setTenantId(request.getTenantId());
    invoice.setSubscriptionId(subscription.getId());
    invoice.setPaymentRequestId(request.getId());
    invoice.setPeriod(subscription.getPeriod());
    invoice.setBasePriceEur(basePrice);
    invoice.setServicesPriceEur(servicesTotal);
    invoice.setTaxRate(tax.rate());
    invoice.setTaxEur(tax.taxEur());
    invoice.setTotalEur(tax.totalEur());
    invoice.setCurrency(subscription.getCurrency() != null ? subscription.getCurrency() : "EUR");
    invoice.setStatus("pending");
    invoice.setIssuedAt(now);
    invoice.setPaidAt(null);
    invoice.setPeriodStart(subscription.getCurrentPeriodStart());
    invoice.setPeriodEnd(subscription.getCurrentPeriodEnd());
    invoice.setCreatedAt(now);
    invoiceRepository.save(invoice);

    List<TenantInvoiceItem> items =
        services.stream()
            .map(
                service -> {
                  TenantInvoiceItem item = new TenantInvoiceItem();
                  item.setId(UUID.randomUUID().toString());
                  item.setInvoiceId(invoice.getId());
                  item.setServiceCode(service.getServiceCode());
                  item.setDescription("Servicio " + service.getServiceCode());
                  item.setPriceEur(service.getPriceEur());
                  item.setStatus(service.getStatus());
                  item.setCreatedAt(now);
                  return item;
                })
            .toList();
    if (!items.isEmpty()) {
      invoiceItemRepository.saveAll(items);
    }
  }

  public List<Map<String, Object>> listAdminSummary() {
    List<Subscription> subscriptions = subscriptionRepository.findAll();
    List<SubscriptionService> services = subscriptionServiceRepository.findAll();
    List<SubscriptionHistory> histories = subscriptionHistoryRepository.findAll();
    Map<String, Subscription> subscriptionMap =
        subscriptions.stream().collect(Collectors.toMap(Subscription::getTenantId, item -> item, (a, b) -> a));
    Map<String, List<SubscriptionService>> servicesBySub = new HashMap<>();
    services.forEach(
        item -> servicesBySub.computeIfAbsent(item.getSubscriptionId(), key -> new ArrayList<>()).add(item));
    Map<String, Double> historyTotals = new HashMap<>();
    histories.forEach(
        entry ->
            historyTotals.put(
                entry.getTenantId(),
                historyTotals.getOrDefault(entry.getTenantId(), 0d)
                    + entry.getTotalBilledEur().doubleValue()));

    LocalDateTime now = LocalDateTime.now();
    return tenantsService.list(null).stream()
        .map(
            tenant -> {
              Subscription subscription = subscriptionMap.get(tenant.getId());
              if (subscription == null) {
                Map<String, Object> summary = new HashMap<>();
                summary.put("tenantId", tenant.getId());
                summary.put("tenantName", tenant.getName());
                summary.put("subscription", null);
                summary.put("currentTotalEur", 0);
                summary.put("billedSinceStartEur", 0);
                summary.put("historyTotalEur", historyTotals.getOrDefault(tenant.getId(), 0d));
                return summary;
              }
              List<SubscriptionService> serviceList = servicesBySub.getOrDefault(subscription.getId(), List.of());
              BigDecimal servicesTotal =
                  serviceList.stream()
                      .filter(item -> "active".equals(item.getStatus()))
                      .map(item -> toMoney(item.getPriceEur()))
                      .reduce(BigDecimal.ZERO, BigDecimal::add);
              BigDecimal basePrice = toMoney(subscription.getBasePriceEur());
              BigDecimal subtotal = basePrice.add(servicesTotal);
              TaxBreakdown tax = computeTax(subtotal, null);
              LocalDateTime endDate =
                  "cancelled".equals(subscription.getStatus())
                      ? subscription.getCurrentPeriodEnd()
                      : now;
              int periods =
                  countPeriods(subscription.getCurrentPeriodStart(), endDate, subscription.getPeriod());
              BigDecimal currentTotal = tax.totalEur();

              Map<String, Object> summary = new HashMap<>();
              summary.put("tenantId", tenant.getId());
              summary.put("tenantName", tenant.getName());
              summary.put("subscription", subscription);
              summary.put("currentTotalEur", currentTotal);
              summary.put(
                  "billedSinceStartEur",
                  currentTotal.multiply(BigDecimal.valueOf(periods)).setScale(2, RoundingMode.HALF_UP));
              summary.put("historyTotalEur", historyTotals.getOrDefault(tenant.getId(), 0d));
              return summary;
            })
        .toList();
  }

  public static class CreateSubscriptionRequest {
    public String period;
    public BigDecimal basePriceEur;
    public List<String> serviceCodes;
    public Boolean cancelAtPeriodEnd;
  }

  public static class UpdateSubscriptionRequest {
    public String period;
    public BigDecimal basePriceEur;
    public List<String> serviceCodes;
    public List<String> removeServiceCodes;
    public String status;
    public Boolean cancelAtPeriodEnd;

    public UpdateSubscriptionRequest() {}

    public UpdateSubscriptionRequest(
        String period,
        BigDecimal basePriceEur,
        List<String> serviceCodes,
        List<String> removeServiceCodes,
        Boolean cancelAtPeriodEnd) {
      this.period = period;
      this.basePriceEur = basePriceEur;
      this.serviceCodes = serviceCodes;
      this.removeServiceCodes = removeServiceCodes;
      this.cancelAtPeriodEnd = cancelAtPeriodEnd;
    }
  }

  private record ServiceSummary(String name, double priceEur) {}
}
