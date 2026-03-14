package com.neria.presupuestos.repository.ai;

import com.neria.presupuestos.model.entity.AiProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AiProfileRepository extends JpaRepository<AiProfile, String> {
    List<AiProfile> findByTenantId(String tenantId);

    Optional<AiProfile> findFirstByTenantIdAndProductId(String tenantId, String productId);

    Optional<AiProfile> findFirstByTenantIdAndProductIdAndActiveTrue(String tenantId, String productId);

    Optional<AiProfile> findFirstByTenantIdAndSectorIdAndProductIdIsNull(String tenantId, String sectorId);

    Optional<AiProfile> findFirstByTenantIdAndSectorIdAndProductIdIsNullAndActiveTrue(String tenantId, String sectorId);

    Optional<AiProfile> findByTenantIdAndId(String tenantId, String id);

    void deleteByProductId(String productId);
}
