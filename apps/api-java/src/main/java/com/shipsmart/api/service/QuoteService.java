package com.shipsmart.api.service;

import org.springframework.stereotype.Service;

/**
 * QuoteService — core business logic for quotes and saved options.
 *
 * TODO: Inject repositories when database layer is wired.
 * TODO: Decision needed: carrier integrations are NOT implemented here.
 *   - Do NOT add fake carrier API calls.
 *   - Quote sourcing strategy (carrier APIs, third-party aggregator) is TBD.
 *   - See docs/service-boundaries.md for decision record.
 *
 * Tables owned (Supabase Postgres):
 *   - quotes (carrier, service_name, price, transit_days, tier, ...)
 *   - saved_options (user_id, origin, destination, carrier, price, ...)
 */
@Service
public class QuoteService {

    // TODO: private final QuoteRepository quoteRepository;
    // TODO: private final SavedOptionRepository savedOptionRepository;

    // TODO: public List<QuoteDto> getQuotesForShipment(String shipmentRequestId) { ... }
    // TODO: public SavedOptionDto saveOption(SaveOptionRequest request, String userId) { ... }
    // TODO: public List<SavedOptionDto> getSavedOptions(String userId) { ... }
    // TODO: public void removeSavedOption(String id, String userId) { ... }
}
