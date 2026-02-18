package com.neria.manager.documents;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.neria.manager.common.entities.OcrDocument;
import com.neria.manager.common.entities.PricingModel;
import com.neria.manager.common.entities.TenantServiceConfig;
import com.neria.manager.common.entities.TenantServiceEmbedding;
import com.neria.manager.common.entities.TenantServiceFile;
import com.neria.manager.common.repos.TenantServiceConfigRepository;
import com.neria.manager.common.repos.TenantServiceEmbeddingRepository;
import com.neria.manager.common.repos.TenantServiceFileRepository;
import com.neria.manager.ocr.OcrDocumentsService;
import com.neria.manager.pricing.PricingService;
import com.neria.manager.runtime.ExecuteRequest;
import com.neria.manager.runtime.RuntimeService;
import com.neria.manager.storage.StorageUploadService;
import com.neria.manager.tenantservices.TenantServicesService;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import net.sourceforge.tess4j.Tesseract;
import net.sourceforge.tess4j.TesseractException;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.PDFRenderer;
import javax.imageio.ImageIO;

@Service
public class DocumentProcessingService {
  private static final Logger log = LoggerFactory.getLogger(DocumentProcessingService.class);
  private static final int MAX_OCR_CHARS = 20000;
  private static final int MAX_CONTEXT_CHARS = 2500;
  private static final int MAX_PDF_PAGES = 6;
  private static final int OCR_DPI = 200;
  private static final int EMBEDDING_CHUNK_CHARS = 1200;
  private static final int MAX_EMBEDDING_CHUNKS = 40;

  private final TenantServiceFileRepository fileRepository;
  private final TenantServiceConfigRepository configRepository;
  private final TenantServiceEmbeddingRepository embeddingRepository;
  private final TenantServicesService tenantServicesService;
  private final OcrDocumentsService ocrDocumentsService;
  private final RuntimeService runtimeService;
  private final PricingService pricingService;
  private final EmbeddingsService embeddingsService;
  private final StorageUploadService storageUploadService;
  private final ObjectMapper objectMapper;
  private final ExecutorService executor = Executors.newFixedThreadPool(2);
  private final HttpClient httpClient =
      HttpClient.newBuilder().connectTimeout(java.time.Duration.ofSeconds(12)).build();
  private final ThreadLocal<Tesseract> tesseractProvider = ThreadLocal.withInitial(this::buildTesseract);

  public DocumentProcessingService(
      TenantServiceFileRepository fileRepository,
      TenantServiceConfigRepository configRepository,
      TenantServiceEmbeddingRepository embeddingRepository,
      TenantServicesService tenantServicesService,
      OcrDocumentsService ocrDocumentsService,
      RuntimeService runtimeService,
      PricingService pricingService,
      EmbeddingsService embeddingsService,
      StorageUploadService storageUploadService,
      ObjectMapper objectMapper) {
    this.fileRepository = fileRepository;
    this.configRepository = configRepository;
    this.embeddingRepository = embeddingRepository;
    this.tenantServicesService = tenantServicesService;
    this.ocrDocumentsService = ocrDocumentsService;
    this.runtimeService = runtimeService;
    this.pricingService = pricingService;
    this.embeddingsService = embeddingsService;
    this.storageUploadService = storageUploadService;
    this.objectMapper = objectMapper;
  }

