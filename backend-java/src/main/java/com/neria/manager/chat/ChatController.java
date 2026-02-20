package com.neria.manager.chat;

import com.neria.manager.common.entities.ChatConversation;
import com.neria.manager.common.security.AuthContext;
import com.neria.manager.common.security.AuthUtils;
import com.neria.manager.documents.DocumentProcessingService;
import com.neria.manager.emailautomation.TenantServiceEmailService;
import com.neria.manager.jira.JiraIssuesService;
import com.neria.manager.storage.StorageUploadService;
import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/chat")
public class ChatController {
  private final ChatService chatService;
  private final ChatAuthService chatAuthService;
  private final StorageUploadService storageUploadService;
  private final DocumentProcessingService documentProcessingService;
  private final JiraIssuesService jiraIssuesService;
  private final TenantServiceEmailService emailService;
  private final ExecutorService streamExecutor = Executors.newCachedThreadPool();

  public ChatController(
      ChatService chatService,
      ChatAuthService chatAuthService,
      StorageUploadService storageUploadService,
      DocumentProcessingService documentProcessingService,
      JiraIssuesService jiraIssuesService,
      TenantServiceEmailService emailService) {
    this.chatService = chatService;
    this.chatAuthService = chatAuthService;
    this.storageUploadService = storageUploadService;
    this.documentProcessingService = documentProcessingService;
    this.jiraIssuesService = jiraIssuesService;
    this.emailService = emailService;
  }

