# Post-Deploy Smoke Test Checklist

Run these tests after each deployment or flag change.

## Prerequisites

- All services are deployed and healthy
- Feature flags are set to the target state
- You have a Supabase test account (email/password)

## API Health Checks

- [ ] `GET https://shipsmart-api-java.onrender.com/api/v1/health` → 200 `{"status":"ok"}`
- [ ] `GET https://shipsmart-api-java.onrender.com/actuator/health` → 200 `{"status":"UP"}`
- [ ] `GET https://shipsmart-api-python.onrender.com/health` → 200 (if deployed)

## Quote Flow

- [ ] Open the app in browser
- [ ] Enter origin, destination, dates, and package details
- [ ] Click "Get Quotes"
- [ ] Verify quote results appear with carriers, prices, and transit times
- [ ] Verify no console errors

## Auth Flow

- [ ] Sign up with a new email or sign in with existing account
- [ ] Verify redirect to dashboard / logged-in state
- [ ] Sign out and verify return to anonymous state

## Saved Options (requires auth)

- [ ] Sign in
- [ ] Get quotes
- [ ] Click the bookmark icon on a quote → verify "Saved!" toast
- [ ] Navigate to saved options view → verify the saved option appears
- [ ] Click remove on a saved option → verify "Removed" toast
- [ ] Refresh page → verify saved options list is correct

## Booking Redirect

- [ ] Get quotes
- [ ] Expand a quote row → click "Book on [Carrier]"
- [ ] Verify a new tab opens to the carrier checkout URL
- [ ] Verify no console errors (redirect tracking is fire-and-forget)

## Unauthorized Access

- [ ] Sign out
- [ ] Open browser devtools → Network tab
- [ ] Try to access saved options (if UI allows) → verify 401 response
- [ ] Try `GET /api/v1/saved-options` directly → 401 JSON response

## Validation Errors

- [ ] Send `POST /api/v1/quotes` with empty body → 400 with field errors
- [ ] Send `POST /api/v1/bookings/redirect` with `{}` → 400 with validation message

## Security Headers

- [ ] Check response headers on any Java API response:
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Content-Security-Policy: default-src 'none'; frame-ancestors 'none'`

## CORS

- [ ] Verify frontend can call Java API without CORS errors
- [ ] Verify browser console shows no `Access-Control-Allow-Origin` errors

## Rollback Verification (if testing rollback)

- [ ] Set one feature flag to `"false"` in Render
- [ ] Trigger rebuild of static site
- [ ] Verify the affected flow now uses Supabase edge function
- [ ] Verify other flows (with flags still `"true"`) still use Java API
- [ ] Reset flag back to `"true"` when done
