package com.neria.presupuestos.repository.ai;

import com.neria.presupuestos.model.entity.AiRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.time.LocalDateTime;

public interface AiRequestRepository extends JpaRepository<AiRequest, String> {
    List<AiRequest> findByTenantId(String tenantId);

    @Query("""
            select a from AiRequest a
            where (:fromDate is null or a.createdAt >= :fromDate)
              and (:toDate is null or a.createdAt <= :toDate)
              and (:onlyErrors = false or a.errorMessage is not null)
            order by a.createdAt desc
            """)
    List<AiRequest> searchLogs(@Param("fromDate") LocalDateTime fromDate,
                               @Param("toDate") LocalDateTime toDate,
                               @Param("onlyErrors") boolean onlyErrors);
}
