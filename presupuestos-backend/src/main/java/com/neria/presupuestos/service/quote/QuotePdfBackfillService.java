package com.neria.presupuestos.service.quote;

import com.neria.presupuestos.model.dto.QuoteAttachmentCreateRequest;
import com.neria.presupuestos.model.dto.QuotePdfBackfillResponse;
import com.neria.presupuestos.model.entity.Quote;
import com.neria.presupuestos.model.entity.QuoteAttachment;
import com.neria.presupuestos.repository.quote.QuoteAttachmentRepository;
import com.neria.presupuestos.repository.quote.QuoteRepository;
import com.neria.presupuestos.service.storage.CloudinaryUploadService;
import com.neria.presupuestos.util.TenantResolver;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class QuotePdfBackfillService {

    private final QuoteRepository quoteRepository;
    private final QuoteAttachmentRepository attachmentRepository;
    private final QuotePdfService quotePdfService;
    private final CloudinaryUploadService uploadService;
    private final QuoteAttachmentService attachmentService;

    public QuotePdfBackfillService(QuoteRepository quoteRepository,
                                   QuoteAttachmentRepository attachmentRepository,
                                   QuotePdfService quotePdfService,
                                   CloudinaryUploadService uploadService,
                                   QuoteAttachmentService attachmentService) {
        this.quoteRepository = quoteRepository;
        this.attachmentRepository = attachmentRepository;
        this.quotePdfService = quotePdfService;
        this.uploadService = uploadService;
        this.attachmentService = attachmentService;
    }

    public QuotePdfBackfillResponse backfillForTenant() {
        String tenantId = TenantResolver.requireTenantId();
        List<Quote> quotes = quoteRepository.findByTenantId(tenantId);
        QuotePdfBackfillResponse response = new QuotePdfBackfillResponse();
        response.setTotalQuotes(quotes.size());

        int created = 0;
        int skipped = 0;
        int removedInvalid = 0;

        for (Quote quote : quotes) {
            List<QuoteAttachment> attachments = attachmentRepository.findByQuoteId(quote.getId());
            List<QuoteAttachment> pdfAttachments = attachments.stream()
                    .filter(att -> {
                        String contentType = att.getContentType() == null ? "" : att.getContentType().toLowerCase();
                        String fileName = att.getFileName() == null ? "" : att.getFileName().toLowerCase();
                        String url = att.getUrl() == null ? "" : att.getUrl().toLowerCase();
                        return contentType.contains("pdf") || fileName.endsWith(".pdf") || url.endsWith(".pdf");
                    })
                    .toList();

            boolean hasValidPdf = pdfAttachments.stream()
                    .anyMatch(att -> {
                        String url = att.getUrl() == null ? "" : att.getUrl().toLowerCase();
                        return url.contains("/raw/upload/");
                    });

            if (hasValidPdf) {
                skipped++;
                continue;
            }

            List<QuoteAttachment> invalidPdfs = pdfAttachments.stream()
                    .filter(att -> {
                        String url = att.getUrl() == null ? "" : att.getUrl().toLowerCase();
                        return url.contains("/image/upload/");
                    })
                    .toList();
            if (!invalidPdfs.isEmpty()) {
                attachmentRepository.deleteAll(invalidPdfs);
                removedInvalid += invalidPdfs.size();
            }

            byte[] pdfBytes = quotePdfService.generatePdf(quote.getId());
            String fileName = "quote-" + quote.getId() + ".pdf";
            var upload = uploadService.uploadBytes(pdfBytes, fileName, "application/pdf", "presupuestos/quotes");
            QuoteAttachmentCreateRequest request = new QuoteAttachmentCreateRequest();
            request.setUrl(upload.getSecureUrl() != null ? upload.getSecureUrl() : upload.getUrl());
            request.setFileName(fileName);
            request.setContentType("application/pdf");
            attachmentService.create(quote.getId(), request);
            created++;
        }

        response.setCreatedPdfs(created);
        response.setSkipped(skipped);
        response.setRemovedInvalid(removedInvalid);
        return response;
    }
}
