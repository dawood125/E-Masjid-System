# E-Masjid — Master Testing Plan

> **Status:** APPROVED — Phase 0 complete. Phase 1 (Auth) ✅ done. Phase 2 (Forgot Password) starting now.
> **Re-analysis:** 2026-06-23 — full coverage gap report produced. 6 new modules added (16-21). 14 existing modules renumbered to new positions. All 21+99 folders present.

---

## Documentation Reference

- Primary doc: `FinalYearDcomumentation.md` (project root, 96 pages)
- Tech stack: MERN (MongoDB, Express, React, Node.js), JWT, Stripe, Tailwind CSS
- Coverage Gap Report: produced 2026-06-23 from full re-read of docs + codebase

---

## Final Phase Order (21 functional + 99 E2E)

| Phase | Folder | Module | Status |
|-------|--------|--------|--------|
| 1 | `01_Auth_Module` | Login/Register/Logout/Session/RBAC (all 5 roles) | ✅ Complete |
| 2 | `02_Forgot_Password_Module` | Forgot/Reset password + email-service failure | ✅ Complete (10/10 backend tests, awaiting partner manual) |
| 3 | `03_Navbar_Masjid_Selection` | Navbar + multi-mosque dropdown | ⏸ Pending |
| 4 | `04_Homepage_Module` | Public homepage (prayer/announcement/event + carousel + top donors) | ⏸ Pending |
| 5 | `05_Prayer_Timings_Module` | Public view + admin manage + Jummah + Ramadan | ⏸ Pending |
| 6 | `06_Announcements_Module` | Public view + admin manage + urgent + scheduling | ⏸ Pending |
| 7 | `07_Events_Module` | Public + admin CRUD + register + max-participant + draft | ⏸ Pending |
| 8 | `08_Expenses_Module` | Admin record expenses | ⏸ Pending |
| 9 | `09_Donations_Module` | Admin record cash donations (cash flow only) | ⏸ Pending |
| 10 | `10_Financial_Transparency` | Public + donor income/expense report | ⏸ Pending |
| 11 | `11_Scholars_Module` | Admin create scholars + scholar login + accept/reject | ⏸ Pending |
| 12 | `12_Nikah_Booking_Module` | User book + view + cancel | ⏸ Pending |
| 13 | `13_Committee_Module` | Committee review + approve/reject + immutability | ⏸ Pending |
| 14 | `14_Fund_Requests_Module` | User submit Zakat/Sadaqah + My Requests | ⏸ Pending |
| 15 | `15_Committee_Account_Management_Module` | Admin create/manage committee accounts | ⏸ Pending |
| 16 | `16_Manager_MultiMosque_Module` | Manager create mosque + module toggle + admin-per-mosque | ⏸ Pending |
| 17 | `17_Stripe_Payments_Module` | Stripe Checkout + webhook + auth gate | ⏸ Pending |
| 18 | `18_Notification_Email_Module` | Nodemailer coverage (reset + committee + future) | ⏸ Pending |
| 19 | `19_Admin_Dashboard_And_Reports_Module` | Admin dashboard + monthly report | ⏸ Pending |
| 20 | `20_Responsive_And_UI_Module` | Responsive + elderly + UI rules + destructive prompts | ⏸ Pending |
| 21 | `21_NonFunctional_Requirements_Module` | Perf + Security + Reliability + Usability NFRs | ⏸ Pending |
| 99 | `99_Final_E2E_Tests` | Cross-module journeys | ⏸ Pending |

---

## Module-to-Documentation Mapping

| Phase | Folder | Doc Reference |
|-------|--------|---------------|
| 1 | Auth | FR-1, UC-1, UC-2, UC-11 |
| 2 | Forgot Password | FR-9, UC-3, NFR-Rel |
| 3 | Navbar | (UI / cross-cutting) |
| 4 | Homepage | FR-5, FR-13, FR-7, UC-7, FT-5, FYP Evaluation #9 |
| 5 | Prayer Timings | FR-7, UC-4, UC-13 |
| 6 | Announcements | FR-5, UC-7, UC-15 |
| 7 | Events | FR-5, UC-5, UC-14 |
| 8 | Expenses | FR-3, UC-12 |
| 9 | Donations | FR-2, UC-12, FR-8 (online) |
| 10 | Financial Transparency | FR-4, UC-6 |
| 11 | Scholars | FR-11, UC-16, UC-17 |
| 12 | Nikah Booking | FR-6, UC-9, UC-10 |
| 13 | Committee Review | FR-14, UC-19 |
| 14 | Fund Requests | FR-13, UC-18 |
| 15 | Committee Account Mgmt | FR-14, UC-21 |
| 16 | Manager / Multi-Mosque | FR-12, UC-20 |
| 17 | Stripe Payments | FR-8, UC-8 |
| 18 | Notification Email | FR-13, FR-9, NFR-Rel |
| 19 | Admin Dashboard / Reports | UC-12 alt, FR-4 |
| 20 | Responsive / UI | NFR-Usab (UI Requirements 2.5.1) |
| 21 | Non-Functional | NFR-Rel, NFR-Usab, NFR-Perf, NFR-Sec |
| 99 | E2E | IT-1, IT-2, all multi-role journeys |

