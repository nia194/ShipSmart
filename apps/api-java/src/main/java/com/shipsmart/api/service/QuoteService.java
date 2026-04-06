package com.shipsmart.api.service;

import com.shipsmart.api.domain.ShipmentRequest;
import com.shipsmart.api.dto.*;
import com.shipsmart.api.repository.ShipmentRequestRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * QuoteService — generates deterministic mock shipping quotes.
 * <p>
 * This is a direct port of the legacy Supabase edge function
 * {@code supabase/functions/get-shipping-quotes/index.ts}.
 * <p>
 * The logic is intentionally hardcoded for parity. Real carrier integrations
 * will replace this in a future phase.
 */
@Service
public class QuoteService {

    private static final Logger log = LoggerFactory.getLogger(QuoteService.class);
    private static final DateTimeFormatter DATE_FMT =
            DateTimeFormatter.ofPattern("EEE, MMM d", Locale.US);

    private final ShipmentRequestRepository shipmentRequestRepository;

    public QuoteService(ShipmentRequestRepository shipmentRequestRepository) {
        this.shipmentRequestRepository = shipmentRequestRepository;
    }

    /**
     * Generate quotes for a shipment request.
     * Persists the shipment request and returns mock quotes.
     */
    public QuoteResponse generateQuotes(QuoteRequest request, String userId) {
        // Calculate totals
        double totalWeight = request.packages().stream()
                .mapToDouble(p -> parseDouble(p.weight()) * parseInt(p.qty()))
                .sum();
        int totalItems = request.packages().stream()
                .mapToInt(p -> parseInt(p.qty()))
                .sum();

        // Persist shipment request (matches legacy edge function behavior)
        persistShipmentRequest(request, userId, totalWeight, totalItems);

        // Generate mock quotes (exact parity with edge function)
        return buildMockQuotes(request.dropOffDate(), totalWeight);
    }

    private void persistShipmentRequest(QuoteRequest request, String userId,
                                        double totalWeight, int totalItems) {
        try {
            ShipmentRequest entity = new ShipmentRequest();
            entity.setUserId(userId);
            entity.setOrigin(request.origin());
            entity.setDestination(request.destination());
            entity.setDropOffDate(LocalDate.parse(request.dropOffDate()));
            entity.setExpectedDeliveryDate(LocalDate.parse(request.expectedDeliveryDate()));
            entity.setPackagesJson(request.packages());
            entity.setTotalWeight(totalWeight);
            entity.setTotalItems(totalItems);
            shipmentRequestRepository.save(entity);
            log.debug("Persisted shipment request for {} -> {}", request.origin(), request.destination());
        } catch (Exception e) {
            // Log but don't fail the quote generation — same resilience as edge function
            log.warn("Failed to persist shipment request: {}", e.getMessage());
        }
    }

    // ── Mock quote generation (ported from edge function) ─────────────────────

    private QuoteResponse buildMockQuotes(String dropOffDate, double totalWeight) {
        double pm = Math.max(0.8, Math.min(2.0, totalWeight / 30.0));
        LocalDate baseDate = LocalDate.parse(dropOffDate);

        return new QuoteResponse(
                new QuoteSectionDto(
                        List.of(
                                upsGround(pm, baseDate),
                                fedexExpressSaver(pm, baseDate),
                                dhlExpressWorldwide(pm, baseDate)
                        ),
                        List.of(
                                fedexGround(pm, baseDate),
                                fedexGroundEconomy(pm, baseDate)
                        )
                ),
                new QuoteSectionDto(
                        List.of(
                                luglessStandard(pm, baseDate),
                                luggageToShipStandard(pm, baseDate)
                        ),
                        List.of(
                                luggageToShipEconomy(pm, baseDate)
                        )
                )
        );
    }

    // ── Prime top ─────────────────────────────────────────────────────────────

