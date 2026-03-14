package com.neria.presupuestos.controller.quotes;

import com.neria.presupuestos.model.dto.QuoteAttachmentCreateRequest;
import com.neria.presupuestos.model.dto.QuoteAttachmentDto;
import com.neria.presupuestos.service.quote.QuoteAttachmentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/quotes")
public class QuoteAttachmentController {

    private final QuoteAttachmentService attachmentService;

    public QuoteAttachmentController(QuoteAttachmentService attachmentService) {
        this.attachmentService = attachmentService;
    }

    @GetMapping("/{id}/attachments")
    public ResponseEntity<List<QuoteAttachmentDto>> list(@PathVariable String id) {
        return ResponseEntity.ok(attachmentService.listByQuote(id));
    }

    @PostMapping("/{id}/attachments")
    public ResponseEntity<QuoteAttachmentDto> create(
            @PathVariable String id,
            @RequestBody QuoteAttachmentCreateRequest request
    ) {
        return ResponseEntity.ok(attachmentService.create(id, request));
    }
}
