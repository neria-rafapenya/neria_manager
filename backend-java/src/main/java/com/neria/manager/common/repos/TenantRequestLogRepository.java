package com.neria.manager.common.repos;

import com.neria.manager.common.entities.TenantRequestLog;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TenantRequestLogRepository extends JpaRepository<TenantRequestLog, String> {
  List<TenantRequestLog> findTop500ByOrderByCreatedAtDesc();

  List<TenantRequestLog> findTop500ByTenantIdOrderByCreatedAtDesc(String tenantId);
}
