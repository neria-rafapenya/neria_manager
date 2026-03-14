package com.neria.presupuestos.controller.email;

import com.neria.presupuestos.model.dto.EmailDto;
import com.neria.presupuestos.service.email.EmailService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/emails")
public class EmailController {

    private final EmailService emailService;

    public EmailController(EmailService emailService) {
        this.emailService = emailService;
    }

    @GetMapping
    public ResponseEntity<List<EmailDto>> listEmails() {
        return ResponseEntity.ok(emailService.list());
    }

    @GetMapping("/{id}")
    public ResponseEntity<EmailDto> getEmail(@PathVariable String id) {
        return ResponseEntity.ok(emailService.get(id));
    }
}
