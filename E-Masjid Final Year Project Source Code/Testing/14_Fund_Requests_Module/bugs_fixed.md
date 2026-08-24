# 14 User Fund Request Module — bugs fixed (delivered)

All issues found during Phase 14 testing have been resolved inside the
same sprint that discovered them. The list below is the audit trail;
everything itemized here is in `main` and covered by an automated test
+ a manual scenario in `manual_testing_guide.md`.

| ID | Component | Title | Fix delivered |
|---|---|---|---|
| **B14-1** | `User/Pages/MyRequests.jsx` | Legacy `reviewedBy` / `reviewNote` orphaned after Phase 13 migration | Added `reviewedBy?.name` / `reviewNote` / `updatedAt` fallback for the Final Decision card |
| **B14-2** | `User/Pages/MyRequests.jsx` | Amber "no votes yet" banner leaked onto non-pending requests | Banner now gated on `!decided && t.total === 0` |
| **B14-3** | `User/Pages/FundRequest.jsx` | Empty-name error was the browser native popup, not the inline red error | Added explicit `formError.name` and renders the same red inline error pattern as the rest of the form |
| **B14-4** | `User/Pages/MyRequests.jsx` | Office-visit hint shown on rejected cards | Hint now gated on `req.status === 'approved'` |
| **B14-5** | `User/Pages/MyRequests.jsx` | Empty-state CTA link target regression | Verified `ROUTES.FUND_REQUEST === '/fund-request'` after the earlier route rename; no code change beyond the regression check |
| **B14-6** | `User/Pages/MyRequests.jsx` | `tally()` helper would TypeError on `votes = undefined` | Helper now uses `req.votes || []` so pre-migration documents still render |

See `bugs_found.md` for the full narrative of each bug and the test
that covers it.