    private ShippingServiceDto upsGround(double pm, LocalDate baseDate) {
        return new ShippingServiceDto(
                "ups-ground", "UPS", "UPS\u00AE Ground", "STANDARD",
                round(58.90 * pm), null, 7,
                fmt(baseDate.plusDays(7)), null, false, null,
                "Best value. 98.2% on-time.",
                new BreakdownDto(
                        List.of(
                                new BreakdownLineDto("Base rate", round(42.15 * pm)),
                                new BreakdownLineDto("Residential Delivery", 6.95),
                                new BreakdownLineDto("Fuel Surcharge", round(5.27 * pm)),
                                new BreakdownLineDto("Extended Area", 4.53)
                        ),
                        List.of(new BreakdownLineDto("Scheduled Pickup", 0))
                ),
                orderedMap("Tracking", "UPS My Choice\u00AE", "Insurance", "$100 included", "Cutoff", "By 6 PM"),
                List.of("Tracking", "Access Point\u2122")
        );
    }

    private ShippingServiceDto fedexExpressSaver(double pm, LocalDate baseDate) {
        return new ShippingServiceDto(
                "fedex-express", "FedEx", "FedEx Express Saver\u00AE", "EXPRESS",
                round(124.30 * pm), round(146.24 * pm), 3,
                fmt(baseDate.plusDays(3)), "4:30 PM", true,
                new PromoDto("SPRING26", "15%", round(21.94 * pm), "Spring Sale"),
                "Fastest guaranteed under $130.",
                new BreakdownDto(
                        List.of(
                                new BreakdownLineDto("Base rate", round(108.40 * pm)),
                                new BreakdownLineDto("Residential Delivery", 6.95),
                                new BreakdownLineDto("Fuel Surcharge", round(15.72 * pm)),
                                new BreakdownLineDto("Spring Discount", -round(21.94 * pm))
                        ),
                        List.of(
                                new BreakdownLineDto("On Call Pickup", 14.75),
                                new BreakdownLineDto("Discount", -14.75)
                        )
                ),
                orderedMap("Guarantee", "Money-back", "Cutoff", "By 5:30 PM"),
                List.of("Money-back", "InSight\u00AE")
        );
    }

    private ShippingServiceDto dhlExpressWorldwide(double pm, LocalDate baseDate) {
        return new ShippingServiceDto(
                "dhl-express", "DHL", "DHL Express Worldwide", "EXPRESS",
                round(138.50 * pm), null, 3,
                fmt(baseDate.plusDays(3)), "12 PM", true, null,
                "Best international. Customs clearance.",
                new BreakdownDto(
                        List.of(
                                new BreakdownLineDto("Base rate", round(112.0 * pm)),
                                new BreakdownLineDto("Fuel Surcharge", round(16.80 * pm)),
                                new BreakdownLineDto("Customs", 9.70)
                        ),
                        List.of(new BreakdownLineDto("Courier Pickup", 0))
                ),
                orderedMap("Customs", "220+ countries", "Cutoff", "By 4 PM"),
                List.of("Guaranteed", "Global customs")
        );
    }

    // ── Prime more ────────────────────────────────────────────────────────────

    private ShippingServiceDto fedexGround(double pm, LocalDate baseDate) {
        return new ShippingServiceDto(
                "fedex-ground", "FedEx", "FedEx Ground\u00AE", "STANDARD",
                round(62.30 * pm), round(69.22 * pm), 7,
                fmt(baseDate.plusDays(7)), null, false,
                new PromoDto("NEWSHIP10", "10%", round(6.92 * pm), "New Customer"),
                "Budget with discount.",
                new BreakdownDto(
                        List.of(
                                new BreakdownLineDto("Base rate", round(48.50 * pm)),
                                new BreakdownLineDto("Residential", 6.95),
                                new BreakdownLineDto("Fuel", round(6.06 * pm)),
                                new BreakdownLineDto("Discount", -round(6.92 * pm))
                        ),
                        List.of(new BreakdownLineDto("FedEx Office", 0))
                ),
                orderedMap("Cutoff", "By 5 PM"),
                List.of("Tracking")
        );
    }

