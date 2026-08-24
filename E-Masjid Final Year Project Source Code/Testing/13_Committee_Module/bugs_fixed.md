# 13 Committee Voting Module — bugs fixed (delivered)

All issues found during Phase 13 testing have been resolved inside the same
sprint that discovered them. The list below is the audit trail; everything
itemized here is in `main` and covered by an automated test + a manual
scenario in `manual_testing_guide.md`.

| ID | Component | Title | Fix delivered |
|---|---|---|---|
| **B13-1** | `Committee/Pages/Dashboard.jsx` | Single-reviewer pattern blocks multi-member voting | New per-member vote flow with tally + *"Your vote"* badge |
| **B13-2** | `Admin/Pages/FundRequests.jsx` | No admin finalization step | New finalize modal with auto-outcome + override for ties |
| **B13-3** | `backend/models/FundRequest.js` | No vote data model | Added `voteSchema` sub-doc, `votes[]`, `finalizedBy/At/finalNote` |
| **B13-4** | `backend/services/fundRequestsService.js` | Requester informed on every committee action | `notifyRequester` only fires after `finalize` succeeds |
| **B13-5** | `backend/services/fundRequestsService.js#create` | Community can pick any `mosqueId` | Always force `user.mosqueId`; mismatched body returns `400` |
| **B13-6** | `Testing/.../committee_voting_test.js` | Card scope leaks double-click wrong card | Heading → ancestor card via `xpath=ancestor::div[contains(@class, "rounded-2xl")][1]` |
| **B13-7** | `backend/services/fundRequestsService.js#finalize` | Race lets two admins both finalize | `findOneAndUpdate({ _id, status: 'pending' }, ...)` atomic guard |
| **B13-8** | `backend/services/fundRequestsService.js#castVote` | Same-race for votes | Atomic guard + one entry per member (re-vote replaces) |
| **B13-9** | `backend/routes/fundRequests.js` | Legacy `PUT /:id` orphaned after vote migration | Kept route for backward compat but no UI calls it; status flip now requires `finalize` |
| **B13-10** | `User/Pages/MyRequests.jsx` | Final-decision card used legacy fields | Replaced with `finalNote` + `finalizedBy` + green visit-office hint |
| **B13-11** | `Admin/Pages/FundRequests.jsx` | Admin table had no tally column | Added `Votes` column with `✓`/`✗` counts and `TIED` pill |

See `bugs_found.md` for the full narrative of each bug and the test that
covers it.
