package com.neria.manager.logs;

import com.neria.manager.common.entities.TenantRequestLog;
import com.neria.manager.common.repos.TenantRequestLogRepository;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Stream;
import org.springframework.stereotype.Service;

@Service
public class TenantRequestLogsService {
  private final TenantRequestLogRepository repository;

  public TenantRequestLogsService(TenantRequestLogRepository repository) {
    this.repository = repository;
  }

  public TenantRequestLog record(TenantRequestLog log) {
    if (log.getId() == null || log.getId().isBlank()) {
      log.setId(UUID.randomUUID().toString());
    }
    if (log.getCreatedAt() == null) {
      log.setCreatedAt(LocalDateTime.now());
    }
    return repository.save(log);
  }

  public List<TenantRequestLog> list(int limit, String tenantId, String type, String query) {
    List<TenantRequestLog> base =
        tenantId != null && !tenantId.isBlank()
            ? repository.findTop500ByTenantIdOrderByCreatedAtDesc(tenantId)
            : repository.findTop500ByOrderByCreatedAtDesc();
    Stream<TenantRequestLog> stream = base.stream();
    if (type != null && !type.isBlank()) {
      String normalized = type.trim().toLowerCase();
      stream =
          stream.filter(
              item -> item.getType() != null && item.getType().toLowerCase().equals(normalized));
    }
    if (query != null && !query.isBlank()) {
      String needle = query.trim().toLowerCase();
      stream =
          stream.filter(
              item ->
                  (item.getUserId() != null
                          && item.getUserId().toLowerCase().contains(needle))
                      || (item.getUserEmail() != null
                          && item.getUserEmail().toLowerCase().contains(needle)));
    }
    List<TenantRequestLog> filtered =
        stream.sorted(Comparator.comparing(TenantRequestLog::getCreatedAt).reversed()).toList();
    return filtered.subList(0, Math.min(limit, filtered.size()));
  }
}