  public TenantServiceFile registerUpload(
      String tenantId,
      String serviceCode,
      String conversationId,
      StorageUploadService.UploadResult upload,
      TenantServicesService.ServiceAccess access) {
    TenantServiceConfig config = access != null ? access.config : null;

    TenantServiceFile file = new TenantServiceFile();
    file.setId(UUID.randomUUID().toString());
    file.setTenantId(tenantId);
    file.setServiceCode(serviceCode);
    file.setConversationId(conversationId);
    file.setOriginalName(upload.originalName != null ? upload.originalName : "archivo");
    file.setContentType(upload.contentType);
    file.setSizeBytes(upload.size);
    file.setStorageProvider(upload.provider != null ? upload.provider : "storage");
    file.setStorageKey(upload.storageKey != null ? upload.storageKey : "");
    file.setStorageUrl(upload.url != null ? upload.url : "");
    file.setStatus("uploaded");
    file.setOcrStatus("pending");
    file.setSemanticStatus("pending");
    file.setEmbeddingStatus("pending");
    file.setDocumentDomain(config != null ? config.getDocumentDomain() : null);
    file.setCreatedAt(LocalDateTime.now());
    file.setUpdatedAt(LocalDateTime.now());
    file.setMetadata(
        toJson(
            Map.of(
                "serviceCode", serviceCode,
                "conversationId", conversationId == null ? "" : conversationId)));

    boolean docEnabled = access != null && access.documentProcessingEnabled;
    boolean ocrEnabled = access != null && access.ocrEnabled;
    boolean semanticEnabled = access != null && access.semanticSearchEnabled;

    if (!docEnabled) {
      file.setOcrStatus("skipped");
      file.setSemanticStatus("skipped");
      file.setEmbeddingStatus("skipped");
    } else {
      if (!ocrEnabled) {
        file.setOcrStatus("skipped");
      }
      if (!semanticEnabled) {
        file.setSemanticStatus("skipped");
        file.setEmbeddingStatus("skipped");
      }
      file.setStatus("processing");
    }

    TenantServiceFile saved = fileRepository.save(file);

    if (docEnabled && (ocrEnabled || semanticEnabled)) {
      executor.execute(() -> processAsync(saved.getId()));
    }

    return saved;
  }

  public List<TenantServiceFile> listFilesForConversation(String tenantId, String conversationId) {
    return fileRepository.findByTenantIdAndConversationIdOrderByCreatedAtDesc(
        tenantId, conversationId);
  }

  public void attachFilesToConversation(
      String tenantId,
      String conversationId,
      List<com.neria.manager.chat.ChatService.AttachmentPayload> attachments) {
    if (attachments == null || attachments.isEmpty()) {
      return;
    }
    for (var attachment : attachments) {
      if (attachment == null || attachment.fileId == null || attachment.fileId.isBlank()) {
        continue;
      }
      TenantServiceFile file = fileRepository.findByIdAndTenantId(attachment.fileId, tenantId).orElse(null);
      if (file == null) {
        continue;
      }
      if (file.getConversationId() == null || file.getConversationId().isBlank()) {
        file.setConversationId(conversationId);
        file.setUpdatedAt(LocalDateTime.now());
        fileRepository.save(file);
      }
    }
  }

  public TenantServiceFile getFile(String tenantId, String fileId) {
    return fileRepository.findByIdAndTenantId(fileId, tenantId).orElse(null);
  }

  public String buildDocumentContext(
      String tenantId, String serviceCode, String conversationId, String userMessage) {
    if (!tenantServicesService.resolveDocumentProcessingEnabled(tenantId, serviceCode)) {
      return null;
    }
    if (conversationId == null || conversationId.isBlank()) {
      return null;
    }
    List<TenantServiceFile> files =
        fileRepository.findByTenantIdAndConversationIdOrderByCreatedAtDesc(
            tenantId, conversationId);
    if (files.isEmpty()) {
      return null;
    }
    List<String> tokens = extractTokens(userMessage);
    boolean semanticEnabled =
        tenantServicesService.resolveSemanticSearchEnabled(tenantId, serviceCode);

    if (semanticEnabled) {
      String embeddingContext =
          buildEmbeddingContext(tenantId, serviceCode, conversationId, userMessage, files);
      if (embeddingContext != null && !embeddingContext.isBlank()) {
        return embeddingContext;
      }
    }

    List<String> blocks = new ArrayList<>();
    int added = 0;

    for (TenantServiceFile file : files) {
      if (!"done".equalsIgnoreCase(file.getOcrStatus()) || file.getOcrDocumentId() == null) {
        continue;
      }
      String content = getOcrContent(tenantId, file.getOcrDocumentId());
      if (content == null || content.isBlank()) {
        continue;
      }
      if (semanticEnabled && !matchesTokens(content, tokens)) {
        continue;
      }
      blocks.add(formatDocumentBlock(file, content));
      added++;
      if (added >= 3) {
        break;
      }
    }

    if (blocks.isEmpty()) {
      for (TenantServiceFile file : files) {
        if (!"done".equalsIgnoreCase(file.getOcrStatus()) || file.getOcrDocumentId() == null) {
          continue;
        }
        String content = getOcrContent(tenantId, file.getOcrDocumentId());
        if (content == null || content.isBlank()) {
          continue;
        }
        blocks.add(formatDocumentBlock(file, content));
        if (blocks.size() >= 2) {
          break;
        }
      }
    }

    if (blocks.isEmpty()) {
      return null;
    }

    return String.join("\n\n", blocks);
  }

