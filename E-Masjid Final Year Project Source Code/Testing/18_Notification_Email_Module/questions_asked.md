# 18 Notification Email Module — Questions Asked

> **Status:** Step A — answers received 2026-08-25. Proceeding to Step B.
> **Context:** Partner already tested email flows during forgot-password (Phase 2), committee (Phase 15), and fund-requests (Phase 14) testing. This phase is a **focused re-verification rollup**, not a from-scratch test.
> **Date:** 2026-08-25

---

## Partner Answers

| # | Question | Partner Answer |
|---|---|---|
| Q1 | Verify depth | **(C) Console log + 1 real email per flow** — trigger each of the 3 callers, observe the log line, then open the recipient Gmail to confirm arrival (~3 real emails) |
| Q2 | Caller coverage | **(C) All 3** — forgot-password + committee notification + requester status update (full email module) |
| Q3 | Edge cases | **(D) Happy + scope + inactive committee + SMTP failure** — multi-tenant scope (A committee doesn't get B notifications), inactive committee filter (isActive:false), SMTP creds-temporarily-wrong graceful degradation |
| Q4 | Gmail setup | **(A) Use existing 4-committee inbox setup** — already proven working with friend Gmails |

---

## Scope summary (so we're aligned before I ask)

**The Email module = 1 utility + 3 callers:**

1. **Utility** — `backend/utils/sendEmail.js` — wraps nodemailer, reads SMTP config from env, sends via Gmail SMTP (`dawood.bhatti8812@gmail.com`), supports `replyTo`, returns `{provider, messageId, statusCode}`. Throws on missing config.
2. **Forgot-password email** — `backend/services/authService.js#requestPasswordReset` — sends a password reset link to the user's email. Used by Phase 2.
3. **Committee notification** — `backend/services/fundRequestsService.js#notifyCommittee` — sends to ALL active committee members of the same masjid when a new fund request is submitted. Logs `[notifyCommittee] sent=N failed=N`. Used by Phase 14.
4. **Requester status update** — `backend/services/fundRequestsService.js#notifyRequester` — sends status update (approved/rejected) to the requester's email when a fund request is reviewed. Used by Phase 14.

**Re-verification focus:** SMTP config validity + all 3 callers end-to-end (real Gmail delivery) + multi-tenant scope (committee of Masjid A doesn't get Masjid B's notifications) + inactive committee filtering + SMTP-failure graceful degradation.

---

## Questions

### Q1 — Real email delivery vs console-log verification

How should I verify the 3 email callers actually work?

- **(A)** **Real Gmail delivery** — trigger each flow, open the recipient Gmail inbox (real emails arrive in seconds). **Recommended per your standing rule "please use the real gmail account of mine so we can see email is sending and we can test properly".**
- **(B)** Console-log verification only — check `[notifyCommittee] sent=N failed=0` log lines + unit-test the sendEmail utility. Don't send real emails.
- **(C)** Both — console-log first (fast smoke test), then 1 real email per flow (3 emails total).

### Q2 — Coverage: which email callers to test

- **(A)** Forgot-password only (1 flow). Quickest.
- **(B)** Forgot-password + committee notification (2 flows). Covers user-driven + system-driven.
- **(C)** All 3: forgot-password + committee notification + requester status update. **Recommended — full coverage of the email module.**

### Q3 — Edge cases to include in the probe

Which edge cases should the probe cover (in addition to happy path)?

- **(A)** Happy path only for each flow.
- **(B)** Happy path + multi-tenant scope (Masjid A committee doesn't get Masjid B notifications). **Recommended — FYP-defense critical.**
- **(C)** Happy + scope + inactive committee filter (committee with `isActive: false` doesn't get emails).
- **(D)** Happy + scope + inactive committee + SMTP failure (what happens if creds are temporarily wrong, e.g. backend still works without breaking).

### Q4 — Gmail inbox setup

The system has 4 friend Gmail inboxes set up for Al-Noor committee testing (per memory `e-masjid-gmail-committee-setup.md`). For Phase 18:

- **(A)** Use the existing 4-committee inbox setup — submit fund requests, verify emails land in the right inboxes. **Recommended — already proven working.**
- **(B)** Use a single Gmail for all flows (simpler, less time on inbox-switching).
- **(C)** Skip real email; just verify the SMTP wrapper works in isolation.

---

## My recommendations (short)

| Q | Recommended |
|---|---|
| Q1 | (C) Both — console-log smoke + 1 real email per flow |
| Q2 | (C) All 3 callers |
| Q3 | (D) Happy + scope + inactive committee + SMTP failure |
| Q4 | (A) Use existing 4-committee inbox setup |

---

## Pre-flight notes (no questions, just FYI before I run Step B)

I already read `sendEmail.js` and found 2 things to watch for in Step B:

- **`sendEmail` throws if SMTP is not configured** (no silent fallback). If `EMAIL_HOST/USER/PASS` is missing, the request fails with 500. This is correct for production but means we MUST verify env is set before testing — otherwise every email flow returns 500.
- **`notifyCommittee` swallows all errors** (`console.error` + no rethrow). If one committee email fails, the others still send. This is intentional (graceful degradation) but means a single failure is silent from the API caller's perspective.
- **`authService.requestPasswordReset`** — let me re-read it to confirm whether failures throw or are swallowed (this determines if a user with an invalid email sees a 500 or a 200).

Waiting for partner answers on Q1–Q4 before proceeding to Step B.