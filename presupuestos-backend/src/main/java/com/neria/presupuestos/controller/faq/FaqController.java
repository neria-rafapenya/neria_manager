package com.neria.presupuestos.controller.faq;

import com.neria.presupuestos.model.dto.FaqCreateRequest;
import com.neria.presupuestos.model.dto.FaqDto;
import com.neria.presupuestos.model.dto.FaqUpdateRequest;
import com.neria.presupuestos.service.faq.FaqService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/faqs")
public class FaqController {

    private final FaqService faqService;

    public FaqController(FaqService faqService) {
        this.faqService = faqService;
    }

    @GetMapping
    public ResponseEntity<List<FaqDto>> list() {
        return ResponseEntity.ok(faqService.list());
    }

    @PostMapping
    public ResponseEntity<FaqDto> create(@RequestBody FaqCreateRequest request) {
        return ResponseEntity.ok(faqService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<FaqDto> update(@PathVariable String id, @RequestBody FaqUpdateRequest request) {
        return ResponseEntity.ok(faqService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        faqService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
