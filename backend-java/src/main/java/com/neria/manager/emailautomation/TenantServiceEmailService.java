package com.neria.manager.emailautomation;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.neria.manager.common.entities.ServiceCatalog;
import com.neria.manager.common.entities.TenantServiceConfig;
import com.neria.manager.common.entities.TenantServiceEmailAccount;
import com.neria.manager.common.entities.TenantServiceEmailMessage;
import com.neria.manager.common.repos.ServiceCatalogRepository;
import com.neria.manager.common.repos.TenantServiceConfigRepository;
import com.neria.manager.common.repos.TenantServiceEmailAccountRepository;
import com.neria.manager.common.repos.TenantServiceEmailMessageRepository;
import com.neria.manager.common.services.EncryptionService;
import com.neria.manager.jira.TenantServiceJiraService;
import com.neria.manager.runtime.ExecuteRequest;
import com.neria.manager.runtime.RuntimeService;
import jakarta.mail.Folder;
import jakarta.mail.Message;
import jakarta.mail.Multipart;
import jakarta.mail.Part;
import jakarta.mail.Session;
import jakarta.mail.Store;
import jakarta.mail.UIDFolder;
import jakarta.mail.internet.InternetAddress;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Base64;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Properties;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class TenantServiceEmailService {
  private static final Logger log = LoggerFactory.getLogger(TenantServiceEmailService.class);
  private static final String DEFAULT_FOLDER = "INBOX";
  private static final String DEFAULT_MODEL = "gpt-4.1-mini";
  private static final int MAX_BODY_CHARS = 12000;
  private static final int MAX_PREVIEW_CHARS = 1200;
  private static final java.util.regex.Pattern EMAIL_PATTERN =
      java.util.regex.Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");
  private static final String CLASSIFY_PROMPT =
      "Eres un asistente experto en automatizacion de correos y tickets. " +
      "Devuelve SOLO JSON valido (sin markdown) con esta estructura:\n" +
      "{\n" +
      "  \"intent\": \"reclamacion|solicitud|incidencia|baja|informacion|otro\",\n" +
      "  \"priority\": \"low|medium|high|urgent\",\n" +
      "  \"summary\": \"resumen breve\",\n" +
      "  \"action\": {\n" +
      "    \"type\": \"create_jira|notify_team|reply|none\",\n" +
      "    \"department\": \"support|sales|billing|ops|otro\",\n" +
      "    \"labels\": [\"...\"]\n" +
      "  },\n" +
      "  \"entities\": {\n" +
      "    \"orderId\": \"\",\n" +
      "    \"customerName\": \"\",\n" +
      "    \"customerEmail\": \"\",\n" +
      "    \"phone\": \"\"\n" +
      "  }\n" +
      "}";

  private final TenantServiceEmailAccountRepository accountRepository;
  private final TenantServiceEmailMessageRepository messageRepository;
  private final TenantServiceConfigRepository configRepository;
  private final ServiceCatalogRepository serviceCatalogRepository;
  private final TenantServiceJiraService jiraService;
  private final EncryptionService encryptionService;
  private final RuntimeService runtimeService;
  private final ObjectMapper objectMapper;

  public TenantServiceEmailService(
      TenantServiceEmailAccountRepository accountRepository,
      TenantServiceEmailMessageRepository messageRepository,
      TenantServiceConfigRepository configRepository,
      ServiceCatalogRepository serviceCatalogRepository,
      TenantServiceJiraService jiraService,
      EncryptionService encryptionService,
      RuntimeService runtimeService,
      ObjectMapper objectMapper) {
    this.accountRepository = accountRepository;
    this.messageRepository = messageRepository;
    this.configRepository = configRepository;
    this.serviceCatalogRepository = serviceCatalogRepository;
    this.jiraService = jiraService;
    this.encryptionService = encryptionService;
    this.runtimeService = runtimeService;
    this.objectMapper = objectMapper;
  }

  public List<EmailAccountResponse> listAccounts(String tenantId, String serviceCode) {
    requireEmailAutomationService(serviceCode);
    return accountRepository
        .findByTenantIdAndServiceCodeOrderByCreatedAtDesc(tenantId, serviceCode)
        .stream()
        .map(EmailAccountResponse::fromEntity)
        .toList();
  }

  public EmailAccountResponse createAccount(
      String tenantId, String serviceCode, EmailAccountRequest request) {
    requireEmailAutomationService(serviceCode);
    validateAccountRequest(request, true);
    TenantServiceEmailAccount account = new TenantServiceEmailAccount();
    account.setId(UUID.randomUUID().toString());
    account.setTenantId(tenantId);
    account.setServiceCode(serviceCode);
    applyAccount(account, request, true);
    account.setCreatedAt(LocalDateTime.now());
    account.setUpdatedAt(LocalDateTime.now());
    return EmailAccountResponse.fromEntity(accountRepository.save(account));
  }

  public EmailAccountResponse updateAccount(
      String tenantId,
      String serviceCode,
      String accountId,
      EmailAccountRequest request) {
    requireEmailAutomationService(serviceCode);
    TenantServiceEmailAccount account =
        accountRepository
            .findByIdAndTenantId(accountId, tenantId)
            .orElseThrow(
                () ->
                    new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Email account not found"));
    if (!account.getServiceCode().equals(serviceCode)) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Email account not found");
    }
    validateAccountRequest(request, false);
    applyAccount(account, request, false);
    account.setUpdatedAt(LocalDateTime.now());
    return EmailAccountResponse.fromEntity(accountRepository.save(account));
  }

  public void deleteAccount(String tenantId, String serviceCode, String accountId) {
    requireEmailAutomationService(serviceCode);
    TenantServiceEmailAccount account =
        accountRepository
            .findByIdAndTenantId(accountId, tenantId)
            .orElseThrow(
                () ->
                    new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Email account not found"));
    if (!account.getServiceCode().equals(serviceCode)) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Email account not found");
    }
    accountRepository.delete(account);
  }

  public List<EmailMessageResponse> listMessages(
      String tenantId, String serviceCode, int limit) {
    requireEmailAutomationService(serviceCode);
    int normalized = Math.max(1, Math.min(limit, 200));
    return messageRepository
        .findByTenantIdAndServiceCodeOrderByReceivedAtDesc(
            tenantId, serviceCode, PageRequest.of(0, normalized))
        .stream()
        .map(EmailMessageResponse::fromEntity)
        .toList();
  }

  public List<EmailMessageResponse> listMessagesForChat(
      String tenantId, String serviceCode, int limit) {
    return listMessages(tenantId, serviceCode, limit);
  }

  public void syncTenantService(String tenantId, String serviceCode) {
    requireEmailAutomationService(serviceCode);
    List<TenantServiceEmailAccount> accounts =
        accountRepository.findByTenantIdAndServiceCodeOrderByCreatedAtDesc(tenantId, serviceCode);
    for (TenantServiceEmailAccount account : accounts) {
      if (account.isEnabled()) {
        pollAccount(account);
      }
    }
  }

  public void pollAllEnabledAccounts() {
    for (TenantServiceEmailAccount account : accountRepository.findByEnabledTrue()) {
      pollAccount(account);
    }
  }

  private void pollAccount(TenantServiceEmailAccount account) {
    Optional<ServiceCatalog> service =
        serviceCatalogRepository.findByCode(account.getServiceCode());
    if (service.isEmpty() || !service.get().isEmailAutomationEnabled()) {
      return;
    }
    if (!account.isEnabled()) {
      return;
    }
    try {
      fetchNewMessages(account, service.get());
    } catch (Exception ex) {
      log.warn("Email polling failed account={} tenant={} error={}",
          account.getId(), account.getTenantId(), ex.getMessage());
    }
  }

  private void fetchNewMessages(TenantServiceEmailAccount account, ServiceCatalog service) {
    String password = account.getEncryptedPassword() != null
        ? encryptionService.decrypt(account.getEncryptedPassword())
        : null;
    if (password == null || password.isBlank()) {
      log.warn("Email account {} missing password, skipping", account.getId());
      return;
    }

    Properties props = new Properties();
    String protocol = account.isUseSsl() ? "imaps" : "imap";
    props.put("mail.store.protocol", protocol);
    props.put("mail.imap.connectiontimeout", "10000");
    props.put("mail.imap.timeout", "10000");
    if (account.isUseSsl()) {
      props.put("mail.imap.ssl.enable", "true");
    }
    if (account.isUseStartTls()) {
      props.put("mail.imap.starttls.enable", "true");
    }

    Session session = Session.getInstance(props);
    try (Store store = session.getStore(protocol)) {
      if (account.getPort() != null) {
        store.connect(account.getHost(), account.getPort(), account.getUsername(), password);
      } else {
        store.connect(account.getHost(), account.getUsername(), password);
      }
      Folder folder = store.getFolder(
          account.getFolder() != null && !account.getFolder().isBlank()
              ? account.getFolder()
              : DEFAULT_FOLDER);
      folder.open(Folder.READ_ONLY);
      if (!(folder instanceof UIDFolder uidFolder)) {
        log.warn("Email account {} folder does not support UID", account.getId());
        folder.close();
        return;
      }
      long lastUid = account.getLastUid() != null ? account.getLastUid() : 0L;
      Message[] messages = uidFolder.getMessagesByUID(lastUid + 1, UIDFolder.LASTUID);
      long maxUid = lastUid;
      for (Message message : messages) {
        long uid = uidFolder.getUID(message);
        if (uid <= lastUid) {
          continue;
        }
        maxUid = Math.max(maxUid, uid);
        processMessage(account, service, message);
      }
      account.setLastUid(maxUid);
      account.setLastSyncAt(LocalDateTime.now());
      account.setUpdatedAt(LocalDateTime.now());
      accountRepository.save(account);
      folder.close();
    } catch (Exception ex) {
      log.warn("Email account {} sync error {}", account.getId(), ex.getMessage());
    }
  }

  private void processMessage(
      TenantServiceEmailAccount account, ServiceCatalog service, Message message) {
    try {
      EmailSnapshot snapshot = EmailSnapshot.from(message);
      String messageKey = buildMessageKey(snapshot);
      Optional<TenantServiceEmailMessage> existing =
          messageRepository.findByTenantIdAndAccountIdAndMessageKey(
              account.getTenantId(), account.getId(), messageKey);
      if (existing.isPresent()) {
        return;
      }

      TenantServiceEmailMessage entity = new TenantServiceEmailMessage();
      entity.setId(UUID.randomUUID().toString());
      entity.setTenantId(account.getTenantId());
      entity.setServiceCode(account.getServiceCode());
      entity.setAccountId(account.getId());
      entity.setMessageKey(messageKey);
      entity.setMessageId(snapshot.messageId);
      entity.setSubject(snapshot.subject);
      entity.setFromName(snapshot.fromName);
      entity.setFromEmail(snapshot.fromEmail);
      entity.setReceivedAt(snapshot.receivedAt);
      entity.setBodyText(snapshot.bodyText);
      entity.setStatus("received");
      entity.setCreatedAt(LocalDateTime.now());
      entity.setUpdatedAt(LocalDateTime.now());
      entity = messageRepository.save(entity);

      EmailClassification classification =
          classifyEmail(account.getTenantId(), account.getServiceCode(), snapshot);
      if (classification != null) {
        entity.setIntent(classification.intent);
        entity.setPriority(classification.priority);
        entity.setActionType(classification.actionType);
        entity.setClassification(classification.rawJson);
      }
      entity.setStatus("classified");
      applyJiraAction(entity, service, classification, snapshot);
      entity.setUpdatedAt(LocalDateTime.now());
      messageRepository.save(entity);
    } catch (Exception ex) {
      log.warn("Email processing error account={} error={}", account.getId(), ex.getMessage());
    }
  }

  private EmailClassification classifyEmail(
      String tenantId, String serviceCode, EmailSnapshot snapshot) {
    TenantServiceConfig config =
        configRepository.findByTenantIdAndServiceCode(tenantId, serviceCode).orElse(null);
    if (config == null || config.getProviderId() == null || config.getProviderId().isBlank()) {
      return new EmailClassification("otro", "medium", "none", null, "{}");
    }
    String body = snapshot.bodyText != null ? snapshot.bodyText : "";
    String trimmed = body.length() > MAX_BODY_CHARS ? body.substring(0, MAX_BODY_CHARS) : body;
    String userPrompt =
        "Email recibido:\n" +
        "Asunto: " + safe(snapshot.subject) + "\n" +
        "De: " + safe(snapshot.fromEmail) + "\n" +
        "Fecha: " + (snapshot.receivedAt != null ? snapshot.receivedAt : "") + "\n\n" +
        trimmed;

    ExecuteRequest request = new ExecuteRequest();
    request.providerId = config.getProviderId();
    request.model = resolveModel();
    request.serviceCode = serviceCode;
    request.payload = Map.of(
        "messages",
        List.of(
            Map.of("role", "system", "content", CLASSIFY_PROMPT),
            Map.of("role", "user", "content", userPrompt)));

    Object response = runtimeService.execute(tenantId, request);
    String content = extractContent(response);
    if (content == null || content.isBlank()) {
      return new EmailClassification("otro", "medium", "none", null, "{}");
    }
    String json = stripJsonFence(content);
    try {
      Map<String, Object> parsed = objectMapper.readValue(json, new TypeReference<>() {});
      String intent = asString(parsed.get("intent"), "otro");
      String priority = asString(parsed.get("priority"), "medium");
      String summary = asString(parsed.get("summary"), null);
      String actionType = "none";
      Object action = parsed.get("action");
      if (action instanceof Map<?, ?> actionMap) {
        actionType = asString(actionMap.get("type"), "none");
      }
      return new EmailClassification(intent, priority, actionType, summary, json);
    } catch (Exception ex) {
      return new EmailClassification("otro", "medium", "none", null, "{}");
    }
  }

  private void applyJiraAction(
      TenantServiceEmailMessage entity,
      ServiceCatalog service,
      EmailClassification classification,
      EmailSnapshot snapshot) {
    if (classification == null) {
      entity.setActionStatus("skipped");
      return;
    }
    String actionType = classification.actionType != null ? classification.actionType : "none";
    if (!"create_jira".equalsIgnoreCase(actionType)) {
      entity.setActionStatus("skipped");
      return;
    }
    TenantServiceConfig config =
        configRepository.findByTenantIdAndServiceCode(entity.getTenantId(), entity.getServiceCode())
            .orElse(null);
    boolean jiraEnabled = resolveCapability(
        config != null ? config.getJiraEnabled() : null, service.isJiraEnabled());
    if (!jiraEnabled) {
      entity.setActionStatus("skipped");
      return;
    }
    String projectKey =
        config != null && config.getJiraProjectKey() != null && !config.getJiraProjectKey().isBlank()
            ? config.getJiraProjectKey()
            : service.getJiraProjectKey();
    if (projectKey == null || projectKey.isBlank()) {
      entity.setActionStatus("error");
      entity.setErrorMessage("Jira project key missing");
      return;
    }
    String issueType =
        config != null && config.getJiraDefaultIssueType() != null && !config.getJiraDefaultIssueType().isBlank()
            ? config.getJiraDefaultIssueType()
            : (service.getJiraDefaultIssueType() != null && !service.getJiraDefaultIssueType().isBlank()
                ? service.getJiraDefaultIssueType()
                : "Task");

    TenantServiceJiraService.ResolvedJira resolved =
        jiraService.resolve(entity.getTenantId(), entity.getServiceCode());
    if (resolved == null
        || resolved.baseUrl == null
        || resolved.baseUrl.isBlank()
        || resolved.email == null
        || resolved.email.isBlank()
        || resolved.apiToken == null
        || resolved.apiToken.isBlank()) {
      entity.setActionStatus("error");
      entity.setErrorMessage("Jira credentials not configured");
      return;
    }
    String summary =
        classification.summary != null && !classification.summary.isBlank()
            ? classification.summary
            : (snapshot.subject != null ? snapshot.subject : "Solicitud recibida");
    String description = buildJiraDescription(snapshot);
    String priority = null;
    if (config != null && Boolean.TRUE.equals(config.getJiraAllowUserPriorityOverride())) {
      priority = classification.priority;
    }

    try {
      JiraIssueClient client = new JiraIssueClient(objectMapper);
      JiraIssueClient.IssueResult result =
          client.createIssue(resolved, projectKey, summary, description, issueType, priority);
      entity.setJiraIssueKey(result.key);
      entity.setJiraIssueUrl(result.url);
      entity.setActionStatus("success");
    } catch (Exception ex) {
      entity.setActionStatus("error");
      entity.setErrorMessage(ex.getMessage());
    }
  }

  private String buildJiraDescription(EmailSnapshot snapshot) {
    StringBuilder builder = new StringBuilder();
    builder.append("Email recibido automáticamente.\n\n");
    if (snapshot.subject != null) {
      builder.append("Asunto: ").append(snapshot.subject).append("\n");
    }
    if (snapshot.fromEmail != null) {
      builder.append("De: ").append(snapshot.fromEmail).append("\n");
    }
    if (snapshot.receivedAt != null) {
      builder.append("Fecha: ").append(snapshot.receivedAt).append("\n");
    }
    builder.append("\nContenido:\n");
    if (snapshot.bodyText != null) {
      builder.append(snapshot.bodyText.length() > 4000
          ? snapshot.bodyText.substring(0, 4000)
          : snapshot.bodyText);
    }
    return builder.toString();
  }

  private void validateAccountRequest(EmailAccountRequest request, boolean requirePassword) {
    if (request == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing email account payload");
    }
    if (request.email == null || request.email.trim().isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email address required");
    }
    if (!EMAIL_PATTERN.matcher(request.email.trim()).matches()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid email address");
    }
    if (request.host == null || request.host.trim().isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "IMAP host required");
    }
    if (request.username == null || request.username.trim().isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username required");
    }
    if (requirePassword && (request.password == null || request.password.trim().isBlank())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password required");
    }
    if (request.port != null) {
      if (request.port < 1 || request.port > 65535) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid port number");
      }
    }
    boolean useSsl = request.useSsl != null ? request.useSsl : true;
    boolean useStartTls = request.useStartTls != null ? request.useStartTls : false;
    if (useSsl && useStartTls) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST, "SSL and STARTTLS cannot be enabled together");
    }
  }

  private void applyAccount(
      TenantServiceEmailAccount account,
      EmailAccountRequest request,
      boolean creating) {
    account.setLabel(trim(request.label));
    account.setEmail(request.email.trim().toLowerCase());
    account.setProvider("imap");
    account.setHost(request.host.trim());
    account.setPort(request.port != null && request.port > 0 ? request.port : null);
    account.setUsername(request.username.trim());
    account.setFolder(trim(request.folder));
    account.setUseSsl(request.useSsl != null ? request.useSsl : true);
    account.setUseStartTls(request.useStartTls != null ? request.useStartTls : false);
    account.setEnabled(request.enabled == null || request.enabled);
    if (request.password != null) {
      String trimmed = request.password.trim();
      account.setEncryptedPassword(trimmed.isBlank() ? null : encryptionService.encrypt(trimmed));
    } else if (creating) {
      account.setEncryptedPassword(null);
    }
  }

  private String trim(String value) {
    if (value == null) {
      return null;
    }
    String trimmed = value.trim();
    return trimmed.isBlank() ? null : trimmed;
  }

  private String safe(String value) {
    return value == null ? "" : value;
  }

  private String buildMessageKey(EmailSnapshot snapshot) {
    String base =
        snapshot.messageId != null
            ? snapshot.messageId
            : (safe(snapshot.fromEmail) + "|" + safe(snapshot.subject) + "|" +
                (snapshot.receivedAt != null ? snapshot.receivedAt.toString() : ""));
    return sha256(base);
  }

  private String sha256(String value) {
    try {
      MessageDigest digest = MessageDigest.getInstance("SHA-256");
      byte[] hash = digest.digest(value.getBytes(StandardCharsets.UTF_8));
      return Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
    } catch (Exception ex) {
      return UUID.randomUUID().toString().replace("-", "");
    }
  }

  private String extractContent(Object response) {
    if (!(response instanceof Map<?, ?> map)) {
      return null;
    }
    Object output = map.get("output");
    if (!(output instanceof Map<?, ?> outputMap)) {
      return null;
    }
    Object choices = outputMap.get("choices");
    if (choices instanceof List<?> list && !list.isEmpty()) {
      Object first = list.get(0);
      if (first instanceof Map<?, ?> firstMap) {
        Object message = firstMap.get("message");
        if (message instanceof Map<?, ?> messageMap) {
          Object content = messageMap.get("content");
          if (content != null) {
            return String.valueOf(content);
          }
        }
        Object text = firstMap.get("text");
        if (text != null) {
          return String.valueOf(text);
        }
      }
    }
    Object responseField = outputMap.get("response");
    return responseField != null ? String.valueOf(responseField) : null;
  }

  private String stripJsonFence(String value) {
    String trimmed = value.trim();
    if (trimmed.startsWith("```")) {
      int start = trimmed.indexOf("\n");
      int end = trimmed.lastIndexOf("```");
      if (start > 0 && end > start) {
        return trimmed.substring(start + 1, end).trim();
      }
    }
    return trimmed;
  }

  private String asString(Object value, String fallback) {
    if (value == null) {
      return fallback;
    }
    String text = String.valueOf(value).trim();
    return text.isBlank() ? fallback : text;
  }

  private String resolveModel() {
    String fromEnv = System.getenv("EMAIL_AUTOMATION_MODEL");
    if (fromEnv != null && !fromEnv.isBlank()) {
      return fromEnv.trim();
    }
    return DEFAULT_MODEL;
  }

  private boolean resolveCapability(Boolean override, boolean catalogEnabled) {
    if (!catalogEnabled) {
      return false;
    }
    if (override == null) {
      return true;
    }
    return override;
  }

  private ServiceCatalog requireEmailAutomationService(String serviceCode) {
    ServiceCatalog service =
        serviceCatalogRepository
            .findByCode(serviceCode)
            .orElseThrow(
                () ->
                    new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Service not found"));
    if (!service.isEmailAutomationEnabled()) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST, "Service does not support email automation");
    }
    return service;
  }

  public static class EmailAccountRequest {
    public String label;
    public String email;
    public String host;
    public Integer port;
    public String username;
    public String password;
    public String folder;
    public Boolean useSsl;
    public Boolean useStartTls;
    public Boolean enabled;
  }

  public static class EmailAccountResponse {
    public String id;
    public String label;
    public String email;
    public String host;
    public Integer port;
    public String username;
    public String folder;
    public boolean useSsl;
    public boolean useStartTls;
    public boolean enabled;
    public boolean hasPassword;
    public LocalDateTime lastSyncAt;

    public static EmailAccountResponse fromEntity(TenantServiceEmailAccount entity) {
      EmailAccountResponse response = new EmailAccountResponse();
      response.id = entity.getId();
      response.label = entity.getLabel();
      response.email = entity.getEmail();
      response.host = entity.getHost();
      response.port = entity.getPort();
      response.username = entity.getUsername();
      response.folder = entity.getFolder();
      response.useSsl = entity.isUseSsl();
      response.useStartTls = entity.isUseStartTls();
      response.enabled = entity.isEnabled();
      response.hasPassword =
          entity.getEncryptedPassword() != null && !entity.getEncryptedPassword().isBlank();
      response.lastSyncAt = entity.getLastSyncAt();
      return response;
    }
  }

  public static class EmailMessageResponse {
    public String id;
    public String accountId;
    public String subject;
    public String fromEmail;
    public String fromName;
    public LocalDateTime receivedAt;
    public String status;
    public String intent;
    public String priority;
    public String actionType;
    public String actionStatus;
    public String jiraIssueKey;
    public String jiraIssueUrl;
    public String bodyPreview;

    public static EmailMessageResponse fromEntity(TenantServiceEmailMessage entity) {
      EmailMessageResponse response = new EmailMessageResponse();
      response.id = entity.getId();
      response.accountId = entity.getAccountId();
      response.subject = entity.getSubject();
      response.fromEmail = entity.getFromEmail();
      response.fromName = entity.getFromName();
      response.receivedAt = entity.getReceivedAt();
      response.status = entity.getStatus();
      response.intent = entity.getIntent();
      response.priority = entity.getPriority();
      response.actionType = entity.getActionType();
      response.actionStatus = entity.getActionStatus();
      response.jiraIssueKey = entity.getJiraIssueKey();
      response.jiraIssueUrl = entity.getJiraIssueUrl();
      response.bodyPreview = buildPreview(entity.getBodyText());
      return response;
    }

    private static String buildPreview(String value) {
      if (value == null || value.isBlank()) {
        return null;
      }
      String trimmed = value.trim();
      if (trimmed.length() <= TenantServiceEmailService.MAX_PREVIEW_CHARS) {
        return trimmed;
      }
      return trimmed.substring(0, TenantServiceEmailService.MAX_PREVIEW_CHARS) + "...";
    }
  }

  private static class EmailSnapshot {
    final String messageId;
    final String subject;
    final String fromName;
    final String fromEmail;
    final LocalDateTime receivedAt;
    final String bodyText;

    private EmailSnapshot(
        String messageId,
        String subject,
        String fromName,
        String fromEmail,
        LocalDateTime receivedAt,
        String bodyText) {
      this.messageId = messageId;
      this.subject = subject;
      this.fromName = fromName;
      this.fromEmail = fromEmail;
      this.receivedAt = receivedAt;
      this.bodyText = bodyText;
    }

    static EmailSnapshot from(Message message) throws Exception {
      String messageId = null;
      String[] messageIdHeader = message.getHeader("Message-ID");
      if (messageIdHeader != null && messageIdHeader.length > 0) {
        messageId = messageIdHeader[0];
      }
      String subject = message.getSubject();
      String fromName = null;
      String fromEmail = null;
      if (message.getFrom() != null && message.getFrom().length > 0) {
        InternetAddress address = (InternetAddress) message.getFrom()[0];
        fromName = address.getPersonal();
        fromEmail = address.getAddress();
      }
      Date received = message.getReceivedDate();
      LocalDateTime receivedAt =
          received != null
              ? LocalDateTime.ofInstant(received.toInstant(), ZoneOffset.UTC)
              : LocalDateTime.ofInstant(Instant.now(), ZoneOffset.UTC);
      String bodyText = extractText(message);
      return new EmailSnapshot(messageId, subject, fromName, fromEmail, receivedAt, bodyText);
    }

    private static String extractText(Part part) throws Exception {
      if (part.isMimeType("text/*")) {
        Object content = part.getContent();
        return content != null ? String.valueOf(content) : "";
      }
      if (part.isMimeType("multipart/alternative")) {
        Multipart multipart = (Multipart) part.getContent();
        String html = null;
        for (int i = 0; i < multipart.getCount(); i++) {
          Part bodyPart = multipart.getBodyPart(i);
          if (bodyPart.isMimeType("text/plain")) {
            return String.valueOf(bodyPart.getContent());
          }
          if (bodyPart.isMimeType("text/html")) {
            html = String.valueOf(bodyPart.getContent());
          }
        }
        return html != null ? html.replaceAll("<[^>]+>", " ") : "";
      }
      if (part.isMimeType("multipart/*")) {
        Multipart multipart = (Multipart) part.getContent();
        for (int i = 0; i < multipart.getCount(); i++) {
          String text = extractText(multipart.getBodyPart(i));
          if (text != null && !text.isBlank()) {
            return text;
          }
        }
      }
      return "";
    }
  }

  private static class EmailClassification {
    final String intent;
    final String priority;
    final String actionType;
    final String summary;
    final String rawJson;

    EmailClassification(
        String intent,
        String priority,
        String actionType,
        String summary,
        String rawJson) {
      this.intent = intent;
      this.priority = priority;
      this.actionType = actionType;
      this.summary = summary;
      this.rawJson = rawJson;
    }
  }

  private static class JiraIssueClient {
    private final ObjectMapper objectMapper;
    private final java.net.http.HttpClient httpClient = java.net.http.HttpClient.newHttpClient();

    JiraIssueClient(ObjectMapper objectMapper) {
      this.objectMapper = objectMapper;
    }

    IssueResult createIssue(
        TenantServiceJiraService.ResolvedJira jira,
        String projectKey,
        String summary,
        String description,
        String issueType,
        String priority)
        throws Exception {
      Map<String, Object> fields = new java.util.HashMap<>();
      fields.put("project", Map.of("key", projectKey));
      fields.put("summary", summary);
      fields.put("description", description);
      fields.put("issuetype", Map.of("name", issueType));
      if (priority != null && !priority.isBlank()) {
        fields.put("priority", Map.of("name", priority));
      }
      Map<String, Object> payload = Map.of("fields", fields);
      String endpoint = jira.baseUrl.replaceAll("/+$", "") + "/rest/api/2/issue";
      String auth =
          Base64.getEncoder()
              .encodeToString((jira.email + ":" + jira.apiToken).getBytes(StandardCharsets.UTF_8));
      String body = objectMapper.writeValueAsString(payload);
      java.net.http.HttpRequest request =
          java.net.http.HttpRequest.newBuilder()
              .uri(java.net.URI.create(endpoint))
              .header("Authorization", "Basic " + auth)
              .header("Content-Type", "application/json")
              .POST(java.net.http.HttpRequest.BodyPublishers.ofString(body))
              .build();
      java.net.http.HttpResponse<String> response =
          httpClient.send(request, java.net.http.HttpResponse.BodyHandlers.ofString());
      if (response.statusCode() < 200 || response.statusCode() >= 300) {
        throw new ResponseStatusException(
            HttpStatus.BAD_GATEWAY,
            "Jira error " + response.statusCode() + ": " + response.body());
      }
      Map<String, Object> result =
          objectMapper.readValue(response.body(), new TypeReference<>() {});
      String key = result.get("key") != null ? String.valueOf(result.get("key")) : null;
      String url =
          key != null ? jira.baseUrl.replaceAll("/+$", "") + "/browse/" + key : null;
      return new IssueResult(key, url);
    }

    static class IssueResult {
      final String key;
      final String url;

      IssueResult(String key, String url) {
        this.key = key;
        this.url = url;
      }
    }
  }
}
