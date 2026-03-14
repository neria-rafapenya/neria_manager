package com.neria.presupuestos.service.auth;

import com.neria.presupuestos.config.security.JwtService;
import com.neria.presupuestos.config.security.JwtUser;
import com.neria.presupuestos.model.dto.AuthResponse;
import com.neria.presupuestos.model.dto.ChangePasswordRequest;
import com.neria.presupuestos.model.dto.LoginRequest;
import com.neria.presupuestos.model.dto.RegisterRequest;
import com.neria.presupuestos.model.dto.TenantDto;
import com.neria.presupuestos.model.dto.UserDto;
import com.neria.presupuestos.model.entity.Tenant;
import com.neria.presupuestos.model.entity.User;
import com.neria.presupuestos.model.entity.UserRole;
import com.neria.presupuestos.repository.auth.UserRepository;
import com.neria.presupuestos.repository.tenant.TenantRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final TenantRepository tenantRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository,
                       TenantRepository tenantRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService) {
        this.userRepository = userRepository;
        this.tenantRepository = tenantRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));
        if (user.getPasswordHash() == null || !passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid credentials");
        }
        Tenant tenant = tenantRepository.findById(user.getTenantId())
                .orElseThrow(() -> new IllegalStateException("Tenant not found"));
        return buildAuthResponse(user, tenant);
    }

    public void changePassword(JwtUser jwtUser, ChangePasswordRequest request) {
        if (request == null || request.getNewPassword() == null || request.getNewPassword().isBlank()) {
            throw new IllegalArgumentException("New password is required");
        }
        User user = userRepository.findById(jwtUser.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (user.getPasswordHash() == null || request.getCurrentPassword() == null
                || !passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Current password is invalid");
        }
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setMustChangePassword(false);
        userRepository.save(user);
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Email already registered");
        }
        Tenant tenant = new Tenant();
        tenant.setName(request.getTenantName());
        tenant.setSector(request.getTenantSector());
        tenant = tenantRepository.save(tenant);

        User user = new User();
        user.setTenantId(tenant.getId());
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(UserRole.ADMIN);
        user = userRepository.save(user);

        return buildAuthResponse(user, tenant);
    }

    private AuthResponse buildAuthResponse(User user, Tenant tenant) {
        JwtUser jwtUser = new JwtUser(user.getId(), user.getTenantId(), user.getEmail(), user.getRole());
        String token = jwtService.generateToken(jwtUser);

        AuthResponse response = new AuthResponse();
        response.setToken(token);
        response.setUser(toUserDto(user));
        response.setTenant(toTenantDto(tenant));
        return response;
    }

    private UserDto toUserDto(User user) {
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setTenantId(user.getTenantId());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole());
        dto.setMustChangePassword(user.isMustChangePassword());
        dto.setCreatedAt(user.getCreatedAt());
        return dto;
    }

    private TenantDto toTenantDto(Tenant tenant) {
        TenantDto dto = new TenantDto();
        dto.setId(tenant.getId());
        dto.setName(tenant.getName());
        dto.setSector(tenant.getSector());
        dto.setActive(tenant.isActive());
        dto.setCreatedAt(tenant.getCreatedAt());
        return dto;
    }
}
