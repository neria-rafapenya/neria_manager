package com.neria.presupuestos.controller.quotes;

import com.neria.presupuestos.model.dto.QuoteCalculationRequest;
import com.neria.presupuestos.model.dto.QuoteCalculationResponse;
import com.neria.presupuestos.model.dto.QuoteCreateRequest;
import com.neria.presupuestos.model.dto.QuoteDto;
import com.neria.presupuestos.model.dto.QuoteUpdateRequest;
import com.neria.presupuestos.service.quote.QuoteService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class QuotesController {

    private final QuoteService quoteService;

    public QuotesController(QuoteService quoteService) {
        this.quoteService = quoteService;
    }

    @GetMapping("/quotes")
    public ResponseEntity<List<QuoteDto>> listQuotes() {
        return ResponseEntity.ok(quoteService.list());
    }

    @PostMapping("/quotes")
    public ResponseEntity<QuoteDto> createQuote(@RequestBody QuoteCreateRequest request) {
        return ResponseEntity.ok(quoteService.create(request));
    }

    @GetMapping("/quotes/{id}")
    public ResponseEntity<QuoteDto> getQuote(@PathVariable String id) {
        return ResponseEntity.ok(quoteService.get(id));
    }

    @PutMapping("/quotes/{id}")
    public ResponseEntity<QuoteDto> updateQuote(@PathVariable String id, @RequestBody QuoteUpdateRequest request) {
        return ResponseEntity.ok(quoteService.update(id, request));
    }

    @PostMapping("/quote/calculate")
    public ResponseEntity<QuoteCalculationResponse> calculateQuote(@RequestBody QuoteCalculationRequest request) {
        return ResponseEntity.ok(quoteService.calculate(request));
    }
}
