package com.neria.presupuestos.config.ratelimit;

import com.neria.presupuestos.util.TenantContext;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.BucketConfiguration;
import io.github.bucket4j.ConsumptionProbe;
import io.github.bucket4j.Refill;
import io.github.bucket4j.redis.lettuce.cas.LettuceBasedProxyManager;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.function.Supplier;

@Component
@ConditionalOnProperty(prefix = "presupuestos.rate-limit", name = "enabled", havingValue = "true")
public class RateLimitFilter extends OncePerRequestFilter {

    private final LettuceBasedProxyManager<byte[]> proxyManager;
    private final RateLimitProperties properties;

    public RateLimitFilter(LettuceBasedProxyManager<byte[]> proxyManager,
                           RateLimitProperties properties) {
        this.proxyManager = proxyManager;
        this.properties = properties;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return !properties.isEnabled()
                || "OPTIONS".equalsIgnoreCase(request.getMethod())
                || path.startsWith("/auth/")
                || path.startsWith("/actuator")
                || path.startsWith("/error");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String tenantId = TenantContext.getTenantId();
        if (tenantId == null || tenantId.isBlank()) {
            filterChain.doFilter(request, response);
            return;
        }

        String policyKey = isAiPath(request.getRequestURI()) ? "ai" : "default";
        RateLimitProperties.Policy policy = isAiPath(request.getRequestURI())
                ? properties.getAi()
                : properties.getDefaults();

        Supplier<BucketConfiguration> configSupplier = () -> BucketConfiguration.builder()
                .addLimit(Bandwidth.classic(
                        policy.getCapacity(),
                        Refill.intervally(policy.getRefillTokens(), Duration.ofSeconds(policy.getRefillPeriodSeconds()))
                ))
                .build();

        byte[] bucketKey = ("rl:" + policyKey + ":" + tenantId).getBytes(StandardCharsets.UTF_8);
        Bucket bucket = proxyManager.builder().build(bucketKey, configSupplier);
        ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);
        if (probe.isConsumed()) {
            response.setHeader("X-RateLimit-Remaining", String.valueOf(probe.getRemainingTokens()));
            filterChain.doFilter(request, response);
        } else {
            response.setStatus(429);
            response.getWriter().write("Too Many Requests");
        }
    }

    private boolean isAiPath(String path) {
        return path.startsWith("/ai/") || path.equals("/quote/calculate");
    }
}
