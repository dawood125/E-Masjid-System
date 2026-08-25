# 18 Notification Email Module — Bugs Found

> Step C — 2026-08-25

---

## Summary

**0 bugs found.** The Notification Email module passed the full re-verification suite on the first run — all 3 callers work correctly, multi-tenant scope holds, inactive committee filtering holds, and SMTP-failure graceful degradation is in place.

---

## Re-verification coverage

| # | Concern | Source | Result |
|---|---|---|---|
| 1 | Forgot-password email | `authService.requestPasswordReset` → `sendEmail` | ✅ 200 + token populated, expires ~24h |
| 2 | Committee notification | `fundRequestsService.notifyCommittee` (called from `create`) | ✅ sent=4 failed=0 (Al-Noor has 4 active committee) |
| 3 | Requester status update | `fundRequestsService.notifyRequester` (called from `review`) | ✅ email attempted, FundRequest.status='approved' |
| 4 | Multi-tenant scope | `notifyCommittee` filters by `mosqueId` | ✅ Al-Rahman committee does NOT receive Al-Noor email |
| 5 | Inactive committee filter | `notifyCommittee` filters `isActive:true` | ✅ committee@emasjid.pk (isActive:false) excluded |
| 6 | SMTP graceful (forgot-pw) | `authService.requestPasswordReset` try/catch | ✅ returns 200 even if SMTP fails |
| 7 | SMTP graceful (committee) | `notifyCommittee` uses `Promise.allSettled` | ✅ one failed SMTP does NOT block the others |
| 8 | SMTP graceful (requester) | `notifyRequester` try/catch | ✅ error logged, no throw |

**18/18 live API checks PASS in 1 run.**

---

## Pre-flight observations noted in Step A (NOT bugs — all confirmed correct)

These were points I flagged as "things to watch for" before the probe ran. They turned out to be **correct behavior**, not bugs.

| Observation | Verdict |
|---|---|
| `sendEmail` throws if SMTP not configured (no silent fallback) | ✅ Correct — production must fail loudly if misconfigured |
| `notifyCommittee` uses `Promise.allSettled` (swallows per-recipient errors) | ✅ Correct — graceful degradation so 1 bad email doesn't kill the flow |
| `authService.requestPasswordReset` swallows email errors, returns `{sent:true}` | ✅ Correct — prevents SMTP errors from leaking to user; controller still returns 200 |
| Forgot-password returns 200 even for unknown emails (no user enumeration) | ✅ Correct — prevents email-existence enumeration leak |

All 4 points are intentional design choices confirmed working.

---

## Why zero bugs

The module was previously verified during Phase 2 (forgot-password), Phase 14 (fund-requests), and Phase 15 (committee). Those tests exercised the same code paths. The re-verification in this phase confirmed:

1. The SMTP config (`EMAIL_PASS=...`) is still valid → real Gmail delivery works
2. The 3 callers' code paths still execute correctly
3. Multi-tenant scoping still holds (Masjid A committee doesn't get Masjid B notifications)
4. Inactive committee members still filtered out
5. SMTP failure paths still graceful

---

## Files

- `backend/utils/phase18_email_reverify.js` — the probe (in-process backend on port 59887, captures console output to `backend/logs/phase18_probe.log`)
- `backend/logs/phase18_probe.log` — full timestamped log of every check + the actual `[notifyCommittee]` lines emitted by the running service

---

## Conclusion

**Phase 18 Notification Email re-verification: COMPLETE. 0 bugs found. 18/18 live API checks PASS. No fixes needed.**

Moving to Phase 19 (Admin Dashboard + Monthly Report re-verification).