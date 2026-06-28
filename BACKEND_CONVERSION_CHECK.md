# Backend Currency Conversion — Verification Needed

## What the frontend guide says is supported

According to `FRONTEND_CURRENCY_GUIDE.md`, the backend already has:

### 1. GET endpoints — `?currency=XXX` (display conversion)
All financial endpoints accept `?currency=XXX` and return converted amounts:
- `GET /api/transactions/?currency=USD`
- `GET /api/transactions/analytics/?currency=USD`
- `GET /api/flocks/?currency=USD`
- `GET /api/flocks/cycle_comparison/?currency=USD`
- `GET /api/feed-logs/?currency=USD`
- `GET /api/health-logs/?currency=USD`

Response includes `display_currency` and `original_currency` when conversion happens.

### 2. POST endpoints — `currency` field in body
Records accept a `currency` field in the POST body. If omitted, defaults to `farm.base_currency`.

### 3. Supporting endpoints
- `GET /api/currencies/` — list of supported currencies ✅
- `GET /api/exchange-rates/` — exchange rate pairs ✅
- Login `POST /api/token/` — returns `farm.base_currency` ✅

---

## What needs to be verified

### Issue: Finance page amounts not converting
The frontend passes `?currency=USD` to `GET /api/transactions/`, but the returned amounts still appear to be in the base currency (NGN) with just the symbol changed. **The backend may not actually be performing the conversion.**

### Verify these specific behaviors:

- [ ] **GET conversion**: Call `GET /api/transactions/?currency=USD` directly (e.g., via Postman/curl). Are the `amount` values actually converted, or are they the same as without the `?currency=` param?

- [ ] **POST conversion**: When sending `POST /api/transactions/` with `{ amount: 100, currency: "USD" }` where the farm's base_currency is NGN — does the backend:
  - (a) Store `amount=100, currency=USD` as-is? OR
  - (b) Convert to NGN (e.g., `amount=158050, currency=NGN`) and store in base currency?

  **We need option (b)** — all data should be stored in the farm's `base_currency`.

- [ ] **PATCH conversion**: Same question for `PATCH /api/transactions/{id}/` — does it convert the amount if `currency` differs from `base_currency`?

### If conversion is NOT working:
Have Claude implement on the backend:
1. A conversion mixin/utility that converts amounts using `ExchangeRate` model data
2. Apply it to all financial ViewSets for both `?currency=` GET param and `currency` POST field
3. Ensure all stored amounts are in `farm.base_currency`
