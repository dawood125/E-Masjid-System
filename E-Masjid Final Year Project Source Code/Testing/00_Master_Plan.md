# E-Masjid — Master Testing Plan

> **Status:** APPROVED — Phase 0 complete. Phase 1 (Auth) fixes applied. Awaiting manual auth test results.

---

## Documentation Reference

- Primary doc: `FinalYearDcomumentation.md` (project root)
- Tech stack: MERN (MongoDB, Express, React, Node.js), JWT, Stripe, Tailwind CSS

---

## Modules Identified (from documentation + codebase)

| # | Module | Backend Routes | Frontend Pages | Roles Affected |
|---|--------|----------------|----------------|----------------|
| 01 | **Authentication** | `/api/auth/*` | Login, Register, Forgot/Reset Password, role logins | All |
| 02 | **Navbar / Masjid Selection** | `/api/mosques/*` | Navbar, mosque selector | User, Admin |
| 03 | **Donations** | `/api/donations/*` | Donate, Admin Donations | User, Admin |
| 04 | **Expenses** | `/api/expenses/*` | Admin Donations & Expenses | Admin |
| 05 | **Financial Transparency** | donations + expenses APIs | Transparency page | User, Admin |
| 06 | **Prayer Timings** | `/api/prayer-times/*` | User + Admin Prayer Times | User, Admin |
| 07 | **Events** | `/api/events/*` | User + Admin Events | User, Admin |
| 08 | **Announcements** | `/api/announcements/*` | User + Admin Announcements | User, Admin |
| 09 | **Nikah Booking** | `/api/nikah-bookings/*` | Nikah Booking, My Bookings | User, Scholar, Admin |
| 10 | **Scholars Management** | `/api/scholars/*` | Admin Scholars, Scholar Dashboard | Admin, Scholar |
| 11 | **Fund Requests (Zakat/Sadaqah)** | `/api/fund-requests/*` | Fund Request, My Requests | User, Committee, Admin |
| 12 | **Committee Panel** | `/api/committee/*` | Committee Dashboard, Admin Committee | Committee, Admin |
| 13 | **Manager / Multi-Mosque** | `/api/mosques/*` | Manager Dashboard, Mosques | Manager |
| 14 | **Stripe Payments** | `/api/donations/online`, webhook | Donate page | User |
| 15 | **Homepage** | multiple public APIs | Home page | Public, User |

> **Note:** Manager and Committee roles exist in code but your brief lists Admin/User/Scholar as primary. Phase sequence will be confirmed after your answers.

---

## Proposed Phase Sequence (pending approval)

1. **Phase 1 — Auth Module** (fix smoothness first — highest priority)
2. **Phase 2 — Navbar / Masjid Selection**
3. **Phase 3 — Donations Module**
4. **Phase 4 — Expenses Module**
5. **Phase 5 — Financial Transparency**
6. **Phase 6 — Prayer Timings**
7. **Phase 7 — Events Module**
8. **Phase 8 — Announcements Module**
9. **Phase 9 — Nikah Booking + Scholars**
10. **Phase 10 — Fund Requests + Committee**
11. **Phase 11 — Manager / Multi-Mosque**
12. **Phase 12 — Stripe E2E Verification**
13. **Phase 13 — Homepage & Promotional Content**
14. **Phase 99 — Final End-to-End Journeys**

---

## Dependency Order Rationale

- Auth must work before any role-based module testing
- Masjid selection affects mosque-scoped data (donations, events, prayer times)
- Donations/Expenses feed Transparency reports
- Scholars must exist before Nikah booking flow
- Committee must exist before fund request approval flow

---

## Known Auth Issue (pre-audit, not yet fixed)

`backend/server.js` applies `express-rate-limit` to **all** `/api/auth` routes:
- **10 requests per 15 minutes** — likely cause of "too many attempts" during testing
- No account lockout, captcha, or IP fingerprinting found in codebase

*Fixes will be proposed in Phase 1 Step 1.2 — awaiting approval before applying.*

---

## Client Decisions (Approved 2026-06-05)

- **Environment:** Local testing, seed via `utils/seed.js`
- **Roles:** All 5 roles — full detailed testing
- **Viva:** Every feature is priority
- **Password:** Min 8 chars + letter + number; keep "Invalid credentials"
- **Session:** 8 hours JWT for testing
- **Currency:** PKR only
- **Anonymous donations:** Admin sees real name for audit

## Approval Checklist

- [x] Client answered Phase 0 clarifying questions
- [x] Phase sequence approved
- [x] Manager/Committee included in testing scope
- [x] Auth fixes applied (Phase 1)

**Approved by:** Client (conversation 2026-06-05)  
**Date:** 2026-06-05
