package com.neria.presupuestos.controller.sector;

import com.neria.presupuestos.model.dto.SectorCreateRequest;
import com.neria.presupuestos.model.dto.SectorConnectionTestResponse;
import com.neria.presupuestos.model.dto.SectorDto;
import com.neria.presupuestos.model.dto.SectorUpdateRequest;
import com.neria.presupuestos.service.sector.SectorService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/sectors")
public class SectorController {

    private final SectorService sectorService;

    public SectorController(SectorService sectorService) {
        this.sectorService = sectorService;
    }

    @GetMapping
    public ResponseEntity<List<SectorDto>> list(@RequestParam(value = "active", required = false) Boolean active) {
        boolean activeOnly = active != null && active;
        return ResponseEntity.ok(sectorService.list(activeOnly));
    }

    @PostMapping
    public ResponseEntity<SectorDto> create(@RequestBody SectorCreateRequest request) {
        return ResponseEntity.ok(sectorService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SectorDto> update(@PathVariable String id, @RequestBody SectorUpdateRequest request) {
        return ResponseEntity.ok(sectorService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        sectorService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/test-connection")
    public ResponseEntity<SectorConnectionTestResponse> testConnection(@PathVariable String id) {
        return ResponseEntity.ok(sectorService.testConnection(id));
    }
}
