package com.neria.presupuestos.controller.quotes;

import com.neria.presupuestos.model.dto.QuoteAttachmentCreateRequest;
import com.neria.presupuestos.model.dto.QuoteAttachmentDto;
import com.neria.presupuestos.model.dto.QuotePdfBackfillResponse;
import com.neria.presupuestos.model.dto.UploadResponse;
import com.neria.presupuestos.config.security.JwtUser;
import com.neria.presupuestos.model.entity.UserRole;
import com.neria.presupuestos.service.quote.QuoteAttachmentService;
import com.neria.presupuestos.service.quote.QuotePdfBackfillService;
import com.neria.presupuestos.service.quote.QuotePdfService;
import com.neria.presupuestos.service.storage.CloudinaryUploadService;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

@RestController
@RequestMapping("/quotes")
public class QuotePdfController {

    private final QuotePdfService quotePdfService;
    private final CloudinaryUploadService uploadService;
    private final QuoteAttachmentService attachmentService;
    private final QuotePdfBackfillService backfillService;

    public QuotePdfController(QuotePdfService quotePdfService,
                              CloudinaryUploadService uploadService,
                              QuoteAttachmentService attachmentService,
                              QuotePdfBackfillService backfillService) {
        this.quotePdfService = quotePdfService;
        this.uploadService = uploadService;
        this.attachmentService = attachmentService;
        this.backfillService = backfillService;
    }

    @PostMapping("/{id}/export/pdf")
    public ResponseEntity<QuoteAttachmentDto> exportPdf(@PathVariable String id) {
        byte[] pdfBytes = quotePdfService.generatePdf(id);
        String fileName = "quote-" + id + ".pdf";
        UploadResponse upload = uploadService.uploadBytes(pdfBytes, fileName, "application/pdf", "presupuestos/quotes");

        QuoteAttachmentCreateRequest request = new QuoteAttachmentCreateRequest();
        request.setUrl(upload.getSecureUrl() != null ? upload.getSecureUrl() : upload.getUrl());
        request.setFileName(fileName);
        request.setContentType("application/pdf");

        return ResponseEntity.ok(attachmentService.create(id, request));
    }

    @PostMapping("/backfill/pdfs")
    public ResponseEntity<QuotePdfBackfillResponse> backfillPdfs() {
        requireAdmin();
        return ResponseEntity.ok(backfillService.backfillForTenant());
    }

    private void requireAdmin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Forbidden");
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof JwtUser jwtUser) {
            if (jwtUser.getRole() == UserRole.ADMIN) {
                return;
            }
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Forbidden");
    }
}
