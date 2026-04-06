package com.shipsmart.api.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.List;
import java.util.Map;

/**
 * Request body for POST /api/v1/saved-options.
 * Matches the payload sent by the frontend useSavedOptions hook.
 */
public record SaveOptionRequest(
        @NotBlank String quoteServiceId,
        @NotBlank String carrier,
        @NotBlank String serviceName,
        @NotBlank String origin,
        @NotBlank String destination,
        String tier,
        Double price,
        Double originalPrice,
        Integer transitDays,
        String estimatedDelivery,
        String deliverByTime,
        Boolean guaranteed,
        Object promo,
        String aiRecommendation,
        Object breakdown,
        Object details,
        List<String> features,
        String dropOffDate,
        String expectedDeliveryDate,
        String packageSummary,
        String bookUrl
) {}
