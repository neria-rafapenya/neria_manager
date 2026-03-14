package com.neria.presupuestos.service.customer;

import com.neria.presupuestos.model.dto.CustomerCreateRequest;
import com.neria.presupuestos.model.dto.CustomerDto;
import com.neria.presupuestos.model.dto.CustomerUpdateRequest;
import com.neria.presupuestos.model.entity.Customer;
import com.neria.presupuestos.model.entity.User;
import com.neria.presupuestos.model.entity.UserRole;
import com.neria.presupuestos.repository.auth.UserRepository;
import com.neria.presupuestos.repository.customer.CustomerRepository;
import com.neria.presupuestos.util.TenantResolver;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final String masterPassword;

    public CustomerService(CustomerRepository customerRepository,
                           UserRepository userRepository,
                           PasswordEncoder passwordEncoder,
                           @Value("${presupuestos.auth.masterPassword:}") String masterPassword) {
        this.customerRepository = customerRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.masterPassword = masterPassword;
    }

    public List<CustomerDto> list() {
        String tenantId = TenantResolver.requireTenantId();
        return customerRepository.findByTenantId(tenantId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public CustomerDto create(CustomerCreateRequest request) {
        String tenantId = TenantResolver.requireTenantId();
        Customer customer = new Customer();
        customer.setTenantId(tenantId);
        customer.setName(request.getName());
        customer.setEmail(request.getEmail());
        customer.setPhone(request.getPhone());
        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            customer.setUserId(resolveOrCreateUser(tenantId, request.getEmail()));
        }
        return toDto(customerRepository.save(customer));
    }

    @Transactional
    public CustomerDto update(String id, CustomerUpdateRequest request) {
        Customer customer = getCustomerOrThrow(id);
        if (request.getName() != null) {
            customer.setName(request.getName());
        }
        if (request.getEmail() != null) {
            customer.setEmail(request.getEmail());
            syncUserEmail(customer, request.getEmail());
        }
        if (request.getPhone() != null) {
            customer.setPhone(request.getPhone());
        }
        return toDto(customerRepository.save(customer));
    }

    private Customer getCustomerOrThrow(String id) {
        String tenantId = TenantResolver.requireTenantId();
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Customer not found"));
        if (!tenantId.equals(customer.getTenantId())) {
            throw new IllegalArgumentException("Customer not found");
        }
        return customer;
    }

    private CustomerDto toDto(Customer customer) {
        CustomerDto dto = new CustomerDto();
        dto.setId(customer.getId());
        dto.setTenantId(customer.getTenantId());
        dto.setName(customer.getName());
        dto.setEmail(customer.getEmail());
        dto.setPhone(customer.getPhone());
        dto.setUserId(customer.getUserId());
        dto.setCreatedAt(customer.getCreatedAt());
        return dto;
    }

    private String resolveOrCreateUser(String tenantId, String email) {
        Optional<User> existing = userRepository.findByEmail(email);
        if (existing.isPresent()) {
            User user = existing.get();
            if (!tenantId.equals(user.getTenantId())) {
                throw new IllegalArgumentException("Email already belongs to another tenant");
            }
            return user.getId();
        }
        if (masterPassword == null || masterPassword.isBlank()) {
            throw new IllegalStateException("MASTER_PASSWORD is not configured");
        }
        User user = new User();
        user.setTenantId(tenantId);
        user.setEmail(email);
        user.setRole(UserRole.STAFF);
        user.setPasswordHash(passwordEncoder.encode(masterPassword));
        user.setMustChangePassword(true);
        return userRepository.save(user).getId();
    }

    private void syncUserEmail(Customer customer, String email) {
        if (customer.getUserId() == null || email == null || email.isBlank()) {
            return;
        }
        User user = userRepository.findById(customer.getUserId())
                .orElse(null);
        if (user == null) {
            return;
        }
        if (!customer.getTenantId().equals(user.getTenantId())) {
            throw new IllegalArgumentException("User mismatch");
        }
        if (!email.equalsIgnoreCase(user.getEmail())) {
            if (userRepository.findByEmail(email).isPresent()) {
                throw new IllegalArgumentException("Email already registered");
            }
            user.setEmail(email);
            userRepository.save(user);
        }
    }
}
