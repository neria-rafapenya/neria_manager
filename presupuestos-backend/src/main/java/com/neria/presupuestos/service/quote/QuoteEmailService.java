package com.neria.presupuestos.service.quote;

import com.neria.presupuestos.model.dto.QuoteAttachmentCreateRequest;
import com.neria.presupuestos.model.dto.UploadResponse;
import com.neria.presupuestos.model.entity.Customer;
import com.neria.presupuestos.model.entity.Quote;
import com.neria.presupuestos.model.entity.QuoteEmailLog;
import com.neria.presupuestos.model.entity.QuoteEmailStatus;
import com.neria.presupuestos.repository.customer.CustomerRepository;
import com.neria.presupuestos.repository.quote.QuoteEmailLogRepository;
import com.neria.presupuestos.repository.quote.QuoteRepository;
import com.neria.presupuestos.service.storage.CloudinaryUploadService;
import com.neria.presupuestos.util.TenantResolver;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;

@Service
public class QuoteEmailService {

    private final QuoteRepository quoteRepository;
    private final CustomerRepository customerRepository;
    private final QuotePdfService quotePdfService;
    private final CloudinaryUploadService uploadService;
    private final QuoteAttachmentService attachmentService;
    private final QuoteEmailLogRepository emailLogRepository;
    private final JavaMailSender mailSender;
    private final String mailFrom;

    public QuoteEmailService(QuoteRepository quoteRepository,
                             CustomerRepository customerRepository,
                             QuotePdfService quotePdfService,
                             CloudinaryUploadService uploadService,
                             QuoteAttachmentService attachmentService,
                             QuoteEmailLogRepository emailLogRepository,
                             JavaMailSender mailSender,
                             @Value("${mail.from:no-reply@presupuestos.local}") String mailFrom) {
        this.quoteRepository = quoteRepository;
        this.customerRepository = customerRepository;
        this.quotePdfService = quotePdfService;
        this.uploadService = uploadService;
        this.attachmentService = attachmentService;
        this.emailLogRepository = emailLogRepository;
        this.mailSender = mailSender;
        this.mailFrom = mailFrom;
    }

    public void sendQuotePdf(String quoteId) {
        Quote quote = getQuoteOrThrow(quoteId);
        Customer customer = loadCustomer(quote.getCustomerId(), quote.getTenantId());
        if (customer == null || customer.getEmail() == null || customer.getEmail().isBlank()) {
            throw new IllegalArgumentException("Customer email is required");
        }

        byte[] pdfBytes = quotePdfService.generatePdf(quote.getId());
        String fileName = "quote-" + quote.getId() + ".pdf";

        UploadResponse upload = uploadService.uploadBytes(pdfBytes, fileName, "application/pdf", "presupuestos/quotes");
        QuoteAttachmentCreateRequest attachmentRequest = new QuoteAttachmentCreateRequest();
        attachmentRequest.setUrl(upload.getSecureUrl() != null ? upload.getSecureUrl() : upload.getUrl());
        attachmentRequest.setFileName(fileName);
        attachmentRequest.setContentType("application/pdf");
        attachmentService.create(quote.getId(), attachmentRequest);

        try {
            sendEmail(customer.getEmail(), fileName, pdfBytes, quote.getId());
            saveLog(quote, customer.getEmail(), QuoteEmailStatus.SENT, null);
        } catch (Exception ex) {
            saveLog(quote, customer.getEmail(), QuoteEmailStatus.FAILED, ex.getMessage());
            throw ex;
        }
    }

    private void sendEmail(String to, String fileName, byte[] pdfBytes, String quoteId) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);
            helper.setFrom(mailFrom);
            helper.setTo(to);
            helper.setSubject("Presupuesto " + quoteId);
            helper.setText("Adjuntamos el presupuesto en PDF.");
            helper.addAttachment(fileName, new ByteArrayResource(pdfBytes), "application/pdf");
            mailSender.send(message);
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to send email", ex);
        }
    }

    private void saveLog(Quote quote, String email, QuoteEmailStatus status, String errorMessage) {
        QuoteEmailLog log = new QuoteEmailLog();
        log.setTenantId(quote.getTenantId());
        log.setQuoteId(quote.getId());
        log.setCustomerEmail(email);
        log.setStatus(status);
        log.setErrorMessage(errorMessage);
        emailLogRepository.save(log);
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

    private Customer loadCustomer(String customerId, String tenantId) {
        if (customerId == null || customerId.isBlank()) {
            return null;
        }
        return customerRepository.findById(customerId)
                .filter(customer -> tenantId.equals(customer.getTenantId()))
                .orElse(null);
    }
}
