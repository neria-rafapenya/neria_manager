package com.neria.manager.documents;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.neria.manager.common.entities.Provider;
import com.neria.manager.providers.ProvidersService;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class EmbeddingsService {
  private static final Logger log = LoggerFactory.getLogger(EmbeddingsService.class);
  private static final int LOCAL_DIM = 128;

  private final ProvidersService providersService;
  private final ObjectMapper objectMapper;
  private final HttpClient httpClient =
      HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(20)).build();

  public EmbeddingsService(ProvidersService providersService, ObjectMapper objectMapper) {
    this.providersService = providersService;
    this.objectMapper = objectMapper;
  }

  public EmbeddingResult embed(
      String tenantId, String providerId, String model, List<String> inputs) {
    if (inputs == null || inputs.isEmpty()) {
      return new EmbeddingResult(model, List.of(), true);
    }
    if (providerId == null || providerId.isBlank()) {
      return new EmbeddingResult("local-hash", embedLocal(inputs), true);
    }
    Provider provider = providersService.getByTenantAndId(tenantId, providerId);
    if (provider == null || !provider.isEnabled()) {
      return new EmbeddingResult("local-hash", embedLocal(inputs), true);
    }

    String providerType = provider.getType() != null ? provider.getType().toLowerCase(Locale.ROOT) : "";
    Map<String, Object> credentials = parseCredentials(providersService.getDecryptedCredentials(provider));

    if ("openai".equals(providerType) || "azure".equals(providerType) || "azure-openai".equals(providerType)) {
      try {
        return embedOpenAI(credentials, model, inputs);
      } catch (Exception ex) {
        log.warn("Embeddings provider failed, using local fallback", ex);
        return new EmbeddingResult("local-hash", embedLocal(inputs), true);
      }
    }

    log.warn("Embeddings provider type {} not supported, using local fallback", providerType);
    return new EmbeddingResult("local-hash", embedLocal(inputs), true);
  }

  private EmbeddingResult embedOpenAI(
      Map<String, Object> credentials, String model, List<String> inputs) throws Exception {
    String apiKey = String.valueOf(credentials.getOrDefault("apiKey", "")).trim();
    String baseUrl = String.valueOf(credentials.getOrDefault("baseUrl", "https://api.openai.com")).trim();
    if (apiKey.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing OpenAI apiKey for embeddings");
    }
    String embeddingModel = model != null && !model.isBlank() ? model : "text-embedding-3-small";

    Map<String, Object> body = Map.of("model", embeddingModel, "input", inputs);
    String json = objectMapper.writeValueAsString(body);

    HttpRequest request =
        HttpRequest.newBuilder()
            .uri(URI.create(baseUrl + "/v1/embeddings"))
            .timeout(Duration.ofSeconds(60))
            .header("Authorization", "Bearer " + apiKey)
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(json, StandardCharsets.UTF_8))
            .build();

    HttpResponse<String> response =
        httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
    if (response.statusCode() < 200 || response.statusCode() >= 300) {
      throw new IllegalStateException("Embeddings error: " + response.statusCode() + " " + response.body());
    }

    Map<String, Object> parsed =
        objectMapper.readValue(response.body(), new TypeReference<Map<String, Object>>() {});
    Object dataObj = parsed.get("data");
    if (!(dataObj instanceof List<?> dataList)) {
      throw new IllegalStateException("Embeddings response missing data");
    }

    List<EmbeddingItem> items = new ArrayList<>();
    for (Object itemObj : dataList) {
      if (!(itemObj instanceof Map<?, ?> item)) {
        continue;
      }
      Object indexObj = item.get("index");
      int index = indexObj instanceof Number ? ((Number) indexObj).intValue() : items.size();
      Object embeddingObj = item.get("embedding");
      float[] vector = parseVector(embeddingObj);
      items.add(new EmbeddingItem(index, vector));
    }

    items.sort(Comparator.comparingInt(a -> a.index));
    List<float[]> vectors = new ArrayList<>();
    for (EmbeddingItem item : items) {
      vectors.add(item.vector);
    }
    return new EmbeddingResult(embeddingModel, vectors, false);
  }

  private List<float[]> embedLocal(List<String> inputs) {
    List<float[]> vectors = new ArrayList<>();
    for (String input : inputs) {
      vectors.add(hashEmbedding(input));
    }
    return vectors;
  }

  private float[] hashEmbedding(String text) {
    float[] vector = new float[LOCAL_DIM];
    if (text == null || text.isBlank()) {
      return vector;
    }
    String[] parts = text.toLowerCase(Locale.ROOT).split("[^a-z0-9áéíóúüñ]+");
    for (String part : parts) {
      if (part.isBlank()) {
        continue;
      }
      int hash = part.hashCode();
      int idx = Math.abs(hash % LOCAL_DIM);
      vector[idx] += 1f;
    }
    normalize(vector);
    return vector;
  }

  private void normalize(float[] vector) {
    double sum = 0d;
    for (float v : vector) {
      sum += v * v;
    }
    if (sum == 0d) {
      return;
    }
    double norm = Math.sqrt(sum);
    for (int i = 0; i < vector.length; i++) {
      vector[i] = (float) (vector[i] / norm);
    }
  }

  private float[] parseVector(Object embeddingObj) {
    if (embeddingObj instanceof List<?> list) {
      float[] vector = new float[list.size()];
      for (int i = 0; i < list.size(); i++) {
        Object value = list.get(i);
        if (value instanceof Number number) {
          vector[i] = number.floatValue();
        } else {
          try {
            vector[i] = Float.parseFloat(String.valueOf(value));
          } catch (NumberFormatException ex) {
            vector[i] = 0f;
          }
        }
      }
      return vector;
    }
    return new float[0];
  }

  private Map<String, Object> parseCredentials(String credentialsJson) {
    if (credentialsJson == null || credentialsJson.isBlank()) {
      return Map.of();
    }
    try {
      return objectMapper.readValue(credentialsJson, new TypeReference<Map<String, Object>>() {});
    } catch (Exception ex) {
      return Map.of();
    }
  }

  private static class EmbeddingItem {
    private final int index;
    private final float[] vector;

    private EmbeddingItem(int index, float[] vector) {
      this.index = index;
      this.vector = vector;
    }
  }

  public static class EmbeddingResult {
    public final String model;
    public final List<float[]> vectors;
    public final boolean fallback;

    public EmbeddingResult(String model, List<float[]> vectors, boolean fallback) {
      this.model = model;
      this.vectors = vectors;
      this.fallback = fallback;
    }
  }
}
