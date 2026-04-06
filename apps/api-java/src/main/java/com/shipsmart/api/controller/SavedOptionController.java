package com.shipsmart.api.controller;

import com.shipsmart.api.auth.AuthHelper;
import com.shipsmart.api.dto.SaveOptionRequest;
import com.shipsmart.api.dto.SavedOptionResponse;
import com.shipsmart.api.service.SavedOptionService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Saved option API endpoints.
 * All endpoints require authentication (Supabase JWT).
 * Replaces legacy edge functions: save-option, get-saved-options, remove-saved-option.
 */
@RestController
@RequestMapping("/api/v1/saved-options")
public class SavedOptionController {

    private final SavedOptionService savedOptionService;

    public SavedOptionController(SavedOptionService savedOptionService) {
        this.savedOptionService = savedOptionService;
    }

    /**
     * GET /api/v1/saved-options
     * Returns all saved options for the authenticated user.
     */
    @GetMapping
    public ResponseEntity<?> getSavedOptions(HttpServletRequest request) {
        return AuthHelper.getUserId(request)
                .<ResponseEntity<?>>map(userId -> ResponseEntity.ok(savedOptionService.listForUser(userId)))
                .orElseGet(() -> unauthorized());
    }

    /**
     * POST /api/v1/saved-options
     * Saves a shipping option for the authenticated user.
     */
    @PostMapping
    public ResponseEntity<?> saveOption(
            HttpServletRequest request,
            @Valid @RequestBody SaveOptionRequest body
    ) {
        return AuthHelper.getUserId(request)
                .<ResponseEntity<?>>map(userId -> {
                    SavedOptionResponse saved = savedOptionService.save(userId, body);
                    return ResponseEntity.ok(saved);
                })
                .orElseGet(() -> unauthorized());
    }

    /**
     * DELETE /api/v1/saved-options/{id}
     * Removes a saved option. User must own the option.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> removeSavedOption(
            HttpServletRequest request,
            @PathVariable String id
    ) {
        return AuthHelper.getUserId(request)
                .<ResponseEntity<?>>map(userId -> {
                    boolean deleted = savedOptionService.remove(userId, id);
                    if (deleted) {
                        return ResponseEntity.ok(Map.of("success", true));
                    }
                    return ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(Map.of("error", "Option not found or not owned by user"));
                })
                .orElseGet(() -> unauthorized());
    }

    private ResponseEntity<Map<String, String>> unauthorized() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Authentication required"));
    }
}