  private void processAsync(String fileId) {
    TenantServiceFile file = fileRepository.findById(fileId).orElse(null);
    if (file == null) {
      return;
    }
    TenantServiceConfig config =
        configRepository
            .findByTenantIdAndServiceCode(file.getTenantId(), file.getServiceCode())
            .orElse(null);
    boolean ocrEnabled = tenantServicesService.resolveOcrEnabled(
        file.getTenantId(), file.getServiceCode());
    boolean semanticEnabled = tenantServicesService.resolveSemanticSearchEnabled(
        file.getTenantId(), file.getServiceCode());

    String extracted = null;
    if (ocrEnabled) {
      file.setOcrStatus("processing");
      fileRepository.save(file);
      try {
        extracted = extractText(file);
        if (extracted == null || extracted.isBlank()) {
          file.setOcrStatus("failed");
          file.setErrorMessage("OCR sin contenido útil");
        } else {
          OcrDocument doc = createOcrDocument(file, extracted);
          file.setOcrDocumentId(doc.getId());
          file.setOcrStatus("done");
        }
      } catch (Exception ex) {
        file.setOcrStatus("failed");
        file.setErrorMessage("OCR failed: " + ex.getMessage());
        log.warn("OCR failed for file {}", file.getId(), ex);
      }
    }

    if (semanticEnabled) {
      file.setSemanticStatus("processing");
      if ("pending".equalsIgnoreCase(file.getEmbeddingStatus())) {
        file.setEmbeddingStatus("processing");
      }
      fileRepository.save(file);
      try {
        if (extracted == null || extracted.isBlank()) {
          extracted = extractText(file);
        }
        if (extracted == null || extracted.isBlank()) {
          file.setSemanticStatus("failed");
          file.setErrorMessage("Semantic processing sin OCR");
        } else {
          try {
            storeEmbeddings(file, config, extracted);
          } catch (Exception ex) {
            file.setEmbeddingStatus("failed");
            file.setErrorMessage(
                (file.getErrorMessage() != null ? file.getErrorMessage() + " | " : "")
                    + "Embeddings failed: "
                    + ex.getMessage());
            log.warn("Embeddings failed for file {}", file.getId(), ex);
          }
          String summary = buildSemanticSummary(file, config, extracted);
          if (summary == null || summary.isBlank()) {
            summary = buildFallbackSummary(extracted);
          }
          String outputType =
              config != null && config.getDocumentOutputType() != null
                  ? config.getDocumentOutputType()
                  : "markdown";
          applySummaryOutput(file, outputType, summary);
          if (!"failed".equalsIgnoreCase(file.getSemanticStatus())) {
            file.setSemanticStatus("done");
          }
        }
      } catch (Exception ex) {
        file.setSemanticStatus("failed");
        file.setErrorMessage("Semantic failed: " + ex.getMessage());
        log.warn("Semantic processing failed for file {}", file.getId(), ex);
      }
    }

    if ("processing".equals(file.getStatus())) {
      if ("failed".equalsIgnoreCase(file.getOcrStatus())
          || "failed".equalsIgnoreCase(file.getSemanticStatus())) {
        file.setStatus("failed");
      } else if ("done".equalsIgnoreCase(file.getOcrStatus())
          || "done".equalsIgnoreCase(file.getSemanticStatus())) {
        file.setStatus("ready");
      }
    }
    file.setUpdatedAt(LocalDateTime.now());
    fileRepository.save(file);
  }

