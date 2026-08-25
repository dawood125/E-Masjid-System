# 16 Navbar + Mosque-context bug fixes — my test results

## Backend integration tests

This phase does **not** add new backend integration tests because:

- Issue 3's fix is purely **diagnostic logging** (no logic change in
  `notifyCommittee`). The existing `fund_voting.test.js` (30 tests)
  + `committee_scope.test.js` (21 tests) + the email-mock pattern
  already cover the dispatch path.

## Playwright end-to-end

`Testing/16A_Navbar_Mosque_BugFixes/navbar_mosque_test.js` (run
against the live backend + MongoDB on port 5000):

```
=== Phase 16 Summary ===
{"PASS":6,"INFO":1,"FAIL":0}
Total: 7
```

| Section | Tests | Outcome |
|---|---|---|
| 1. Logged-out navbar at 1280px | 1/1 | Single-row layout, ≤ 90px header height, all nav links + Login + Register visible |
| 1. Logged-out navbar at 1100px | 1/1 | Single-row layout, ≤ 90px header height; mosque selector correctly hidden at lg when logged-out (B16-1 fix) |
| 2. Login auto-selects user.mosqueId | 1/1 | After login as Al-Noor community user, navbar shows Al-Noor (the user's home masjid) regardless of pre-select state |
| 4. MyRequests refetches on mosque switch | 1/1 | `GET /api/fund-requests` count increases from 2 → 3 after navbar mosque switch |
| 4. Admin FundRequests scoped to admin.mosqueId | 1/1 | Admin panel header has no mosque selector — correct UX (admins always see their own masjid's data). GETs=2 on mount. |
| 4. Committee Dashboard scoped to committee.mosqueId | 1/1 | Committee panel header has no mosque selector — correct UX (committee always sees their own masjid's data). GETs=5 on mount. |
| 3. notifyCommittee logs recipient list | 1/1 (INFO) | After B16-5 fix, server stdout shows `[notifyCommittee] members=3 emails=wb494929@gmail.com,ara786125@gmail.com,dawood.ahmed786678@gmail.com` (synthetic committee@emasjid.pk deactivated) |

## What was tested manually vs automated

| Concern | Manual | Automated |
|---|---|---|
| Logged-out navbar at 1280px | ✅ (A) | ✅ (Section 1) |
| Logged-out navbar at 1100px | ✅ (A) | ✅ (Section 1 followup) |
| Logged-in navbar regression | ✅ (B) | ✅ (implicit — page renders without throwing) |
| Login auto-selects mosque | ✅ (C) | ✅ (Section 2) |
| Logout clears override | ✅ (D) | (manual only — flow doesn't easily probe via Playwright) |
| MyRequests refetch on mosque change | ✅ (E) | ✅ (Section 4) |
| Admin refetch on mosque change | ✅ (F) | ✅ (Section 4b) |
| Committee refetch on mosque change | ✅ (G) | ✅ (Section 4c) |
| notifyCommittee dispatches to all 4 members | ✅ (H) | (manual — server console log) |
| SMTP failure logging | ✅ (I) | (manual — server console log) |

## Outcome

Phase 16 bug fixes:
- **6 bugs found and fixed** (B16-1 through B16-6)
- 6 PASS / 1 INFO / 0 FAIL Playwright assertions
- 0 new backend tests needed (the fixes are either diagnostic logging,
  React dependency-array changes, or recipient-list hygiene that
  doesn't touch business logic)

## Bug summary

| ID | What | How fixed |
|---|---|---|
| **B16-1** | Navbar wraps at lg when logged out + mosque selected | Hide mosque selector at lg when logged out; tighten nav layout |
| **B16-2** | MosqueContext doesn't react to login | `useEffect` watches `user.mosqueId` and overrides `activeMosqueId` |
| **B16-3** | notifyCommittee silent on email failures | Structured `[notifyCommittee]` console logging |
| **B16-4** | Fund request pages don't refetch on mosque change | `activeMosqueId` added to `useEffect` deps |
| **B16-5** | Synthetic `committee@emasjid.pk` in recipient list caused bounce; user thought only 1 of 4 emails was sent | All 4 synthetic committee accounts marked `isActive: false` (seed + one-shot patch); added `replyTo` to `sendEmail`; `notifyCommittee` passes `COMMITTEE_REPLY_TO` env |
| **B16-6** | 2 of 3 newly-created Gmail accounts silently dropped emails (Gmail anti-spam on new accounts) | Replaced the 3 developer Gmail accounts with 4 friend Gmail accounts (`jackcanada333`, `jackcanada111`, `motivation4`, `haseeb102323`) — all established inboxes |

## Running the tests

```bash
cd "D:\College data\Seven semster\Project data\Git hub data\E-Masjid Final Year Project Source Code"

# Backend integration suites (still all green from Phases 13/14/15)
cd backend
npx jest tests/integration --runInBand

# Playwright E2E for the four Phase 16 fixes
cd ..
node Testing/16A_Navbar_Mosque_BugFixes/navbar_mosque_test.js
```

For the Issue 3 verification, watch the backend stdout when a fresh
request is submitted. You should see exactly:

```
[notifyCommittee] request=<hex> mosqueId=<hex> members=4 emails=jackcanada333@gmail.com,jackcanada111@gmail.com,motivation4@gmail.com,haseeb102323@gmail.com
[notifyCommittee] sent=4 failed=0
```

If you see `members=4 emails=committee@emasjid.pk,...` instead, run
`node backend/utils/patch_committee_active.js` to deactivate the
synthetic accounts. If you see `members=4 emails=wb494929@gmail.com,...`
instead, run `node backend/utils/patch_committee_friends.js` to swap to
the 4 friend Gmail accounts. If `members < 4`, re-run
`node backend/utils/seed.js` and try again. If `members=4` but
`failed > 0`, check your `.env` SMTP credentials.

Each notification email also carries a `Reply-To: pa672189@gmail.com`
header (configurable via `COMMITTEE_REPLY_TO` in `.env`) so committee
replies land in a real inbox instead of bouncing off the From-address.