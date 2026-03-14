package com.neria.presupuestos.service.email;

import com.neria.presupuestos.model.dto.EmailDto;
import com.neria.presupuestos.model.entity.Email;
import com.neria.presupuestos.repository.email.EmailRepository;
import com.neria.presupuestos.util.TenantResolver;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EmailService {

    private final EmailRepository emailRepository;

    public EmailService(EmailRepository emailRepository) {
        this.emailRepository = emailRepository;
    }

    public List<EmailDto> list() {
        String tenantId = TenantResolver.requireTenantId();
        return emailRepository.findByTenantId(tenantId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    public EmailDto get(String id) {
        String tenantId = TenantResolver.requireTenantId();
        Email email = emailRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Email not found"));
        if (!tenantId.equals(email.getTenantId())) {
            throw new IllegalArgumentException("Email not found");
        }
        return toDto(email);
    }

    private EmailDto toDto(Email email) {
        EmailDto dto = new EmailDto();
        dto.setId(email.getId());
        dto.setTenantId(email.getTenantId());
        dto.setCustomerEmail(email.getCustomerEmail());
        dto.setSubject(email.getSubject());
        dto.setBody(email.getBody());
        dto.setStatus(email.getStatus());
        dto.setProcessed(email.isProcessed());
        dto.setCreatedAt(email.getCreatedAt());
        return dto;
    }
}
