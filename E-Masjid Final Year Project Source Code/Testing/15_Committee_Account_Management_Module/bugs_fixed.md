# 15 Committee Account Module — bugs fixed (delivered)

All issues found during Phase 15 testing have been resolved inside the
same sprint that discovered them. The list below is the audit trail;
everything itemized here is in `main` and covered by an automated test
+ a manual scenario in `manual_testing_guide.md`.

| ID | Component | Title | Fix delivered |
|---|---|---|---|
| **B15-1** | `backend/middleware/auth.js` | `protect` did not check `isActive` | Added `if (req.user.isActive === false) return 401 "Account is deactivated..."` |
| **B15-2** | `backend/services/authService.js` | `login` issued JWT for deactivated accounts | Added `if (!user.isActive) throw httpError(403, 'Account is deactivated')` after password match |
| **B15-3** | `backend/services/fundRequestsService.js#notifyCommittee` | Deactivated members still got new-request emails | Added `isActive: true` to the committee email lookup |
| **B15-4** | `frontend/src/components/Admin/Pages/Committee.jsx` | Mosque column showed hard-coded `"Current Mosque"` | Backend already scopes by `user.mosqueId`; column renders `mosqueName` with `"Current Mosque"` fallback for seeded data (no code change beyond regression check) |
| **B15-5** | `backend/services/fundRequestsService.js#castVote` | Deactivated token could still change vote | Now handled by the B15-1 middleware fix — token rejected with 401 before controller runs |
| **B15-6** | `backend/services/fundRequestsService.js#castVote` | Re-vote after re-activation could double-count | Atomic guard already replaces the slot by `member._id` — `votes.length` stays at 1 |
| **B15-7** | `frontend/src/components/Admin/Pages/Committee.jsx#deleteMember` | Delete had no confirmation | Added `window.confirm` before calling `deleteCommitteeMember` |

See `bugs_found.md` for the full narrative of each bug and the test
that covers it.