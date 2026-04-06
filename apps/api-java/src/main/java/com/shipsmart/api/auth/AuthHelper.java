package com.shipsmart.api.auth;

import jakarta.servlet.http.HttpServletRequest;

import java.util.Optional;

/**
 * Utility to retrieve the authenticated userId from the request.
 * Works in tandem with {@link JwtAuthFilter}.
 */
public final class AuthHelper {

    private AuthHelper() {}

    /** Returns the authenticated user ID, or empty if not authenticated. */
    public static Optional<String> getUserId(HttpServletRequest request) {
        Object userId = request.getAttribute(JwtAuthFilter.USER_ID_ATTR);
        if (userId instanceof String s && !s.isBlank()) {
            return Optional.of(s);
        }
        return Optional.empty();
    }
}
