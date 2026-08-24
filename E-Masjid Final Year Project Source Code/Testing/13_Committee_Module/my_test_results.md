# 13 Committee Voting Module — my test results

## Backend integration tests

`backend/tests/integration/fund_voting.test.js` covers the
vote + finalize API end-to-end against an in-memory MongoDB:

```
PASS backend/tests/integration/fund_voting.test.js
  Fund voting + finalize (Phase 13)
    Public access
      ✓ GET /api/fund-requests without token returns 401
      ✓ POST /api/fund-requests without token returns 401
      ✓ POST /:id/vote without token returns 401
      ✓ POST /:id/finalize without token returns 401
    Community submit + list
      ✓ community can submit a request for own masjid
      ✓ community cannot submit for another mosque (400)
      ✓ reason must be at least 30 chars (400)
      ✓ amount must be a positive number (400)
      ✓ category must be from the allowed enum (400)
      ✓ committee cannot submit a request (403)
      ✓ community list returns only own requests
      ✓ admin list is mosque-scoped (A admin sees only mosque A)
    Committee voting
      ✓ committee can cast an approve vote (200, recorded)
      ✓ committee can change their vote (re-vote replaces)
      ✓ vote persists one entry per committee member
      ✓ cannot vote on already-finalized request (409)
      ✓ vote requires a valid enum value (400)
      ✓ admin cannot vote (committee-only, 403)
      ✓ community cannot vote (403)
      ✓ committee from another mosque cannot vote (403)
    Admin finalize
      ✓ majority approve → status approved (200)
      ✓ majority reject → status rejected (200)
      ✓ tied votes require overrideStatus (otherwise 409)
      ✓ cannot finalize with zero votes (400)
      ✓ cannot finalize twice (409 on the second attempt)
      ✓ community cannot finalize (403)
      ✓ committee cannot finalize (admin-only, 403)
      ✓ admin of another mosque cannot finalize (403)
    Voting then deactivation
      ✓ committee deactivated mid-flow cannot change vote (401)
    Race conditions (concurrent finalize)
      ✓ two simultaneous finalize attempts — only one wins

Tests: 30 passed, 30 total
```

Combined with the other four integration suites (auth + masjids,
donations + expenses, scholars + scholars, nikah bookings), the
backend suite totals **139 backend tests** across 5 files — same run
recorded **139/139 green**.

## Playwright end-to-end

`Testing/13_Committee_Voting_Module/committee_voting_test.js`
(run against the live backend + MongoDB on port 5000):

```
=== Phase 13 Committee Voting Module Test Summary ===
{"INFO":1,"PASS":19}
Total: 20
```

| Section | Tests | Outcome |
|---|---|---|
| 0. Setup | 1/1 (INFO) | Al-Noor has 4 committee members ready (1 synthetic + 3 real Gmail accounts) |
| 1. Community submit | 2/2 | POST `/api/fund-requests` returns 201; MyRequests shows the new card (by reason fragment) |
| 2. Committee A1 votes approve | 3/3 | UI vote panel opens, tally flips to 1 approve, *"Your vote APPROVE"* badge visible |
| 3. Committee A2 votes reject | 2/2 | API `POST /:id/vote` returns 200 with `votes.length=2`; UI tally reads `1 approve · 1 reject` |
| 4. Committee A3 votes approve | 2/2 | API `POST /:id/vote` returns 200 with `votes.length=3`; UI tally reads `2 approve` |
| 5. Admin opens Finalize | 4/4 | Row shows `2✓ · 1✗`, Finalize button visible, modal opens, row flips to Approved after submit |
| 6. Already-decided | 1/1 | No Finalize button on the now-Approved row |
| 7. Requester feedback | 1/1 | MyRequests shows "Final Decision", "Approved by majority committee vote" note, and the "visit the mosque office" hint |
| 8. Cross-mosque isolation | 1/1 | Al-Rahman admin's `/api/fund-requests` returns zero Al-Noor records |
| 9. Tied override | 2/2 | Finalize without `overrideStatus` returns 409 "tied"; with `overrideStatus: 'approved'` finalizes to Approved |
| 10. Late vote | 1/1 | Voting on finalized request returns 409 |

## Live HTTP smoke (verified via Playwright API + raw `curl`)

- `POST /api/auth/login` (community) → 200, JWT.
- `POST /api/fund-requests` (community) → 201, `status: 'pending'`,
  `votes: []`, `mosqueId` from JWT.
- `POST /api/fund-requests` with cross-mosque `mosqueId` body → 400,
  *"Cannot create a request for another mosque"*.
- `POST /api/fund-requests/:id/vote` (committee) → 200,
  `votes[]` now contains one entry with `member`, `vote`, `note`,
  `votedAt`. Second call from same committee → `votes[]` still length 1
  (replaced).
- `POST /api/fund-requests/:id/vote` from non-committee → 403.
- `POST /api/fund-requests/:id/vote` after finalize → 409 *"Request is
  already approved; cannot vote"*.
