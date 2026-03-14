package com.neria.presupuestos.service.faq;

import com.neria.presupuestos.model.dto.FaqCreateRequest;
import com.neria.presupuestos.model.dto.FaqDto;
import com.neria.presupuestos.model.dto.FaqUpdateRequest;
import com.neria.presupuestos.model.entity.Faq;
import com.neria.presupuestos.repository.faq.FaqRepository;
import com.neria.presupuestos.util.TenantResolver;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
public class FaqService {

    private final FaqRepository faqRepository;

    public FaqService(FaqRepository faqRepository) {
        this.faqRepository = faqRepository;
    }

    public List<FaqDto> list() {
        String tenantId = TenantResolver.requireTenantId();
        return faqRepository.findByTenantIdOrderByOrderIndexAsc(tenantId)
                .stream()
                .sorted(Comparator.comparing(faq -> faq.getOrderIndex() == null ? Integer.MAX_VALUE : faq.getOrderIndex()))
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public FaqDto create(FaqCreateRequest request) {
        String tenantId = TenantResolver.requireTenantId();
        if (request.getQuestion() == null || request.getQuestion().isBlank()) {
            throw new IllegalArgumentException("Question is required");
        }
        Faq faq = new Faq();
        faq.setTenantId(tenantId);
        faq.setQuestion(request.getQuestion());
        faq.setAnswer(request.getAnswer());
        faq.setOrderIndex(request.getOrderIndex());
        return toDto(faqRepository.save(faq));
    }

    @Transactional
    public FaqDto update(String id, FaqUpdateRequest request) {
        Faq faq = getOrThrow(id);
        if (request.getQuestion() != null) {
            faq.setQuestion(request.getQuestion());
        }
        if (request.getAnswer() != null) {
            faq.setAnswer(request.getAnswer());
        }
        if (request.getOrderIndex() != null) {
            faq.setOrderIndex(request.getOrderIndex());
        }
        return toDto(faqRepository.save(faq));
    }

    @Transactional
    public void delete(String id) {
        Faq faq = getOrThrow(id);
        faqRepository.delete(faq);
    }

    private Faq getOrThrow(String id) {
        String tenantId = TenantResolver.requireTenantId();
        Faq faq = faqRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("FAQ not found"));
        if (!tenantId.equals(faq.getTenantId())) {
            throw new IllegalArgumentException("FAQ not found");
        }
        return faq;
    }

    private FaqDto toDto(Faq faq) {
        FaqDto dto = new FaqDto();
        dto.setId(faq.getId());
        dto.setTenantId(faq.getTenantId());
        dto.setQuestion(faq.getQuestion());
        dto.setAnswer(faq.getAnswer());
        dto.setOrderIndex(faq.getOrderIndex());
        dto.setCreatedAt(faq.getCreatedAt());
        return dto;
    }
}
