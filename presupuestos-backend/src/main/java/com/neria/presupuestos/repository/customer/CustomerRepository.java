package com.neria.presupuestos.repository.customer;

import com.neria.presupuestos.model.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CustomerRepository extends JpaRepository<Customer, String> {
    List<Customer> findByTenantId(String tenantId);

    Customer findByTenantIdAndUserId(String tenantId, String userId);

    Customer findByTenantIdAndEmailIgnoreCase(String tenantId, String email);
}
