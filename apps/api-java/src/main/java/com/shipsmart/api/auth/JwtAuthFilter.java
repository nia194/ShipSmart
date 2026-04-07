package com.shipsmart.api.auth;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.crypto.SecretKey;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.UUID;

/**
 * JWT authentication filter for Supabase token verification.
 * <p>
 * Extracts the user ID (sub claim) from the JWT in the Authorization header
 * and stores it in the Spring SecurityContext. Runs on every request but
 * does NOT enforce auth — that is handled by the SecurityFilterChain rules.
 */
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthFilter.class);

    @Value("${shipsmart.supabase.jwt-secret:}")
    private String jwtSecret;

    @Value("${shipsmart.security.require-jwt-secret:false}")
    private boolean requireJwtSecret;

    @PostConstruct
    void validateConfig() {
        if (requireJwtSecret && (jwtSecret == null || jwtSecret.isBlank())) {
            throw new IllegalStateException("SUPABASE_JWT_SECRET must be set when shipsmart.security.require-jwt-secret=true (production)");
        }
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        MDC.put("requestId", UUID.randomUUID().toString().substring(0, 8));
        try {
            String authHeader = request.getHeader("Authorization");

            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                String userId = extractUserId(token);
                if (userId != null) {
                    var auth = new UsernamePasswordAuthenticationToken(userId, null, Collections.emptyList());
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            }

            filterChain.doFilter(request, response);
        } finally {
            SecurityContextHolder.clearContext();
            MDC.clear();
        }
    }

    private String extractUserId(String token) {
        if (jwtSecret == null || jwtSecret.isBlank()) {
            log.warn("SUPABASE_JWT_SECRET not set; skipping JWT signature verification");
            return extractUserIdUnsafe(token);
        }

        try {
            SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            return claims.getSubject();
        } catch (Exception e) {
            log.debug("JWT verification failed: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Decode JWT payload without signature verification.
     * Only used when SUPABASE_JWT_SECRET is not configured (local dev).
     */
    private String extractUserIdUnsafe(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length < 2) return null;
            String payload = new String(
                    java.util.Base64.getUrlDecoder().decode(parts[1]),
                    StandardCharsets.UTF_8
            );
            var mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            var node = mapper.readTree(payload);
            return node.has("sub") ? node.get("sub").asText() : null;
        } catch (Exception e) {
            log.debug("JWT decode (unsafe) failed: {}", e.getMessage());
            return null;
        }
    }
}