- `POST /api/fund-requests/:id/finalize` (admin) with majority approve →
  200, `status: 'approved'`, `finalizedBy`, `finalizedAt`,
  `finalNote`. `notifyRequester` is called (verified in test teardown).
- `POST /api/fund-requests/:id/finalize` tied → 409 *"Votes are tied;
  admin must provide overrideStatus"*. With `overrideStatus` →
  200.
- `POST /api/fund-requests/:id/finalize` (non-admin) → 403.
- `POST /api/fund-requests/:id/finalize` (admin of another masjid) → 403.
- `GET /api/fund-requests` for Al-Rahman admin → 200, no Al-Noor rows.

## What was tested manually vs automated

| Concern | Manual | Automated |
|---|---|---|
| Community submits | ✅ (A) | ✅ (Section 1) |
| Community sees own pending | ✅ (B) | ✅ (Section 1) |
| Committee A1 approves via UI | ✅ (C) | ✅ (Section 2) |
| Committee A2 rejects via API | ✅ (D) | ✅ (Section 3) |
| Multiple real-Gmail committee members | ✅ (E) | ✅ (Section 3 + 4) |
| Admin sees tally | ✅ (F) | ✅ (Section 5) |
| Admin finalizes majority | ✅ (G) | ✅ (Section 5) |
| Tied override | ✅ (H) | ✅ (Section 9) |
| Cannot vote on finalized | ✅ (I) | ✅ (Section 10) |
| Real Gmail actually receives email | ✅ (J) | (manual only — Playwright mints the call but doesn't open Gmail) |
| Cross-mosque isolation | ✅ (K) | ✅ (Section 8 + backend) |
| Deactivated mid-flow | ✅ (L) | ✅ (backend suite) |
| Concurrent finalize race | ✅ (M) | ✅ (backend suite) |

## Outcome

Phase 13 testing:
- **11 bugs found and fixed** (B13-1 through B13-11)
- 19 PASS / 0 FAIL / 1 INFO Playwright assertions pass (verified across
  multiple Playwright runs against the live backend on port 5000; one
  Section 5 finalize-modal flow initially double-counted rows because
  the Admin table doesn't reload after a finalize click — fixed by
  adding a `waitForSelector(state: 'detached')` on the modal heading
  + an explicit `page.reload()` before re-reading the row)
- 30/30 backend integration tests pass in `fund_voting.test.js`
- 139/139 tests pass across all 5 backend suites
- Manual guide covers 13 scenarios A–M (including the real-Gmail
  email-receipt check the auto suite cannot introspect)

## Bug summary

| ID | What | How fixed |
|---|---|---|
| **B13-1** | `Committee/Pages/Dashboard.jsx` used a single-reviewer Approve/Reject that locked the decision for the whole masjid | Per-member `voteFundRequest` flow + tally + *"Your vote"* badge |
| **B13-2** | `Admin/Pages/FundRequests.jsx` had no admin finalize step | Added modal with auto outcome + tied override picker |
| **B13-3** | No vote data on the FundRequest model | Added `voteSchema` and `votes[]` + finalize fields |
| **B13-4** | `notifyRequester` fired after every action | Now fires **only after `finalize`** |
| **B13-5** | `create()` accepted any `mosqueId` from the body | Forced to `user.mosqueId`; mismatch → 400 |
| **B13-6** | Playwright card-scope leaked across `<div>`s and clicked the wrong Cast-vote button | Scope via `getByRole('heading')` + `ancestor::div[contains(@class, "rounded-2xl")]` |
| **B13-7** | `finalize()` had a TOCTOU race (findById + findByIdAndUpdate) | `findOneAndUpdate({ _id, status: 'pending' })` atomic guard |
| **B13-8** | `castVote()` had a similar race for re-votes | Atomic guard + one entry per member |
| **B13-9** | Legacy `PUT /:id` route orphaned after migration | Kept for compat, no UI calls it; status flip now requires `finalize` |
| **B13-10** | `MyRequests.jsx` showed legacy `reviewedBy.name` / `reviewNote` after finalize | Replaced with `finalNote` + `finalizedBy` + `finalizedAt` + visit-office hint |
| **B13-11** | `Admin/Pages/FundRequests.jsx` table had no tally column | Added Votes column with `✓`/`✗` counts and `TIED` pill |

## Deferred work

(none — all Phase 13 work is complete)

## Running the tests

```bash
cd "D:\College data\Seven semster\Project data\Git hub data\E-Masjid Final Year Project Source Code"

# Backend integration suite (fund + 4 other suites)
cd backend
npx jest tests/integration/fund_voting.test.js --runInBand

# Or all-in-one
npx jest tests/integration --runInBand

# Playwright E2E (assumes backend + MongoDB + frontend are running)
cd ..
node Testing/13_Committee_Voting_Module/committee_voting_test.js
```

For the live Playwright run the seed should already be loaded (the test
itself calls `node utils/seed.js` first if the DB is empty) so the
developer can open the admin / committee / community pages and watch
the fund request flow in real time.
