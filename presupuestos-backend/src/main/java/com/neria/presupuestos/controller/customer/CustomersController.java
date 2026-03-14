package com.neria.presupuestos.controller.customer;

import com.neria.presupuestos.model.dto.CustomerCreateRequest;
import com.neria.presupuestos.model.dto.CustomerDto;
import com.neria.presupuestos.model.dto.CustomerUpdateRequest;
import com.neria.presupuestos.service.customer.CustomerService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/customers")
public class CustomersController {

    private final CustomerService customerService;

    public CustomersController(CustomerService customerService) {
        this.customerService = customerService;
    }

    @GetMapping
    public ResponseEntity<List<CustomerDto>> list() {
        return ResponseEntity.ok(customerService.list());
    }

    @PostMapping
    public ResponseEntity<CustomerDto> create(@RequestBody CustomerCreateRequest request) {
        return ResponseEntity.ok(customerService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CustomerDto> update(@PathVariable String id, @RequestBody CustomerUpdateRequest request) {
        return ResponseEntity.ok(customerService.update(id, request));
    }
}