  private Claims requireChatToken(HttpServletRequest request, String tenantId) {
    String token = request.getHeader("x-chat-token");
    if (token == null || token.isBlank()) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing chat token");
    }
    Claims claims = chatAuthService.validateToken(token);
    Object tokenTenant = claims.get("tenantId");
    if (tokenTenant != null && !tenantId.equals(String.valueOf(tokenTenant))) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Tenant mismatch");
    }
    return claims;
  }

  private String requireUserId(Claims claims) {
    String userId = claims.getSubject();
    if (userId == null || userId.isBlank()) {
      Object raw = claims.get("sub");
      userId = raw != null ? String.valueOf(raw) : null;
    }
    if (userId == null || userId.isBlank()) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing chat user");
    }
    return userId;
  }

  private String resolveTenantId(HttpServletRequest request) {
    AuthContext auth = AuthUtils.requireAuth(request);
    return AuthUtils.resolveTenantId(auth, request);
  }

  private boolean isEndpointDebugEnabled() {
    return "true".equalsIgnoreCase(System.getenv("CHAT_ENDPOINT_DEBUG"));
  }

  private Map<String, String> extractForwardHeaders(HttpServletRequest request) {
    Map<String, String> headers = new LinkedHashMap<>();
    java.util.Set<String> allowed = new java.util.HashSet<>(
        List.of("authorization", "x-chat-token", "x-api-key", "x-tenant-id"));
    String forwardList = request.getHeader("x-forward-headers");
    if (forwardList != null && !forwardList.isBlank()) {
      for (String name : forwardList.split(",")) {
        if (name == null || name.isBlank()) {
          continue;
        }
        allowed.add(name.trim().toLowerCase(java.util.Locale.ROOT));
      }
    }
    java.util.Enumeration<String> headerNames = request.getHeaderNames();
    if (headerNames == null) {
      return headers;
    }
    while (headerNames.hasMoreElements()) {
      String name = headerNames.nextElement();
      if (name == null) {
        continue;
      }
      String lower = name.toLowerCase(java.util.Locale.ROOT);
      if (lower.equals("cookie")
          || lower.equals("host")
          || lower.equals("content-length")
          || lower.equals("content-type")
          || lower.equals("user-agent")
          || lower.equals("accept")
          || lower.equals("origin")
          || lower.equals("referer")
          || lower.equals("x-forward-headers")) {
        continue;
      }
      boolean shouldForward =
          allowed.contains(lower) || lower.startsWith("x-") || lower.contains("token");
      if (!shouldForward) {
        continue;
      }
      String value = request.getHeader(name);
      if (value == null || value.isBlank()) {
        continue;
      }
      headers.put(name, value);
    }
    return headers;
  }

  @GetMapping("/conversations")
  public Object listConversations(
      HttpServletRequest request,
      @RequestParam(name = "serviceCode", required = false) String serviceCode,
      @RequestParam(name = "pageNumber", required = false) Integer pageNumber,
      @RequestParam(name = "pageSize", required = false) Integer pageSize) {
    String tenantId = resolveTenantId(request);
    Claims claims = requireChatToken(request, tenantId);
    String userId = requireUserId(claims);
    if (pageNumber != null || pageSize != null) {
      int resolvedPage = pageNumber != null ? pageNumber : 1;
      int resolvedSize = pageSize != null ? pageSize : 50;
      var page = chatService.listConversationsPaged(tenantId, userId, serviceCode, resolvedPage, resolvedSize);
      return Map.of(
          "pageNumber", resolvedPage,
          "pageSize", resolvedSize,
          "totalRegisters", page.getTotalElements(),
          "list", page.getContent());
    }
    return chatService.listConversations(tenantId, userId, serviceCode);
  }

  @GetMapping("/services")
  public Object listServices(HttpServletRequest request) {
    String tenantId = resolveTenantId(request);
    Claims claims = requireChatToken(request, tenantId);
    String userId = requireUserId(claims);
    return chatService.listUserServices(tenantId, userId);
  }

  @GetMapping("/services/{serviceCode}/endpoints")
  public Object listServiceEndpoints(
      HttpServletRequest request, @PathVariable String serviceCode) {
    String tenantId = resolveTenantId(request);
    Claims claims = requireChatToken(request, tenantId);
    String userId = requireUserId(claims);
    return chatService.listServiceEndpoints(tenantId, userId, serviceCode);
  }

  @GetMapping("/email/messages")
  public Object listEmailMessages(
      HttpServletRequest request,
      @RequestParam("serviceCode") String serviceCode,
      @RequestParam(name = "limit", required = false, defaultValue = "50") int limit) {
    String tenantId = resolveTenantId(request);
    Claims claims = requireChatToken(request, tenantId);
    String userId = requireUserId(claims);
    if (serviceCode == null || serviceCode.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing serviceCode");
    }
    chatService.requireServiceAccess(tenantId, serviceCode.trim(), userId);
    return emailService.listMessagesForChat(tenantId, serviceCode.trim(), limit);
  }

  @PostMapping("/conversations")
  public Object createConversation(
      HttpServletRequest request, @RequestBody ChatService.CreateConversationRequest dto) {
    String tenantId = resolveTenantId(request);
    Claims claims = requireChatToken(request, tenantId);
    String userId = requireUserId(claims);
    AuthContext auth = AuthUtils.requireAuth(request);
    String apiKeyId = auth.getApiKeyId();
    return chatService.createConversation(tenantId, userId, apiKeyId, dto);
  }

  @GetMapping("/conversations/{id}")
  public Object getConversation(HttpServletRequest request, @PathVariable String id) {
    String tenantId = resolveTenantId(request);
    Claims claims = requireChatToken(request, tenantId);
    String userId = requireUserId(claims);
    return chatService.getConversationForUser(tenantId, userId, id);
  }

  @GetMapping("/conversations/{id}/messages")
  public Object listMessages(HttpServletRequest request, @PathVariable String id) {
    String tenantId = resolveTenantId(request);
    Claims claims = requireChatToken(request, tenantId);
    String userId = requireUserId(claims);
    return chatService.listMessagesForUser(tenantId, userId, id);
  }

  @PostMapping("/conversations/{id}/messages")
  public Object addMessage(
      HttpServletRequest request,
      @PathVariable String id,
      @RequestBody ChatService.CreateMessageRequest dto) {
    String tenantId = resolveTenantId(request);
    Claims claims = requireChatToken(request, tenantId);
    String userId = requireUserId(claims);
    AuthContext auth = AuthUtils.requireAuth(request);
    String apiKeyId = auth.getApiKeyId();
    Map<String, String> forwardHeaders = extractForwardHeaders(request);
    return chatService.addMessage(tenantId, userId, apiKeyId, id, dto, forwardHeaders);
  }

    @PostMapping(value = "/uploads", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public Object uploadAttachmentWithoutConversation(
      HttpServletRequest request,
      @RequestParam("file") MultipartFile file,
      @RequestParam("serviceCode") String serviceCode) {
    String tenantId = resolveTenantId(request);
    Claims claims = requireChatToken(request, tenantId);
    String userId = requireUserId(claims);
    if (serviceCode == null || serviceCode.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing serviceCode");
    }
    if (file == null || file.isEmpty()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing file");
    }
    var access = chatService.requireServiceAccess(tenantId, serviceCode.trim(), userId);
    if (access != null && !access.fileStorageEnabled) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "File storage not enabled for this service");
    }
    var upload = storageUploadService.upload(tenantId, serviceCode.trim(), file);
    var fileRecord =
        documentProcessingService.registerUpload(
            tenantId, serviceCode.trim(), null, upload, access);
    return buildUploadResponse(upload, fileRecord);
  }

