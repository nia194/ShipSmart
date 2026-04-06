package com.shipsmart.api.auth;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

/**
 * Lightweight JWT filter for Supabase token verification.
 * <p>
 * Extracts the user ID (sub claim) from the JWT in the Authorization header
 * and stores it as a request attribute. Endpoints that require auth check
 * for this attribute; endpoints that don't (like /api/v1/quotes) ignore it.
 * <p>
 * This is intentionally NOT Spring Security — just a servlet filter.
 */
@Component
@Order(1)
public class JwtAuthFilter implements Filter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthFilter.class);
    public static final String USER_ID_ATTR = "shipsmart.userId";

    @Value("${shipsmart.supabase.jwt-secret:}")
    private String jwtSecret;

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest httpReq = (HttpServletRequest) request;
        String authHeader = httpReq.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            String userId = extractUserId(token);
            if (userId != null) {
                httpReq.setAttribute(USER_ID_ATTR, userId);
            }
        }

        chain.doFilter(request, response);
    }

    private String extractUserId(String token) {
        if (jwtSecret == null || jwtSecret.isBlank()) {
            // No secret configured — try decoding without verification (dev mode)
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
            // JWT has 3 parts: header.payload.signature
            String[] parts = token.split("\\.");
            if (parts.length < 2) return null;
            String payload = new String(
                    java.util.Base64.getUrlDecoder().decode(parts[1]),
                    StandardCharsets.UTF_8
            );
            // Simple JSON extraction for "sub" field
            var mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            var node = mapper.readTree(payload);
            return node.has("sub") ? node.get("sub").asText() : null;
        } catch (Exception e) {
            log.debug("JWT decode (unsafe) failed: {}", e.getMessage());
            return null;
        }
    }
}
