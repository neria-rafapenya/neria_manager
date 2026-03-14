package com.neria.presupuestos.controller.formula;

import com.neria.presupuestos.model.dto.FormulaCreateRequest;
import com.neria.presupuestos.model.dto.FormulaDto;
import com.neria.presupuestos.model.dto.FormulaUpdateRequest;
import com.neria.presupuestos.service.formula.FormulaService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/formulas")
public class FormulaController {

    private final FormulaService formulaService;

    public FormulaController(FormulaService formulaService) {
        this.formulaService = formulaService;
    }

    @GetMapping
    public ResponseEntity<List<FormulaDto>> list(@RequestParam(value = "active", required = false) Boolean active) {
        boolean activeOnly = active != null && active;
        return ResponseEntity.ok(formulaService.list(activeOnly));
    }

    @PostMapping
    public ResponseEntity<FormulaDto> create(@RequestBody FormulaCreateRequest request) {
        return ResponseEntity.ok(formulaService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<FormulaDto> update(@PathVariable String id, @RequestBody FormulaUpdateRequest request) {
        return ResponseEntity.ok(formulaService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        formulaService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
