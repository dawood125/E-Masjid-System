# 14 User Fund Request Module — my test results

## Backend integration tests

The community-submit half of the fund request flow is already covered
by the Phase 13 backend suite (`backend/tests/integration/fund_voting.test.js`)
which is 30/30 green. Specifically the "Community submit + list" group:

```
Community submit + list
  ✓ community can submit a request for own masjid
  ✓ community cannot submit for another mosque (400)
  ✓ reason must be at least 30 chars (400)
  ✓ amount must be a positive number (400)
  ✓ category must be from the allowed enum (400)
  ✓ committee cannot submit a request (403)
  ✓ community list returns only own requests
  ✓ admin list is mosque-scoped (A admin sees only mosque A)
```

Combined with the other four integration suites (auth + masjids,
donations + expenses, scholars + scholars, nikah bookings), the
backend suite totals **139 backend tests** across 5 files — same run
recorded **139/139 green**.

The Phase 14 UI changes do not require new backend tests because:

1. The form validation rules (30-char reason, positive amount, category
   enum, terms checkbox, name required) are enforced by the schema
   validator in `fundRequestsService.js#create` which already returns
   the matching 400 errors covered above.
2. The "no votes yet" → "committee is reviewing" → "final decision"
   progression is driven entirely by the data returned from the same
   `GET /api/fund-requests` endpoint covered by the community-list
   test above.

## Playwright end-to-end

`Testing/14_User_FundRequest_Module/user_fundrequest_test.js`
(run against the live backend + MongoDB on port 5000):

```
=== Phase 14 User Fund Request Module Test Summary ===
{"INFO":1,"PASS":21}
Total: 22
```

| Section | Tests | Outcome |
|---|---|---|
| 0. Setup | 1/1 (INFO) | Community starts with N own request(s) (legacy approved + any pending) |
| 1. Too-short reason | 1/1 | Inline red error *"Reason must be at least 30 characters."* |
| 2. Zero amount | 1/1 | Inline red error *"Valid amount is required."* |
| 3. Terms unchecked | 1/1 | Inline red error *"You must agree to the terms before submitting."* |
| 4. Successful submit | 1/1 | Success page with reference ID, `/fund-request` redirects to confirmation view |
| 5. Pending card | 2/2 | New pending card visible by reason fragment; amber *"Committee has not started voting yet"* banner visible |
| 6. Live tally | 1/1 | After 2 votes, the *"Committee is reviewing"* tally card replaces the amber banner |
| 7. Legacy fallback | 1/1 | Seeded `reviewedBy` / `reviewNote` request renders the Final Decision card with the legacy values |
| 8. Cross-user scoping | 1/1 | `user2@emasjid.pk`'s list does not leak any `user@emasjid.pk` email |
| 9. Empty-name validator | 1/1 | Inline red error *"Full name is required."* fires before native browser popup |
| 10. Admin finalize feedback | 2/2 | Admin can finalize with `overrideStatus: 'rejected'`; requester's `MyRequests` shows the final note on a red Final Decision card |

## Live HTTP smoke (verified via Playwright API + raw `curl`)

- `POST /api/fund-requests` (community) → 201, `status: 'pending'`,
  `votes: []`, `mosqueId` from JWT.
- `POST /api/fund-requests` with reason < 30 chars → 400 *"Reason must
  be at least 30 characters."*
- `POST /api/fund-requests` with amount=0 → 400 *"Amount must be a
  positive number."*
- `POST /api/fund-requests` with `category: 'NotARealCategory'` → 400
  *"Category must be one of Medical / Education / Food / Shelter /
  Utilities / Other."*
- `POST /api/fund-requests` for another mosque → 400 *"Cannot create a
  request for another mosque."*
- `GET /api/fund-requests` for community → 200, list filtered to self
  only.
- `POST /api/fund-requests/:id/vote` (committee) → 200, `votes[]` now
  contains one entry with `member`, `vote`, `note`, `votedAt`.
- `POST /api/fund-requests/:id/finalize` (admin) tied with
  `overrideStatus: 'rejected'` → 200, `status: 'rejected'`,
  `finalizedBy`, `finalizedAt`, `finalNote`.

## What was tested manually vs automated

| Concern | Manual | Automated |
|---|---|---|
| Empty-state UI | ✅ (A) | ✅ (Playwright sees it when user2 has 0 requests) |
| Form rejects short reason | ✅ (B) | ✅ (Section 1) |
| Form rejects zero amount | ✅ (C) | ✅ (Section 2) |
| Form rejects unchecked terms | ✅ (D) | ✅ (Section 3) |
| Form rejects empty name | ✅ (E) | ✅ (Section 9) |
| Submit success page | ✅ (F) | ✅ (Section 4) |
| Pending card + amber banner | ✅ (G) | ✅ (Section 5) |
| Cross-user scoping | ✅ (H) | ✅ (Section 8) |
| Live tally appears after vote | ✅ (I) | ✅ (Section 6) |
| Tally persists as votes come in | ✅ (J) | ✅ (Section 6 — 2 votes accumulated) |
| Final Decision after approve | ✅ (K) | ✅ (Phase 13 Section 7) |
| Legacy fallback | ✅ (L) | ✅ (Section 7) |
| Final Decision after reject via override | ✅ (M) | ✅ (Section 10) |
| Real Gmail receives email after finalize | ✅ (manual) | (manual only — Phase 13 Section 7 manual scenario J) |

## Outcome

Phase 14 testing:
- **6 bugs found and fixed** (B14-1 through B14-6)
- 21 PASS / 0 FAIL / 1 INFO Playwright assertions pass
- 30/30 Phase 13 backend integration tests pass (community + voting +
  finalize + races + deactivation)
- 139/139 tests pass across all 5 backend suites
- Manual guide covers 13 scenarios A–M (including the legacy-fallback
  regression check the auto suite catches via Section 7)

## Bug summary

| ID | What | How fixed |
|---|---|---|
| **B14-1** | `MyRequests` Final Decision card used `finalizedBy?.name` only, breaking the legacy seed | Fallback to `reviewedBy?.name` / `reviewNote` / `updatedAt` |
| **B14-2** | Amber "no votes yet" banner leaked onto non-pending requests | Banner gated on `!decided && t.total === 0` |
| **B14-3** | Empty-name validation used browser native popup | Inline red `formError.name` matches the rest of the form |
| **B14-4** | Office-visit hint shown on rejected cards | Hint gated on `req.status === 'approved'` |
| **B14-5** | Empty-state CTA link regression check | Verified `ROUTES.FUND_REQUEST === '/fund-request'` |
| **B14-6** | `tally()` helper could TypeError on `votes = undefined` | Helper uses `req.votes || []` |

## Running the tests

```bash
cd "D:\College data\Seven semster\Project data\Git hub data\E-Masjid Final Year Project Source Code"

# Backend integration suite (Phase 13 + Phase 14 = 30 community + voting + finalize tests)
cd backend
npx jest tests/integration/fund_voting.test.js --runInBand

# Or all-in-one
npx jest tests/integration --runInBand

# Playwright E2E (assumes backend + MongoDB + frontend are running)
cd ..
node Testing/14_User_FundRequest_Module/user_fundrequest_test.js
```

For the live Playwright run the seed should already be loaded so the
developer can open the community page at `/fund-request`, submit a
request, then switch to the committee dashboard, vote, switch to admin,
finalize, then back to the community page at `/my-requests` and watch
the full flow in real time.