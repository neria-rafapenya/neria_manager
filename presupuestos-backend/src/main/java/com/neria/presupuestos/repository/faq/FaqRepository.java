package com.neria.presupuestos.repository.faq;

import com.neria.presupuestos.model.entity.Faq;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FaqRepository extends JpaRepository<Faq, String> {
    List<Faq> findByTenantIdOrderByOrderIndexAsc(String tenantId);
}