  private OcrDocument createOcrDocument(TenantServiceFile file, String content) {
    OcrDocumentsService.CreateOcrDocumentRequest dto =
        new OcrDocumentsService.CreateOcrDocumentRequest();
    dto.title = file.getOriginalName();
    dto.source = file.getStorageUrl();
    dto.content = content;
    dto.enabled = true;
    dto.metadata =
        Map.of(
            "fileId", file.getId(),
            "serviceCode", file.getServiceCode(),
            "conversationId", file.getConversationId() == null ? "" : file.getConversationId());
    return ocrDocumentsService.create(file.getTenantId(), dto);
  }

  private String extractText(TenantServiceFile file) throws Exception {
    if (file.getStorageUrl() == null || file.getStorageUrl().isBlank()) {
      return null;
    }
    byte[] data = downloadFile(file.getStorageUrl());
    String contentType =
        file.getContentType() != null && !file.getContentType().isBlank()
            ? file.getContentType()
            : "";
    if (contentType.isBlank()) {
      contentType = detectContentType(file.getOriginalName(), data);
    }

    if (isTextual(contentType, file.getOriginalName())) {
      String text = new String(data, StandardCharsets.UTF_8);
      return truncate(text, MAX_OCR_CHARS);
    }

    if (isPdf(contentType, file.getOriginalName())) {
      return truncate(ocrPdf(data), MAX_OCR_CHARS);
    }

    if (isImage(contentType, file.getOriginalName())) {
      return truncate(ocrImage(data), MAX_OCR_CHARS);
    }

    throw new IllegalStateException("Content type no soportado para OCR: " + contentType);
  }

  private boolean isTextual(String contentType, String name) {
    if (contentType == null) {
      contentType = "";
    }
    String normalized = contentType.toLowerCase(Locale.ROOT);
    if (normalized.startsWith("text/")) {
      return true;
    }
    if (normalized.contains("json") || normalized.contains("xml") || normalized.contains("csv")) {
      return true;
    }
    if (name != null) {
      String lower = name.toLowerCase(Locale.ROOT);
      return lower.endsWith(".txt") || lower.endsWith(".md");
    }
    return false;
  }

  private boolean isPdf(String contentType, String name) {
    String normalized = contentType != null ? contentType.toLowerCase(Locale.ROOT) : "";
    if (normalized.contains("pdf")) {
      return true;
    }
    if (name != null) {
      return name.toLowerCase(Locale.ROOT).endsWith(".pdf");
    }
    return false;
  }

  private boolean isImage(String contentType, String name) {
    String normalized = contentType != null ? contentType.toLowerCase(Locale.ROOT) : "";
    if (normalized.startsWith("image/")) {
      return true;
    }
    if (name != null) {
      String lower = name.toLowerCase(Locale.ROOT);
      return lower.endsWith(".png")
          || lower.endsWith(".jpg")
          || lower.endsWith(".jpeg")
          || lower.endsWith(".webp")
          || lower.endsWith(".tiff")
          || lower.endsWith(".bmp");
    }
    return false;
  }

  private byte[] downloadFile(String url) throws Exception {
    HttpRequest request =
        HttpRequest.newBuilder()
            .uri(URI.create(url))
            .GET()
            .build();
    HttpResponse<byte[]> response =
        httpClient.send(request, HttpResponse.BodyHandlers.ofByteArray());
    if (response.statusCode() < 200 || response.statusCode() >= 300) {
      throw new IllegalStateException("Download failed " + response.statusCode());
    }
    return response.body();
  }

