package com.neria.presupuestos.service.quote;

import com.neria.presupuestos.model.dto.QuoteAttachmentCreateRequest;
import com.neria.presupuestos.model.dto.QuoteAttachmentDto;
import com.neria.presupuestos.model.entity.Quote;
import com.neria.presupuestos.model.entity.QuoteAttachment;
import com.neria.presupuestos.repository.quote.QuoteAttachmentRepository;
import com.neria.presupuestos.repository.quote.QuoteRepository;
import com.neria.presupuestos.util.TenantResolver;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class QuoteAttachmentService {

    private final QuoteAttachmentRepository attachmentRepository;
    private final QuoteRepository quoteRepository;

    public QuoteAttachmentService(QuoteAttachmentRepository attachmentRepository, QuoteRepository quoteRepository) {
        this.attachmentRepository = attachmentRepository;
        this.quoteRepository = quoteRepository;
    }

    public List<QuoteAttachmentDto> listByQuote(String quoteId) {
        Quote quote = getQuoteOrThrow(quoteId);
        return attachmentRepository.findByQuoteId(quote.getId())
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public QuoteAttachmentDto create(String quoteId, QuoteAttachmentCreateRequest request) {
        Quote quote = getQuoteOrThrow(quoteId);
        if (request.getUrl() == null || request.getUrl().isBlank()) {
            throw new IllegalArgumentException("URL is required");
        }
        QuoteAttachment attachment = new QuoteAttachment();
        attachment.setTenantId(quote.getTenantId());
        attachment.setQuoteId(quote.getId());
        attachment.setUrl(request.getUrl());
        attachment.setFileName(request.getFileName());
        attachment.setContentType(request.getContentType());
        return toDto(attachmentRepository.save(attachment));
    }

    private Quote getQuoteOrThrow(String id) {
        String tenantId = TenantResolver.requireTenantId();
        Quote quote = quoteRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Quote not found"));
        if (!tenantId.equals(quote.getTenantId())) {
            throw new IllegalArgumentException("Quote not found");
        }
        return quote;
    }

    private QuoteAttachmentDto toDto(QuoteAttachment attachment) {
        QuoteAttachmentDto dto = new QuoteAttachmentDto();
        dto.setId(attachment.getId());
        dto.setTenantId(attachment.getTenantId());
        dto.setQuoteId(attachment.getQuoteId());
        dto.setUrl(attachment.getUrl());
        dto.setFileName(attachment.getFileName());
        dto.setContentType(attachment.getContentType());
        dto.setCreatedAt(attachment.getCreatedAt());
        return dto;
    }
}
