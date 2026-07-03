# 03 Navbar / Masjid Selection — Questions Asked

**Date:** 2026-06-24
**Phase:** 3

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
- All other Phase 1 + Phase 2 fixes already applied (logout, cross-role force-logout, sidebar, toast, forgot-password, SendGrid, Register errors, 4 real-email seeded users)

## Outstanding UX bug from Phase 2 (deferred to this phase)

The partner flagged a **navbar UI issue** during Phase 2 testing. The screenshot showed:

- The "MOSQUE" brand text was clipped (visible only as "MASQUE" in the screenshot)
- "Prayer Times" link was wrapping to 2 lines
- "Donate" was also wrapping
- The mosque-dropdown text "Masjid Al-Noor (Sheikhupura)" was truncated with "…"

The dropdown still works (mosque selection, logout, etc.) but the layout looks cramped on desktop widths.

**TODO for this phase:** Fix the navbar layout so all menu items fit on a single line on desktop, with the mosque dropdown showing the full name. Will be addressed as BUG-NAV-001 in the bugs_found.md during this phase.

## Questions for This Phase

### Q1. Navbar fix scope
**Should I fix the navbar layout as part of this phase, or split it out?**
- (A) Fix as part of Phase 3 (since it's the navbar)
- (B) Split out into a separate "Navbar UI Polish" phase before Phase 3

I recommend **(A)** — same component, same file, no benefit to splitting.

### Q2. Mobile behavior
**Should the navbar also be tested on mobile widths (phone/tablet)?**
- (A) Yes — test mobile, tablet, desktop (3 widths)
- (B) Desktop only (defer mobile to Phase 20 — Responsive/UI Module)

I recommend **(A)** for completeness; mobile bugs are easy to find and fix now.

### Q3. Multi-mosque context
The codebase has a `mosqueId` per user and an `activeMosqueId` in localStorage (managed by the navbar dropdown). For this phase:
- (A) Test the dropdown switching between multiple mosques (need to seed 2+ mosques)
- (B) Test with the single seeded `Masjid Al-Noor` only

I recommend **(A)** for full coverage; I'll add a second mosque to the seed if needed.

### Q4. Active mosque scoping
The navbar sets the active mosque context for all public pages (prayer times, events, donations, announcements). Should I verify that switching the dropdown:
- (A) Updates the public prayer times shown on the homepage
- (B) Updates which events are listed
- (C) Both of the above

I recommend **(C)** — both should react to the dropdown change.

### Q5. Logout + cross-role from public navbar
**Should this phase re-verify that the public Navbar Logout button works for all 5 roles?**
- (A) Yes — quick re-test of the public Logout button for each role (covered by Phase 1 Test 8 but worth a sanity check from the navbar)
- (B) No — already tested in Phase 1, skip

I recommend **(A)** as a 1-minute sanity check.

---

## Client Answers (to be filled in by Dawood)

1.
2.
3.
4.
5.