@PostMapping(value = "/conversations/{id}/uploads", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public Object uploadAttachment(
      HttpServletRequest request,
      @PathVariable String id,
      @RequestParam("file") MultipartFile file) {
    String tenantId = resolveTenantId(request);
    Claims claims = requireChatToken(request, tenantId);
    String userId = requireUserId(claims);
    ChatConversation conversation = chatService.getConversationForUser(tenantId, userId, id);
    var access = chatService.requireServiceAccess(tenantId, conversation.getServiceCode(), userId);
    if (access != null && !access.fileStorageEnabled) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "File storage not enabled for this service");
    }
    if (file == null || file.isEmpty()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing file");
    }
    var upload = storageUploadService.upload(tenantId, conversation.getServiceCode(), file);
    var fileRecord =
        documentProcessingService.registerUpload(
            tenantId, conversation.getServiceCode(), conversation.getId(), upload, access);
    return buildUploadResponse(upload, fileRecord);
  }

  @GetMapping("/conversations/{id}/files")
  public Object listConversationFiles(HttpServletRequest request, @PathVariable String id) {
    String tenantId = resolveTenantId(request);
    Claims claims = requireChatToken(request, tenantId);
    String userId = requireUserId(claims);
    ChatConversation conversation = chatService.getConversationForUser(tenantId, userId, id);
    return documentProcessingService.listFilesForConversation(
        tenantId, conversation.getId())
        .stream()
        .map(documentProcessingService::toResponse)
        .toList();
  }

  @PostMapping("/conversations/{id}/handoff")
  public Object requestHandoff(
      HttpServletRequest request,
      @PathVariable String id,
      @RequestBody Map<String, Object> payload) {
    String tenantId = resolveTenantId(request);
    Claims claims = requireChatToken(request, tenantId);
    String userId = requireUserId(claims);
    String reason = payload != null ? String.valueOf(payload.getOrDefault("reason", "")) : "";
    return chatService.requestHandoff(tenantId, userId, id, reason);
  }

  @PostMapping("/conversations/{id}/handoff/resolve")
  public Object resolveHandoff(HttpServletRequest request, @PathVariable String id) {
    String tenantId = resolveTenantId(request);
    Claims claims = requireChatToken(request, tenantId);
    String userId = requireUserId(claims);
    return chatService.resolveHandoffForUser(tenantId, userId, id);
  }

  @PostMapping("/conversations/{id}/jira-issues")
  public Object createJiraIssue(
      HttpServletRequest request,
      @PathVariable String id,
      @RequestBody JiraIssuesService.CreateJiraIssueRequest dto) {
    String tenantId = resolveTenantId(request);
    Claims claims = requireChatToken(request, tenantId);
    String userId = requireUserId(claims);
    return jiraIssuesService.createIssue(tenantId, userId, id, dto);
  }

  @PostMapping(value = "/conversations/{id}/messages/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
  public SseEmitter addMessageStream(
      HttpServletRequest request,
      @PathVariable String id,
      @RequestBody ChatService.CreateMessageRequest dto) {
    String tenantId = resolveTenantId(request);
    Claims claims = requireChatToken(request, tenantId);
    String userId = requireUserId(claims);
    AuthContext auth = AuthUtils.requireAuth(request);
    String apiKeyId = auth.getApiKeyId();

    SseEmitter emitter = new SseEmitter(0L);
    streamExecutor.execute(
        () -> {
          try {
            ChatService.AddMessageResult result =
                chatService.addMessageForStreaming(tenantId, userId, apiKeyId, id, dto, extractForwardHeaders(request));
            if (isEndpointDebugEnabled() && result.endpointDebug != null) {
              emitter.send(
                  SseEmitter.event()
                      .name("debug")
                      .data(Map.of("debug", Map.of("endpoints", result.endpointDebug))));
            }
            String content =
                result.message != null && result.message.getContent() != null
                    ? result.message.getContent()
                    : "";
            if ((content == null || content.isBlank()) && result.output instanceof Map<?, ?> map) {
              Object handoff = map.get("handoff");
              if (handoff instanceof Boolean && (Boolean) handoff) {
                content = "Tu mensaje ha sido enviado a un agente humano. Te responderán en breve.";
              }
            }
            List<String> chunks = splitChunks(content);
            for (String chunk : chunks) {
              emitter.send(
                  SseEmitter.event()
                      .name("delta")
                      .data(
                          Map.of(
                              "delta", chunk,
                              "conversationId", result.conversationId)));
              Thread.sleep(15);
            }
            emitter.send(
                SseEmitter.event()
                    .name("done")
                    .data(Map.of("conversationId", result.conversationId, "done", true)));
            emitter.complete();
          } catch (Exception ex) {
            emitter.completeWithError(ex);
          }
        });
    return emitter;
  }

  private List<String> splitChunks(String content) {
    List<String> chunks = new ArrayList<>();
    if (content == null || content.isBlank()) {
      return chunks;
    }
    int size = 24;
    for (int i = 0; i < content.length(); i += size) {
      chunks.add(content.substring(i, Math.min(content.length(), i + size)));
    }
    return chunks;
  }

  private Map<String, Object> buildUploadResponse(
      StorageUploadService.UploadResult upload, com.neria.manager.common.entities.TenantServiceFile file) {
    Map<String, Object> response = new LinkedHashMap<>();
    if (upload != null) {
      response.put("provider", upload.provider);
      response.put("url", upload.url);
      response.put("storageKey", upload.storageKey);
      response.put("originalName", upload.originalName);
      response.put("contentType", upload.contentType);
      response.put("size", upload.size);
    }
    if (file != null) {
      response.put("fileId", file.getId());
      response.put("status", file.getStatus());
      response.put("ocrStatus", file.getOcrStatus());
      response.put("semanticStatus", file.getSemanticStatus());
      response.put("embeddingStatus", file.getEmbeddingStatus());
      response.put("embeddingCount", file.getEmbeddingCount());
      response.put("resultType", file.getResultType());
      response.put("resultFileUrl", file.getResultFileUrl());
    }
    return response;
  }
}
