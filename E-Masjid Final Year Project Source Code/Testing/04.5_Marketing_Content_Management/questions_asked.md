# 04.5 Marketing Content Management — Questions Asked

**Date:** 2026-06-24
**Phase:** 4.5

---

## Client Decisions (from the Phase 4 follow-up conversation)

1. **"Stats coming from out database?"** — YES, auto-computed from existing tables (Donation, FundRequest, Mosque.createdAt). No more hardcoded numbers.

2. **"No need show the 2 Mosques Served card"** — REMOVED. Replaced with "Years Serving" (auto-computed from the oldest active mosque's createdAt year).

3. **"Where the impact counter from"** — Auto-computed from:
   - `prayersTracked` ≈ count of users × 200 (proxy for active worshippers)
   - `studentsTaught` ≈ count of events × 10
   - `nikahHosted` = count of accepted NikahBookings
   - `familiesSupported` = count of approved/fulfilled FundRequests

4. **"Featured compainig is hardcoded"** — FIXED. Admin can create/edit/delete campaigns via the new admin panel at `/admin/marketing`.

5. **"Program gird is not clickable"** — REMOVED. Partner decided programs are not strictly needed. The 6 service cards are gone.

6. **"Once solution for this marketing data is have that admin add all these data"** — YES, built the full admin panel with 3 tabs:
   - Campaigns tab: create/edit/delete with auto-unfeature
   - Testimonials tab: create/edit/delete (name, role, quote, photo URL, order, active)
   - Hero Slides tab: create/edit/delete (image, caption, order, active)

7. **"For now we can skip the program"** — Done. ProgramsGrid component deleted from the codebase.

8. **"Testimonials should be created from the admin panel"** — Done. Testimonials tab in admin panel has a form with name, role, quote, photo URL (with fallback to default Gemini images).

9. **"For stat we can repurpose it to years serving community card"** — Done. Stats section now has Years Serving, Total Donations, Active Fund Requests, Families Helped (4 cards).

10. **"Hero slides be editable with admin panel and keep the 6 images as default"** — Done. Hero slides tab has full CRUD. The 6 default Gemini images are pre-seeded in `seed.js` so the carousel looks great on a fresh install.

11. **"Full stack end to end working"** — Done. Backend (3 models + 6 public + 12 admin routes), Frontend (5 public components refactored + 1 new admin page + sidebar link + route + 18 API methods + seed), all verified with `npm run lint` (0 errors), `npm run build` (success), `npm test` (10/10).

12. **"Once we finish this and test it then we will move to the phase 3.5 of Mosque selection at sign up"** — Phase 3.5 is next. Will start after partner confirms Phase 4.5 works.

## Technical Decisions Made by Me (with partner's implied approval)

1. **Why a single Marketing page with tabs (not 3 separate pages)?** — Tabs are faster to switch between, require fewer route definitions, and feel like a cohesive "content management" experience.
2. **Why pre-save hook for auto-unfeature?** — Ensures data integrity at the DB level. Even if the admin frontend forgets to unfeature the old one, the DB enforces it. Simpler client code.
3. **Why countUp animation in Stats/Impact?** — Visual delight, makes numbers feel "alive" on first load.
4. **Why fallback to defaults when admin DB is empty?** — Demo always looks good even before the admin has added anything. Reduces onboarding friction.

## Notes for Future Work (not in Phase 4.5)

- **Image upload (multer):** admin currently pastes image URLs. Adding file upload would be nice but is out of scope for the FYP demo.
- **Per-mosque marketing content:** currently marketing is global. In production, you'd probably want a "campaigns for THIS mosque" relationship.
- **Email notification on new testimonial:** would use the existing SendGrid integration. Not done per partner's earlier decision.
