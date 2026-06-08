# Phase 0 — Client Answers (Recorded)

**Date:** 2026-06-05

| # | Question | Client Answer |
|---|----------|---------------|
| Q1 | Testing environment | **Local only** for now (`localhost`). May deploy to server later. |
| Q2 | Database | **Seed data** via `utils/seed.js`. Re-run seed when needed. |
| Q3 | Stripe configured? | **Yes** — keys in `backend/.env` (do not share publicly). |
| Q4 | Roles to test | **All 5 roles** fully and in detail (Manager, Admin, Scholar, Committee, User). |
| Q5 | Viva priority | **Every feature** must work — all are priority. |
| Q6 | Password rules | **Professional standard** — min 8 characters. |
| Q7 | Login errors | Keep **"Invalid credentials"** (secure, don't reveal email exists). |
| Q8 | Session timeout | **8 hours** for testing (extend from 1 hour). |
| Q9 | Donation currency | **PKR only** (Pakistani mosques). |
| Q10 | Anonymous donations | Admin **can see real name** for audit; hidden from public. |

### Stripe Issue Reported (for Phase 14)
Partner completed Stripe test checkout successfully, but payment amount not visible in Stripe sandbox dashboard. To investigate in Phase 14 (likely: Test mode toggle, Payments vs Balance tab, or webhook-only DB save).
