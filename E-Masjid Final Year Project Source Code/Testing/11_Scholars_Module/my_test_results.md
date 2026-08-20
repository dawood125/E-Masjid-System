# Phase 11 — Scholars Module: my test results

## Backend integration tests

No new backend integration tests added this phase. The
existing `backend/tests/integration/api.test.js` suite
covers nikah flows (which scholar accepts) but doesn't
specifically exercise the scholars CRUD endpoints. To
match the Phase 11 scope, a new
`backend/tests/integration/scholars_scope.test.js`
should be added later (see "Deferred work" below).

## Playwright end-to-end

`Testing/11_Scholars_Module/scholars_test.js`:

```
=== Phase 11 Scholars Module Test Summary ===
{"PASS":23,"SKIP":1}
Total: 24
```

| Section | Tests | Outcome |
|---|---|---|
| 1. Admin /admin/scholars page | 9/9 | login persists token, dashboard renders, sidebar nav reaches scholars, heading + 3 stat cards + grid + add button + pending section all visible |
| 2. Backend scope | 5/5 | admin JWT works, GET/POST/PUT scholars all 200/201, tempPassword returned (after CORS fix + restart), unauth → 401 |
| 3. Scholar dashboard | 4/4 | scholar login works, GET nikah-bookings scoped to Al-Noor, accept marks accepted + assigns scholarId, accepted list reflects update |
| 4. Cross-mosque isolation | 0/0 + 1 SKIP | Al-Rahman masjid not in this worktree's seed — section skipped gracefully |
| 5. Authorization | 1/1 | community role POST /api/scholars → 403 |
| 6. Admin Add Scholar modal | 4/4 | button reachable, modal opens, all 4 form fields present, Cancel closes |

## Live HTTP smoke (verified via Playwright API + curl)

- `POST /api/auth/login` (admin) → 200, JWT length 191.
- `GET /api/mosques/public` → 200, returns 4 masjids
  (Al-Noor, Al-Rahman, Al-Falah, Al-Taqwa) — but only
  Al-Noor is populated by this worktree's seeder.
- `GET /api/scholars` (admin) → 200, returns array
  (initially 1 seeded scholar `Sheikh Muhammad Hassan`).
- `POST /api/scholars` (admin) → 201, returns
  `{success, data, tempPassword, message}` after B1 fix +
  backend restart. Before the fix, `tempPassword` was
  missing from the response (B2 deferred).
- `PUT /api/scholars/:id` (admin) → 200, flips `isActive`.
- `GET /api/scholars` (no auth) → 401.
- `POST /api/auth/login` (scholar) → 200, JWT.
- `GET /api/nikah-bookings` (scholar at Al-Noor) → 200,
  2 bookings scoped to Al-Noor (1 pending + 1 accepted).
- `PUT /api/nikah-bookings/:id` (scholar accept with
  future `confirmedDate`) → 200, status flips to
  accepted, scholarId assigned.
- `POST /api/scholars` (community role) → 403.

## What was tested manually vs automated

| Concern | Manual | Automated |
|---|---|---|
| Admin scholars page renders | ✅ (scenario A) | ✅ (Section 1) |
| Add scholar flow | ✅ (scenario B) | partial — Section 6 only checks modal opens + form fields; the actual create-Scholar call is in Section 2 via API |
| Add validation | ✅ (scenario C) | not covered (manual only) |
| Reset password (mock) | ✅ (scenario D) | not covered (out of scope — mock-only) |
| Edit scholar (mock) | ✅ (scenario E) | not covered (out of scope — mock-only) |
| Deactivate | ✅ (scenario F) | covered indirectly by Section 2 PUT (toggles isActive) |
| Assign scholar (mock) | ✅ (scenario G) | not covered (out of scope — mock-only) |
| Scholar dashboard render | ✅ (scenario H) | not covered — would need a separate E2E login as scholar |
| Scholar accept | ✅ (scenario I) | ✅ (Section 3) |
| Scholar reject | ✅ (scenario J) | not covered (Section 3 only tests accept) |
| Scope (own masjid only) | ✅ (scenario K) | ✅ (Section 3 partial — sees 2 bookings; Section 4 SKIPPED) |
| Authorization (community → 403) | ✅ (scenario L) | ✅ (Section 5) |

## Outcome

Phase 11 testing:
- 1 bug found and fixed (B1 — CORS port mismatch)
- 3 bugs deferred (B2 backend divergence, B3 frontend
  guard divergence, B4 seeder cross-masque gap)
- 23/23 Playwright assertions pass (1 SKIP for the
  Al-Rahman cross-mosque section)
- Manual guide (12 scenarios A–L) covers the rest

## Deferred work for the next pass

- **Backend scholars integration tests** — add
  `backend/tests/integration/scholars_scope.test.js` to
  cover:
  - admin CRUD on scholars
  - non-admin → 403
  - deactivation blocks login (403 from `auth.js`)
  - cross-mosque: admin from masjid A cannot
    list/update scholars in masjid B (this currently
    works because the route doesn't filter by `mosqueId`,
    but it's worth pinning with a test)
- **Scholar dashboard E2E** — extend
  `scholars_test.js` Section 3 to actually log in via the
  UI as a scholar (instead of using the API token
  directly) and verify the dashboard renders, the accept
  button works through the React event flow, and the
  "My Confirmed" section updates without a full page
  reload.
- **Temp password in response** (B2) — once the
  controller/service refactor is reconciled, confirm the
  response always includes `tempPassword` so the admin
  can share it with the new scholar.
- **AdminLayout guard** (B3) — fix the redirect target
  to `ROUTES.ADMIN_LOGIN` and add a `loading` wait so a
  hard reload of a protected page works as long as the
  token in localStorage is valid.
- **Seeder multi-masjid** (B4) — add a second masjid +
  admin + scholar + booking to the seed so Section 4
  actually runs (instead of SKIP).
- **Scholar dashboard greeting** — currently hardcoded
  "Maulana Abdullah!". Should pull from `useAuth().user.name`
  (the actual logged-in scholar). Cosmetic polish.
