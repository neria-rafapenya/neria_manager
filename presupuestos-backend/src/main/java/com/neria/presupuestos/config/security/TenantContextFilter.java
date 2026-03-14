package com.neria.presupuestos.config.security;

import com.neria.presupuestos.util.TenantContext;
import jakarta.persistence.EntityManager;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.hibernate.Filter;
import org.hibernate.Session;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

public class TenantContextFilter extends OncePerRequestFilter {

    private final String tenantHeader;
    private final EntityManager entityManager;

    public TenantContextFilter(String tenantHeader, EntityManager entityManager) {
        this.tenantHeader = tenantHeader;
        this.entityManager = entityManager;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String tenantId = resolveTenantFromSecurityContext();
        if (tenantId == null || tenantId.isBlank()) {
            tenantId = request.getHeader(tenantHeader);
        }
        if (tenantId != null && !tenantId.isBlank()) {
            TenantContext.setTenantId(tenantId);
            enableTenantFilter(tenantId);
        }
        try {
            filterChain.doFilter(request, response);
        } finally {
            disableTenantFilter();
            TenantContext.clear();
        }
    }

    private String resolveTenantFromSecurityContext() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getPrincipal() == null) {
            return null;
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof JwtUser jwtUser) {
            return jwtUser.getTenantId();
        }
        return null;
    }

    private void enableTenantFilter(String tenantId) {
        try {
            Session session = entityManager.unwrap(Session.class);
            Filter filter = session.enableFilter("tenantFilter");
            filter.setParameter("tenantId", tenantId);
        } catch (Exception ignored) {
            // If no session is bound yet, skip; repositories that run will bind later in the request.
        }
    }

    private void disableTenantFilter() {
        try {
            Session session = entityManager.unwrap(Session.class);
            session.disableFilter("tenantFilter");
        } catch (Exception ignored) {
            // Ignore if session is already closed or not bound.
        }
    }
}
