# 14 User Fund Request Module — bugs found

| ID | What | How fixed |
|---|---|---|
| **B14-1** | `User/Pages/MyRequests.jsx` only read `finalizedBy?.name` / `finalNote` / `finalizedAt` for the Final Decision card, so the legacy approved request (created by the seed with `reviewedBy` / `reviewNote` only) rendered as an empty decision card after the Phase 13 migration | Added fallback to `reviewedBy?.name` / `reviewNote` / `updatedAt` so legacy data still renders the same Final Decision view. Covered by Section 7 of the Playwright test and Scenario L of the manual guide. |
| **B14-2** | The "amber no votes yet" banner was shown on already-decided requests when the request had `votes.length === 0` but `status !== 'pending'` (a finalised request with no recorded votes — possible after the seed) | The condition is now `!decided && t.total === 0` where `decided = req.status !== 'pending'`. The banner only appears on actually-pending requests with zero votes. |
| **B14-3** | `User/Pages/FundRequest.jsx` form did not show an inline error for empty *Full Name* — the browser's native required popup would fire, but it was inconsistent with the inline red-error styling used by the rest of the form | Added explicit `formError` state for `name` and renders the same red inline error pattern. Covered by Section 9 of the Playwright test. |
| **B14-4** | `User/Pages/MyRequests.jsx` always rendered the green "visit the mosque office" hint for every Final Decision card, including for rejected ones | The office-visit hint is now gated on `req.status === 'approved'` — rejected cards no longer show it. |
| **B14-5** | Empty-state copy said "You haven't submitted any fund requests" but the button said "Submit a Request" and linked to the form — minor but the link target was `ROUTES.FUND_REQUEST` which had been renamed in an earlier refactor | Re-checked that `ROUTES.FUND_REQUEST` resolves to `/fund-request` and the link works in the live build. No change needed beyond the regression check. |
| **B14-6** | Phase 13 left a bug where `vote.tally` could throw on `votes = undefined` from very old seed data; the `MyRequests` tally helper was added in Phase 14 but could `TypeError` if a document pre-dated the `votes[]` migration | The `tally()` helper is now `const t = tally(req)` with a safe default `votes = req.votes || []`. The map then iterates over `[]` and returns `{ approve: 0, reject: 0, total: 0 }`. |

## Verification

Each fix is covered by:
- A Playwright E2E assertion in
  `Testing/14_User_FundRequest_Module/user_fundrequest_test.js`
  (10 sections covering form validation → submit → pending card → live
  tally → admin finalize → requester feedback → cross-user scoping).
- A manual scenario in
  `Testing/14_User_FundRequest_Module/manual_testing_guide.md`
  (scenarios A–M).
- A regression pass against the legacy seed data (Scenario L).