package com.neria.presupuestos.controller.quotes;

import com.neria.presupuestos.service.quote.QuoteEmailService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/quotes")
public class QuoteEmailController {

    private final QuoteEmailService quoteEmailService;

    public QuoteEmailController(QuoteEmailService quoteEmailService) {
        this.quoteEmailService = quoteEmailService;
    }

    @PostMapping("/{id}/send-email")
    public ResponseEntity<Void> sendEmail(@PathVariable String id) {
        quoteEmailService.sendQuotePdf(id);
        return ResponseEntity.noContent().build();
    }
}
