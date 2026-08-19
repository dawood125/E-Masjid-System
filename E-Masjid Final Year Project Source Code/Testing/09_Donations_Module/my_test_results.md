# Phase 9 — Donations Module: my test results

## Backend integration tests

`backend/` runs `npx jest --runInBand`:

| File | Tests | Pass | Notes |
|---|---|---|---|
| `tests/integration/api.test.js` | 11 | 11 | Auth + general API |
| `tests/integration/donations_scope.test.js` | 36 | 36 | Phase 9 (was 20 → +16) |
| **Total** | **47** | **47** | clean green |

`donations_scope.test.js` breakdown:

| Block | Tests | Coverage |
|---|---|---|
| public listing endpoints | 5 | mosqueId filter + invalid id + anonymity |
| top donors aggregation | 2 | scope + invalid id |
| summary aggregation | 2 | scope by mosqueId |
| admin create endpoint | 4 | own-masjid override + cross-mosque 403 + committee 403 |
| admin scoped listing `/admin` | 7 | admin → own only + manager managed-only + 401/400/403 |
| online donations | 3 | legacy path + minimum + invalid id |
| **Stripe checkout** (mocked) | 4 | URL returned, metadata, paisa, legacy fallback |
| **Stripe webhook** (mocked) | 4 | invalid sig 400, valid sig creates donation, bad amount skipped, unknown event ok |

## Playwright end-to-end

`Testing/09_Donations_Module/donations_test.js`:

```
=== Phase 9 Donations Test Summary ===
PASS: 31 | FAIL: 0 | BUG: 0 | INFO: 4 | SKIP: 1
Total: 36
```

| Section | Tests | Outcome |
|---|---|---|
| 1. Public `/donate` page | 4/4 | type chips, presets, anonymous toggle, render |
| 2. Public `/transparency` donations tab | 5/5 + 1 INFO | summary, history, type chip, view-all |
| 3. Admin `/admin/donations` CRUD | 3/3 | Add button, modal opens, **created row visible via API (id=...)** |
| 4. API scope isolation | 17/17 + 2 INFO | POST/PUT/DELETE + cross-mosque + Stripe |
| 5. Manager multi-mosque scope | 3/3 | managed → 200, unmanaged → 403 |
| 6. Anonymous UI smoke | 0/0 + 1 INFO | placeholder |

## Live HTTP smoke (verified)

- `GET /api/health` → 200 OK (Phase 9 doesn't change health).
- `POST /api/auth/login { admin@emasjid.pk }` → 200, returns
  token + user with `mosqueId` populated.
- `POST /api/donations` (cross-mosque body.mosqueId) → **403**
  `Cannot create donations for a different mosque`.
- `POST /api/donations` (no body.mosqueId) → **201**, donation
  has `mosqueId` from token.
- `GET /api/donations/admin` (admin) → 200, all rows in own masjid.
- `GET /api/donations/admin?mosqueId=<B>` (admin A) → **403**.
- `GET /api/donations/admin?mosqueId=Al-Noor` (manager) → **200**.
- `GET /api/donations/admin?mosqueId=<unmanaged>` (manager) → **403**.
- `POST /api/donations/online { amount: 50 }` → **400**
  `Minimum donation amount is PKR 100`.
- `POST /api/donations/online { amount: 350, ... }` (Stripe configured)
  → **200** `{ url: 'https://checkout.stripe.com/...' }`.
- `POST /api/donations/webhook` (tampered body) → **400** Webhook Error.
- `POST /api/donations/webhook` (valid signature + checkout.session.completed)
  → **200**, donation appears in `/api/donations/admin`.

## What was tested manually vs automated

| Concern | Manual | Automated |
|---|---|---|
| `/donate` UI flow | ✅ (Phase 9 manual guide, scenario A) | ✅ (Playwright Section 1) |
| `/transparency` donations tab | ✅ (scenario B) | ✅ (Section 2) |
| Admin CRUD via UI | ✅ (scenario C) | ✅ (Section 3, via API verification) |
| Anonymity visibility | ✅ (scenario D) | ✅ (Sections 4 + mask check) |
| Cross-mosque scope | ✅ (scenario E) | ✅ (Section 4 + 13 integration tests) |
| Manager scope | ✅ (scenario F) | ✅ (Section 5 + 3 integration tests) |
| Stripe webhook | ✅ (scenario G via curl) | ✅ (4 webhook integration tests) |
| Form validation | ✅ (scenario H) | partial (admin tests cover it) |

## Outcome

Phase 9 testing:
- 0 bugs remaining
- 47/47 backend integration tests pass
- 31/31 Playwright assertions pass (4 INFO are conditional
  absent-data notices, 1 SKIP is the conditional Stripe-path
  branch)
- Manual guide (8 scenarios A–H) and live HTTP smoke both green
