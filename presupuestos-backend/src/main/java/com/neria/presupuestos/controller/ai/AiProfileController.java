package com.neria.presupuestos.controller.ai;

import com.neria.presupuestos.model.dto.AiProfileCreateRequest;
import com.neria.presupuestos.model.dto.AiProfileDto;
import com.neria.presupuestos.model.dto.AiProfileUpdateRequest;
import com.neria.presupuestos.service.ai.AiProfileService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/ai/profiles")
public class AiProfileController {

    private final AiProfileService aiProfileService;

    public AiProfileController(AiProfileService aiProfileService) {
        this.aiProfileService = aiProfileService;
    }

    @GetMapping
    public ResponseEntity<List<AiProfileDto>> listProfiles() {
        return ResponseEntity.ok(aiProfileService.list());
    }

    @GetMapping("/resolve")
    public ResponseEntity<AiProfileDto> resolveProfile(
            @RequestParam(required = false) String sectorId,
            @RequestParam(required = false) String productId
    ) {
        AiProfileDto resolved = aiProfileService.resolve(sectorId, productId);
        if (resolved == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(resolved);
    }

    @PostMapping
    public ResponseEntity<AiProfileDto> createProfile(@RequestBody AiProfileCreateRequest request) {
        return ResponseEntity.ok(aiProfileService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AiProfileDto> updateProfile(@PathVariable String id,
                                                      @RequestBody AiProfileUpdateRequest request) {
        return ResponseEntity.ok(aiProfileService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProfile(@PathVariable String id) {
        aiProfileService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