    private ShippingServiceDto fedexGroundEconomy(double pm, LocalDate baseDate) {
        return new ShippingServiceDto(
                "fedex-economy", "FedEx", "FedEx Ground\u00AE Economy", "ECONOMY",
                round(42.10 * pm), round(46.78 * pm), 9,
                fmt(baseDate.plusDays(9)), null, false,
                new PromoDto("NEWSHIP10", "10%", round(4.68 * pm), "New Customer"),
                "Cheapest major carrier.",
                new BreakdownDto(
                        List.of(
                                new BreakdownLineDto("Base", round(32.40 * pm)),
                                new BreakdownLineDto("Surcharge", 4.50),
                                new BreakdownLineDto("Fuel", round(3.24 * pm)),
                                new BreakdownLineDto("Discount", -round(4.68 * pm))
                        ),
                        List.of(new BreakdownLineDto("FedEx Office", 0))
                ),
                Map.of(),
                List.of("Budget")
        );
    }

    // ── Private top ───────────────────────────────────────────────────────────

    private ShippingServiceDto luglessStandard(double pm, LocalDate baseDate) {
        return new ShippingServiceDto(
                "ll-std", "Lugless", "Lugless Standard", "STANDARD",
                round(49.0 * pm), null, 6,
                fmt(baseDate.plusDays(6)), null, false, null,
                "Door-to-door specialist.",
                new BreakdownDto(
                        List.of(
                                new BreakdownLineDto("Base (door-to-door)", round(39.0 * pm)),
                                new BreakdownLineDto("Insurance", 6),
                                new BreakdownLineDto("Platform fee", 4)
                        ),
                        List.of(new BreakdownLineDto("Free pickup", 0))
                ),
                orderedMap("Pickup", "Free door pickup", "Insurance", "Full replacement"),
                List.of("Door pickup", "App tracking")
        );
    }

    private ShippingServiceDto luggageToShipStandard(double pm, LocalDate baseDate) {
        return new ShippingServiceDto(
                "lts-std", "LuggageToShip", "LuggageToShip Standard", "STANDARD",
                round(54.0 * pm), null, 5,
                fmt(baseDate.plusDays(5)), null, false, null,
                "Full-service with pro packing.",
                new BreakdownDto(
                        List.of(
                                new BreakdownLineDto("Base", round(42.0 * pm)),
                                new BreakdownLineDto("Insurance", 7),
                                new BreakdownLineDto("Booking fee", 5)
                        ),
                        List.of(new BreakdownLineDto("Home pickup", 0))
                ),
                orderedMap("Packing", "Pro packing +$15"),
                List.of("Home pickup", "Packing")
        );
    }

    // ── Private more ──────────────────────────────────────────────────────────

    private ShippingServiceDto luggageToShipEconomy(double pm, LocalDate baseDate) {
        return new ShippingServiceDto(
                "lts-econ", "LuggageToShip", "LuggageToShip Economy", "ECONOMY",
                round(39.0 * pm), null, 8,
                fmt(baseDate.plusDays(8)), null, false, null,
                "Most affordable.",
                new BreakdownDto(
                        List.of(
                                new BreakdownLineDto("Base", round(28.0 * pm)),
                                new BreakdownLineDto("Insurance", 4),
                                new BreakdownLineDto("Fee", 5),
                                new BreakdownLineDto("Handling", 2)
                        ),
                        List.of(new BreakdownLineDto("Partner drop-off", 0))
                ),
                Map.of(),
                List.of("Economy")
        );
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private String fmt(LocalDate date) {
        return date.format(DATE_FMT);
    }

    private static double round(double value) {
        return BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_UP).doubleValue();
    }

    private static double parseDouble(String s) {
        try { return Double.parseDouble(s); } catch (Exception e) { return 0; }
    }

    private static int parseInt(String s) {
        try { return Integer.parseInt(s); } catch (Exception e) { return 1; }
    }

    /** Preserves insertion order for JSON serialization parity with the edge function. */
    private static Map<String, String> orderedMap(String... keyValues) {
        Map<String, String> map = new LinkedHashMap<>();
        for (int i = 0; i < keyValues.length; i += 2) {
            map.put(keyValues[i], keyValues[i + 1]);
        }
        return map;
    }
}