---

## Phase Sequence Rationale

- **Phase 1 first** because every role-based test requires login.
- **Phase 2 (Forgot Password)** right after Auth — same code path (User model), same email service, no role dependency.
- **Phase 3 (Navbar)** before feature modules because the multi-mosque context affects every mosque-scoped data fetch.
- **Phase 4 (Homepage)** early because it surfaces integration issues from Phases 5-7 (prayer/announcements/events) before they get tested in depth.
- **Phases 5-7 (Prayer, Announcements, Events)** grouped: public-data modules re-used by Homepage.
- **Phases 8-9 (Expenses, Donations)** then **Phase 10 (Transparency)** — Transparency depends on both.
- **Phase 11 (Scholars) before 12 (Nikah)** — Nikah booking needs a scholar.
- **Phase 13 (Committee Review) before 14 (Fund Requests)** — review flow tested before submission volume.
- **Phase 15 (Committee Account Mgmt)** before Phase 13 conceptually but the table re-orders so submission (14) is tested before account mgmt (15) — both are needed for the full flow.
- **Phase 16 (Manager)** last among role-based modules because it controls other roles.
- **Phase 17 (Stripe)** is dependent on Donations flow.
- **Phase 18 (Notification Email)** is cross-cutting and tests Nodemailer service reliability.
- **Phase 19 (Admin Dashboard)** depends on Phases 8-10 + 17 data.
- **Phase 20 (Responsive/UI)** near the end so all pages exist for visual testing.
- **Phase 21 (NFRs)** last before E2E — system must be stable to measure perf.
- **Phase 99 (E2E)** always last.

---

## Client Decisions Log

- **2026-06-05:** Environment=local, seed data, all 5 roles fully tested, every feature is priority, password min 8 + letter + number, "Invalid credentials" error kept, session 8h for testing, PKR only, admin sees real donor name.
- **2026-06-19:** Logout must redirect to role-specific login; sidebar bottom links must be reachable; cross-role login must auto-logout previous session with toast.
- **2026-06-23:** Added 6 new test modules (16-21); renumbered existing 14 modules; Phase 2 (Forgot Password) starts next.

---

## How Each Module Folder Is Structured

Every `XX_Module/` folder contains **5 standard files**:

| File | Purpose |
|------|---------|
| `questions_asked.md` | 3-5 clarifying questions + client answers for this module |
| `my_test_results.md` | Automated test results + code-path verification for this module |
| `manual_testing_guide.md` | Step-by-step manual tests for partner (non-technical, browser-only) |
| `bugs_found.md` | Bugs discovered in this module (severity, location, status) |
| `bugs_fixed.md` | Bugs fixed in this module (file, change, result) |

---

## Testing Workflow (Strict Phase-by-Phase)

For EVERY module, follow this exact workflow:

1. **Step A — Ask Clarifying Questions (3-5 only):** Save to `questions_asked.md`, wait for client answers
2. **Step B — Automated Test:** Backend + frontend code-path verification, lint/build/test, save to `my_test_results.md`
3. **Step C — Find Bugs:** Document in `bugs_found.md` (severity, location, steps, expected vs actual). **Propose fix — do not apply yet.**
4. **Step D — Wait for Client Approval** of proposed fixes
5. **Step E — Apply Fixes:** After approval, apply + re-test, document in `bugs_fixed.md`
6. **Step F — Generate Manual Testing Guide:** `manual_testing_guide.md` for partner
7. **Step G — Hand Off:** Client/partner runs manual tests, reports back. Only then move to next module.

**Strict rules:**
- Never move to next module with failing tests
- Never apply fixes without client approval
- Never modify `FinalYearDcomumentation.md`
- Always save to `Testing/` folder
- Always use simple non-technical language in manual guides
