package com.neria.presupuestos.config.security;

import com.neria.presupuestos.model.entity.UserRole;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.time.Instant;
import java.util.Date;

@Service
public class JwtService {

    private final Key signingKey;
    private final String issuer;
    private final long expirationMinutes;

    public JwtService(
            @Value("${security.jwt.secret}") String secret,
            @Value("${security.jwt.issuer}") String issuer,
            @Value("${security.jwt.expirationMinutes:120}") long expirationMinutes
    ) {
        this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.issuer = issuer;
        this.expirationMinutes = expirationMinutes;
    }

    public String generateToken(JwtUser user) {
        Instant now = Instant.now();
        Instant exp = now.plusSeconds(expirationMinutes * 60);
        return Jwts.builder()
                .setSubject(user.getUserId())
                .setIssuer(issuer)
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(exp))
                .claim("tenant_id", user.getTenantId())
                .claim("role", user.getRole().name())
                .claim("email", user.getEmail())
                .signWith(signingKey, SignatureAlgorithm.HS256)
                .compact();
    }

    public JwtUser parseToken(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(signingKey)
                .requireIssuer(issuer)
                .build()
                .parseClaimsJws(token)
                .getBody();

        String userId = claims.getSubject();
        String tenantId = claims.get("tenant_id", String.class);
        String email = claims.get("email", String.class);
        String roleValue = claims.get("role", String.class);
        UserRole role = roleValue == null ? UserRole.STAFF : UserRole.valueOf(roleValue);

        return new JwtUser(userId, tenantId, email, role);
    }
}
