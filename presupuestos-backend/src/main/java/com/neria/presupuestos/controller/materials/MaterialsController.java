package com.neria.presupuestos.controller.materials;

import com.neria.presupuestos.model.dto.MaterialCreateRequest;
import com.neria.presupuestos.model.dto.MaterialDto;
import com.neria.presupuestos.model.dto.MaterialUpdateRequest;
import com.neria.presupuestos.service.material.MaterialService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/materials")
public class MaterialsController {

    private final MaterialService materialService;

    public MaterialsController(MaterialService materialService) {
        this.materialService = materialService;
    }

    @GetMapping
    public ResponseEntity<List<MaterialDto>> list(@RequestParam(required = false) String sectorId) {
        return ResponseEntity.ok(materialService.list(sectorId));
    }

    @PostMapping
    public ResponseEntity<MaterialDto> create(@RequestBody MaterialCreateRequest request) {
        return ResponseEntity.ok(materialService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<MaterialDto> update(@PathVariable String id,
                                              @RequestBody MaterialUpdateRequest request) {
        return ResponseEntity.ok(materialService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        materialService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
