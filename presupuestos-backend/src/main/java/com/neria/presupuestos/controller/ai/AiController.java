package com.neria.presupuestos.controller.ai;

import com.neria.presupuestos.ai.parser.AiParserService;
import com.neria.presupuestos.model.dto.AiParseRequest;
import com.neria.presupuestos.model.dto.AiParseResponse;
import com.neria.presupuestos.model.dto.AiRequestDto;
import com.neria.presupuestos.service.ai.AiLogService;
import org.springframework.http.ResponseEntity;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/ai")
public class AiController {

    private final AiParserService aiParserService;
    private final AiLogService aiLogService;

    public AiController(AiParserService aiParserService, AiLogService aiLogService) {
        this.aiParserService = aiParserService;
        this.aiLogService = aiLogService;
    }

    @PostMapping("/parse-request")
    public ResponseEntity<AiParseResponse> parse(@RequestBody AiParseRequest request) {
        return ResponseEntity.ok(aiParserService.parse(request));
    }

    @GetMapping("/logs")
    public ResponseEntity<List<AiRequestDto>> logs(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "true") boolean onlyErrors
    ) {
        return ResponseEntity.ok(aiLogService.fetchLogs(from, to, onlyErrors));
    }
}
