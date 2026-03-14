package com.neria.presupuestos.service.ai;

import com.neria.presupuestos.model.dto.AiRequestDto;
import com.neria.presupuestos.model.entity.AiRequest;
import com.neria.presupuestos.repository.ai.AiRequestRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Service
public class AiLogService {

    private final AiRequestRepository aiRequestRepository;

    public AiLogService(AiRequestRepository aiRequestRepository) {
        this.aiRequestRepository = aiRequestRepository;
    }

    public List<AiRequestDto> fetchLogs(LocalDate from, LocalDate to, boolean onlyErrors) {
        LocalDateTime fromDate = from == null ? null : from.atStartOfDay();
        LocalDateTime toDate = to == null ? null : to.atTime(LocalTime.MAX);
        return aiRequestRepository.searchLogs(fromDate, toDate, onlyErrors)
                .stream()
                .map(this::toDto)
                .toList();
    }

    private AiRequestDto toDto(AiRequest log) {
        AiRequestDto dto = new AiRequestDto();
        dto.setId(log.getId());
        dto.setTenantId(log.getTenantId());
        dto.setInputText(log.getInputText());
        dto.setParsedJson(log.getParsedJson());
        dto.setConfidence(log.getConfidence());
        dto.setErrorMessage(log.getErrorMessage());
        dto.setCreatedAt(log.getCreatedAt());
        return dto;
    }
}
