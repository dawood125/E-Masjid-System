# 02 Forgot Password Module — Questions Asked

**Date:** 2026-06-23
**Phase:** 2

---

## Client Decisions Already Made (from prior phases)

- Environment: **local** with seed data
- Database: **MongoDB Atlas** (no separate test DB)
- Roles: all 5 roles fully tested
- Password rule: **min 8 chars + 1 letter + 1 number**
- Error message style: keep "Invalid credentials" (neutral)
- Session: **8 hours** for testing
- Currency: **PKR only**
- Anonymous donations: admin sees real name

## Questions for This Phase

### Q1. Email service for testing
**What email backend should I assume is active during this phase?**
- (A) **Mailtrap** (sandbox — emails captured, not actually sent). I see `EMAIL_*` env vars in `.env` (Mailtrap creds)
- (B) **Gmail SMTP** via `MAIL_*` env vars (sends real email to dawood.bhatti8812@gmail.com)
- (C) Both (try Mailtrap first, fall back to Gmail if Mailtrap is down)
- (D) Skip real sending — just verify the API response is correct, don't verify email arrives

### Q2. Reset password 24-hour expiry — match the docs, or change?
The FYP doc says **24 hours**. Backend code uses 24 hours. But the **email body says 30 minutes** (typo). Should I:
- (A) Fix the typo in the email body to say 24 hours (keep 24h expiry as in docs)
- (B) Change expiry to 30 minutes (match the email body, but contradicts docs)
- (C) Keep 24 hours in code, leave email body as-is (not recommended, contradicts UI)

### Q3. Reset link domain for production-like testing
- (A) Use `CLIENT_URL` from .env (`http://localhost:5173`) — fine for local test
- (B) Override with a more realistic URL (e.g., a placeholder like `https://emasjid.pk`) for the test
- (C) Just verify the path part (`/reset-password/<token>`) is correct, ignore the domain

### Q4. Rate limiting on /forgot-password endpoint
We removed rate limiting in Phase 1 (FYP requirement for ease of testing). Should I:
- (A) Keep it removed (FYP testing priority)
- (B) Re-add a soft rate limit (e.g., 5 requests/min per email) for security hygiene
- (C) Add it but make it generous (e.g., 30 requests/min)

### Q5. Verify email arrival manually OR just API response?
- (A) Manual partner test: open Mailtrap inbox (or Gmail), confirm email arrives with the reset link
- (B) Automated check only: verify API responds 200 with correct shape, don't verify email arrives
- (C) Both (recommended)

---

## Client Answers (to be filled in by Dawood)

1.
2.
3.
4.
5.
