package com.shipsmart.api.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Quote API endpoints.
 * Owns the quote retrieval and saved-option lifecycle.
 *
 * TODO: Implement quote service and connect to Supabase Postgres.
 * TODO: The Lovable project had Supabase Edge Functions for quote fetching
 *       (get-shipping-quotes, save-option, get-saved-options, remove-saved-option).
 *       These should be migrated here or kept as Supabase Edge Functions temporarily.
 *       See docs/migration-from-lovable.md for the decision.
 *
 * Service boundary: Java owns quotes as the system-of-record.
 * FastAPI may assist with AI-ranked recommendations but does NOT write quote records.
 */
@RestController
@RequestMapping("/api/v1/quotes")
public class QuoteController {

    /**
     * GET /api/v1/quotes?shipmentRequestId={id}
     * Retrieve quotes for a given shipment request.
     * TODO: Implement — fetch quotes from Supabase (quotes table).
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getQuotes(
            @RequestParam(required = false) String shipmentRequestId
    ) {
        return ResponseEntity.ok(Map.of(
                "data", java.util.List.of(),
                "message", "TODO: implement quote retrieval",
                "shipmentRequestId", shipmentRequestId != null ? shipmentRequestId : ""
        ));
    }

    /**
     * POST /api/v1/quotes/saved
     * Save a quote option for a user.
     * TODO: Implement — maps to the `saved_options` table in Supabase.
     */
    @PostMapping("/saved")
    public ResponseEntity<Map<String, Object>> saveOption(@RequestBody Map<String, Object> body) {
        return ResponseEntity.status(201).body(Map.of(
                "message", "TODO: implement save-option",
                "received", body
        ));
    }

    /**
     * GET /api/v1/quotes/saved
     * List saved options for the authenticated user.
     * TODO: Implement — filter by user from JWT.
     */
    @GetMapping("/saved")
    public ResponseEntity<Map<String, Object>> getSavedOptions() {
        return ResponseEntity.ok(Map.of(
                "data", java.util.List.of(),
                "message", "TODO: implement saved options listing"
        ));
    }

    /**
     * DELETE /api/v1/quotes/saved/{id}
     * Remove a saved option.
     * TODO: Implement — validate user owns the record before deleting.
     */
    @DeleteMapping("/saved/{id}")
    public ResponseEntity<Void> removeSavedOption(@PathVariable String id) {
        // TODO: quoteService.removeSavedOption(id, currentUserId);
        return ResponseEntity.noContent().build();
    }
}