  private String detectContentType(String name, byte[] data) {
    if (name != null) {
      String lower = name.toLowerCase(Locale.ROOT);
      if (lower.endsWith(".pdf")) {
        return "application/pdf";
      }
      if (lower.endsWith(".png")) {
        return "image/png";
      }
      if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
        return "image/jpeg";
      }
    }
    if (data != null && data.length >= 4) {
      if (data[0] == 0x25 && data[1] == 0x50 && data[2] == 0x44 && data[3] == 0x46) {
        return "application/pdf";
      }
    }
    return "";
  }

  private String ocrImage(byte[] data) throws Exception {
    try (ByteArrayInputStream input = new ByteArrayInputStream(data)) {
      BufferedImage image = ImageIO.read(input);
      if (image == null) {
        throw new IllegalStateException("Invalid image data");
      }
      return normalizeOcr(runTesseract(image));
    }
  }

  private String ocrPdf(byte[] data) throws Exception {
    try (PDDocument document = PDDocument.load(data)) {
      PDFRenderer renderer = new PDFRenderer(document);
      int total = Math.min(document.getNumberOfPages(), MAX_PDF_PAGES);
      StringBuilder sb = new StringBuilder();
      for (int i = 0; i < total; i++) {
        BufferedImage image = renderer.renderImageWithDPI(i, OCR_DPI);
        String pageText = normalizeOcr(runTesseract(image));
        if (pageText != null && !pageText.isBlank()) {
          sb.append(pageText).append("\n");
        }
        if (sb.length() > MAX_OCR_CHARS) {
          break;
        }
      }
      return sb.toString();
    }
  }

  private String runTesseract(BufferedImage image) throws TesseractException {
    Tesseract tesseract = tesseractProvider.get();
    return tesseract.doOCR(image);
  }

  private Tesseract buildTesseract() {
    Tesseract tesseract = new Tesseract();
    String datapath = System.getenv("TESSDATA_PREFIX");
    if (datapath != null && !datapath.isBlank()) {
      tesseract.setDatapath(datapath);
    }
    String lang = System.getenv("TESSERACT_LANG");
    if (lang == null || lang.isBlank()) {
      lang = "eng";
    }
    tesseract.setLanguage(lang);
    return tesseract;
  }

  private String normalizeOcr(String text) {
    if (text == null) {
      return null;
    }
    return text.replaceAll("\\s+", " ").trim();
  }

  private String truncate(String text, int limit) {
    if (text == null) {
      return null;
    }
    if (text.length() <= limit) {
      return text;
    }
    return text.substring(0, limit);
  }

  private String buildSemanticSummary(
      TenantServiceFile file, TenantServiceConfig config, String content) {
    if (config == null || config.getProviderId() == null || config.getProviderId().isBlank()) {
      return null;
    }
    String model = resolveModel(config);
    if (model == null || model.isBlank()) {
      return null;
    }
    String domain =
        config.getDocumentDomain() != null && !config.getDocumentDomain().isBlank()
            ? config.getDocumentDomain()
            : "general";
    String trimmed = content.length() > 12000 ? content.substring(0, 12000) : content;
    List<Map<String, String>> messages =
        List.of(
            Map.of(
                "role",
                "system",
                "content",
                "Eres un asistente experto en análisis documental. "
                    + "Devuelve un resumen estructurado en markdown con secciones: "
                    + "Resumen, Datos clave, Entidades, Fechas."),
            Map.of(
                "role",
                "user",
                "content",
                "Dominio: "
                    + domain
                    + "\nDocumento OCR:\n"
                    + trimmed
                    + "\n\nResponde solo con el resumen en markdown."));

    ExecuteRequest request = new ExecuteRequest();
    request.providerId = config.getProviderId();
    request.model = model;
    request.serviceCode = file.getServiceCode();
    request.payload = Map.of("messages", messages);
    Map<String, Object> response = runtimeService.execute(file.getTenantId(), request);
    Object output = response.get("output");
    return extractAssistantContent(output);
  }

  private String resolveModel(TenantServiceConfig config) {
    if (config.getPricingId() == null || config.getPricingId().isBlank()) {
      return null;
    }
    PricingModel model = pricingService.resolveById(config.getPricingId());
    return model != null ? model.getModel() : null;
  }

  private String extractAssistantContent(Object output) {
    if (!(output instanceof Map<?, ?> map)) {
      return null;
    }
    Object choicesObj = map.get("choices");
    if (choicesObj instanceof List<?> choices && !choices.isEmpty()) {
      Object first = choices.get(0);
      if (first instanceof Map<?, ?> firstMap) {
        Object message = firstMap.get("message");
        if (message instanceof Map<?, ?> messageMap) {
          Object content = messageMap.get("content");
          if (content != null) {
            return String.valueOf(content).trim();
          }
        }
        Object text = firstMap.get("text");
        if (text != null) {
          return String.valueOf(text).trim();
        }
      }
    }
    Object responseField = map.get("response");
    return responseField != null ? String.valueOf(responseField).trim() : null;
  }

  private String buildFallbackSummary(String content) {
    String trimmed = content.trim();
    if (trimmed.length() > 1200) {
      trimmed = trimmed.substring(0, 1200);
    }
    return "## Resumen\n\n" + trimmed;
  }

  private void applySummaryOutput(TenantServiceFile file, String outputType, String summary) {
    if (summary == null) {
      return;
    }
    file.setResultContent(summary);
    if ("file".equalsIgnoreCase(outputType)) {
      String filename = buildSummaryFilename(file.getOriginalName());
      try {
        StorageUploadService.UploadResult upload =
            storageUploadService.uploadBytes(
                file.getTenantId(),
                file.getServiceCode(),
                filename,
                "text/markdown",
                summary.getBytes(StandardCharsets.UTF_8));
        file.setResultType("file");
        file.setResultFileUrl(upload.url);
        file.setResultFileKey(upload.storageKey);
      } catch (Exception ex) {
        file.setSemanticStatus("failed");
        file.setErrorMessage("Summary upload failed: " + ex.getMessage());
        log.warn("Summary upload failed for file {}", file.getId(), ex);
      }
    } else {
      file.setResultType("markdown");
    }
  }

  private String buildSummaryFilename(String originalName) {
    if (originalName == null || originalName.isBlank()) {
      return "resumen.md";
    }
    String base = originalName;
    int idx = base.lastIndexOf('.');
    if (idx > 0) {
      base = base.substring(0, idx);
    }
    return base + "-resumen.md";
  }

  private String getOcrContent(String tenantId, String docId) {
    try {
      OcrDocument doc = ocrDocumentsService.getById(tenantId, docId);
      if (doc == null || !doc.isEnabled()) {
        return null;
      }
      return ocrDocumentsService.getDecryptedContent(doc);
    } catch (Exception ex) {
      return null;
    }
  }

  private String formatDocumentBlock(TenantServiceFile file, String content) {
    String trimmed = content.length() > MAX_CONTEXT_CHARS ? content.substring(0, MAX_CONTEXT_CHARS) : content;
    String title = file.getOriginalName() != null ? file.getOriginalName() : "Documento";
    return "Documento: " + title + "\n" + trimmed;
  }

  private void storeEmbeddings(TenantServiceFile file, TenantServiceConfig config, String content) {
    if (content == null || content.isBlank()) {
      file.setEmbeddingStatus("skipped");
      return;
    }
    String providerId = config != null ? config.getProviderId() : null;
    List<String> chunks = chunkForEmbeddings(content);
    if (chunks.isEmpty()) {
      file.setEmbeddingStatus("skipped");
      return;
    }
    String embeddingModel = "text-embedding-3-small";
    EmbeddingsService.EmbeddingResult result =
        embeddingsService.embed(file.getTenantId(), providerId, embeddingModel, chunks);

    if (result == null || result.vectors == null || result.vectors.isEmpty()) {
      file.setEmbeddingStatus("failed");
      return;
    }

    embeddingRepository.deleteByTenantIdAndFileId(file.getTenantId(), file.getId());

    int total = Math.min(chunks.size(), result.vectors.size());
    for (int i = 0; i < total; i++) {
      TenantServiceEmbedding embedding = new TenantServiceEmbedding();
      embedding.setId(UUID.randomUUID().toString());
      embedding.setTenantId(file.getTenantId());
      embedding.setServiceCode(file.getServiceCode());
      embedding.setConversationId(file.getConversationId());
      embedding.setFileId(file.getId());
      embedding.setChunkIndex(i);
      embedding.setChunkText(chunks.get(i));
      embedding.setEmbeddingModel(result.model != null ? result.model : embeddingModel);
      embedding.setEmbedding(toEmbeddingJson(result.vectors.get(i)));
      embedding.setCreatedAt(LocalDateTime.now());
      embeddingRepository.save(embedding);
    }

    file.setEmbeddingStatus("done");
    file.setEmbeddingModel(result.model != null ? result.model : embeddingModel);
    file.setEmbeddingCount(total);
  }

  private List<String> chunkForEmbeddings(String content) {
    String trimmed = content.trim();
    if (trimmed.isEmpty()) {
      return List.of();
    }
    List<String> chunks = new ArrayList<>();
    int index = 0;
    while (index < trimmed.length() && chunks.size() < MAX_EMBEDDING_CHUNKS) {
      int end = Math.min(trimmed.length(), index + EMBEDDING_CHUNK_CHARS);
      chunks.add(trimmed.substring(index, end));
      index = end;
    }
    return chunks;
  }

  private String buildEmbeddingContext(
      String tenantId,
      String serviceCode,
      String conversationId,
      String userMessage,
      List<TenantServiceFile> files) {
    if (userMessage == null || userMessage.isBlank()) {
      return null;
    }
    List<TenantServiceEmbedding> embeddings =
        embeddingRepository.findByTenantIdAndConversationIdOrderByChunkIndexAsc(
            tenantId, conversationId);
    if (embeddings.isEmpty()) {
      return null;
    }
    TenantServiceConfig config =
        configRepository.findByTenantIdAndServiceCode(tenantId, serviceCode).orElse(null);
    String providerId = config != null ? config.getProviderId() : null;
    EmbeddingsService.EmbeddingResult queryResult =
        embeddingsService.embed(tenantId, providerId, "text-embedding-3-small", List.of(userMessage));
    if (queryResult == null || queryResult.vectors == null || queryResult.vectors.isEmpty()) {
      return null;
    }
    float[] queryVector = queryResult.vectors.get(0);

    Map<String, TenantServiceFile> fileMap =
        files.stream().collect(java.util.stream.Collectors.toMap(TenantServiceFile::getId, f -> f, (a, b) -> a));

    List<ScoredChunk> scored = new ArrayList<>();
    for (TenantServiceEmbedding embedding : embeddings) {
      float[] vector = parseEmbedding(embedding.getEmbedding());
      if (vector.length == 0 || vector.length != queryVector.length) {
        continue;
      }
      double score = cosine(queryVector, vector);
      scored.add(new ScoredChunk(embedding, score));
    }
    scored.sort((a, b) -> Double.compare(b.score, a.score));

    List<String> blocks = new ArrayList<>();
    for (ScoredChunk chunk : scored) {
      if (blocks.size() >= 3) {
        break;
      }
      if (chunk.score < 0.15) {
        continue;
      }
      TenantServiceFile file = fileMap.get(chunk.embedding.getFileId());
      String title = file != null && file.getOriginalName() != null ? file.getOriginalName() : "Documento";
      String text = chunk.embedding.getChunkText();
      if (text.length() > MAX_CONTEXT_CHARS) {
        text = text.substring(0, MAX_CONTEXT_CHARS);
      }
      blocks.add("Documento: " + title + "\n" + text);
    }

    return blocks.isEmpty() ? null : String.join("\n\n", blocks);
  }

  private float[] parseEmbedding(String json) {
    if (json == null || json.isBlank()) {
      return new float[0];
    }
    try {
      return objectMapper.readValue(json, float[].class);
    } catch (Exception ex) {
      return new float[0];
    }
  }

  private double cosine(float[] a, float[] b) {
    if (a.length == 0 || b.length == 0 || a.length != b.length) {
      return 0d;
    }
    double dot = 0d;
    double normA = 0d;
    double normB = 0d;
    for (int i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    if (normA == 0d || normB == 0d) {
      return 0d;
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private static class ScoredChunk {
    private final TenantServiceEmbedding embedding;
    private final double score;

    private ScoredChunk(TenantServiceEmbedding embedding, double score) {
      this.embedding = embedding;
      this.score = score;
    }
  }

  private List<String> extractTokens(String message) {
    if (message == null || message.isBlank()) {
      return List.of();
    }
    String normalized = message.toLowerCase(Locale.ROOT);
    String[] parts = normalized.split("[^a-z0-9áéíóúüñ]+");
    List<String> tokens = new ArrayList<>();
    for (String part : parts) {
      if (part.length() >= 3) {
        tokens.add(part);
      }
    }
    return tokens;
  }

  private boolean matchesTokens(String content, List<String> tokens) {
    if (tokens.isEmpty()) {
      return true;
    }
    String normalized = content.toLowerCase(Locale.ROOT);
    for (String token : tokens) {
      if (normalized.contains(token)) {
        return true;
      }
    }
    return false;
  }

  private String toJson(Object payload) {
    try {
      return objectMapper.writeValueAsString(payload);
    } catch (JsonProcessingException ex) {
      return null;
    }
  }

  private String toEmbeddingJson(float[] vector) {
    if (vector == null) {
      return "[]";
    }
    try {
      return objectMapper.writeValueAsString(vector);
    } catch (Exception ex) {
      return "[]";
    }
  }

  public Map<String, Object> toResponse(TenantServiceFile file) {
    if (file == null) {
      return null;
    }
    Map<String, Object> response = new LinkedHashMap<>();
    response.put("id", file.getId());
    response.put("tenantId", file.getTenantId());
    response.put("serviceCode", file.getServiceCode());
    response.put("conversationId", file.getConversationId());
    response.put("originalName", file.getOriginalName());
    response.put("contentType", file.getContentType());
    response.put("sizeBytes", file.getSizeBytes());
    response.put("storageProvider", file.getStorageProvider());
    response.put("storageKey", file.getStorageKey());
    response.put("storageUrl", file.getStorageUrl());
    response.put("status", file.getStatus());
    response.put("ocrStatus", file.getOcrStatus());
    response.put("semanticStatus", file.getSemanticStatus());
    response.put("embeddingStatus", file.getEmbeddingStatus());
    response.put("embeddingModel", file.getEmbeddingModel());
    response.put("embeddingCount", file.getEmbeddingCount());
    response.put("documentDomain", file.getDocumentDomain());
    response.put("ocrDocumentId", file.getOcrDocumentId());
    response.put("resultType", file.getResultType());
    response.put("resultContent", file.getResultContent());
    response.put("resultFileUrl", file.getResultFileUrl());
    response.put("resultFileKey", file.getResultFileKey());
    response.put("errorMessage", file.getErrorMessage());
    response.put("createdAt", file.getCreatedAt());
    response.put("updatedAt", file.getUpdatedAt());
    return response;
  }
}
