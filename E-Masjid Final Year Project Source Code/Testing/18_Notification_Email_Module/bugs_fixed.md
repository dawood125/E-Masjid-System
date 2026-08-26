# 18 Notification Email Module — Bugs Fixed

> Phase 18 — 2026-08-25

## Summary

**0 bugs fixed in this phase.** The Notification Email module passed the full
re-verification suite on the first run — all 3 callers (`forgot-password`,
`committee notification`, `requester status update`) work correctly,
multi-tenant scope holds, inactive committee filtering holds, and
SMTP-failure graceful degradation is in place.

This file is intentionally short. The detailed pass/fail evidence lives in
`bugs_found.md` (which doubles as the re-verification record) and
`manual_testing_guide.md`.

## Re-verification results (carried over from `bugs_found.md`)

| # | Concern | Source | Result |
|---|---|---|---|
| 1 | Forgot-password email | `authService.requestPasswordReset` → `sendEmail` | ✅ 200 + token populated, expires ~24h |
| 2 | Committee notification | `fundRequestsService.notifyCommittee` (called from `create`) | ✅ sent=4 failed=0 |
| 3 | Requester status update | `fundRequestsService.notifyRequester` (called from `review`) | ✅ email attempted |
| 4 | Multi-tenant scope | `notifyCommittee` filters by `mosqueId` | ✅ |
| 5 | Inactive committee filter | `notifyCommittee` filters `isActive: true` | ✅ |
| 6 | SMTP graceful (forgot-pw) | `authService.requestPasswordReset` try/catch | ✅ |
| 7 | SMTP graceful (committee) | `notifyCommittee` uses `Promise.allSettled` | ✅ |
| 8 | SMTP graceful (requester) | `notifyRequester` try/catch | ✅ |

**18/18 live API checks PASS in 1 run.**

## Why nothing to fix

The module was previously verified during Phase 2 (forgot-password), Phase 14
(fund-requests), and Phase 15 (committee). Those tests exercised the same
code paths. The Phase 18 re-verification confirmed:

1. The SMTP config (`EMAIL_PASS=…`) is still valid → real Gmail delivery works
2. The 3 callers' code paths still execute correctly
3. Multi-tenant scoping still holds (Masjid A committee doesn't get Masjid B
   notifications)
4. Inactive committee members are still filtered out
5. SMTP failure paths are still graceful

## Files

- `backend/utils/phase18_email_reverify.js` — the probe (in-process backend on
  port 59887, captures console output to `backend/logs/phase18_probe.log`)
- `backend/logs/phase18_probe.log` — full timestamped log of every check plus
  the actual `[notifyCommittee]` lines emitted by the running service

## Conclusion

**Phase 18 Notification Email re-verification: COMPLETE. 0 bugs found.
18/18 live API checks PASS. No fixes needed.**

The intentional design choices (no silent SMTP fallback in `sendEmail`,
`Promise.allSettled` in `notifyCommittee`, forgot-password returning 200 for
unknown emails to prevent enumeration) were all re-confirmed correct.
