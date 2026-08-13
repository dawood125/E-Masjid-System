# 06 Announcements Module - Questions Asked

> Phase 6 - Step A
> Date: 2026-08-13 (Re-asked after earlier Q1-Q3 were skipped)
> Module: Announcements Module
> **Status:** ✅ All 6 questions answered, all 6 applied as FIX-ANN-001 through 009 (11 BUGs fixed, 24/25 automated test PASS)

---

## Client Decisions (Q1-Q6)

### Q1 — Urgent Announcements Display
**Question:** Should urgent announcements have a specific visual distinction beyond the current heuristic?
**Answer:** ✅ **Option A — Amber banner at top + red badge.** Urgent announcements deserve a prominent amber banner at the top of the public page (similar to the prayer-times next-prayer card), plus a red "Urgent" badge on each card. The current `inferCategory` returning 'important' is too subtle.

### Q2 — Admin "Quick Actions" (Mark Urgent, Publish)
**Question:** Should the admin's ⚠️ Mark Urgent and Publish buttons call the API or stay as demo toasts?
**Answer:** ✅ **Option A — Wire both to real API.** Both are real CRUD operations. The current "(demo)" toasts are misleading. Wire them to actual PUT requests.

### Q3 — Past `publishDate` on edit
**Question:** What should the admin form do when saving an announcement whose `publishDate` is in the past (e.g., a draft created yesterday)?
**Answer:** ✅ **Option A — Allow saving with past publishDate.** Same approach as Prayer Times (Q11). Remove the past-date block on edit. The admin can always adjust `publishDate` forward if they want re-scheduling.

### Q4 — Mosque Mismatch Banner
**Question:** Should the admin page use the admin's own mosqueId (like Prayer Times) instead of the navbar's localStorage mosqueId?
**Answer:** ✅ **Option A — Yes, apply same mosque-mismatch pattern as Prayer Times (FIX-PRAYER-005).** Admin form always uses admin's own mosqueId, with a yellow banner if navbar mosque differs.

### Q5 — Delete Confirmation
**Question:** Should announcements have a delete confirmation modal (per Phase 20 destructive-action rule)?
**Answer:** ✅ **Option A — Yes, add confirmation modal.** Type the title to confirm. Phase 20 will reference this pattern.

### Q6 — `publishedBy` field
**Question:** Should `publishedBy` show the actual logged-in admin's name?
**Answer:** ✅ **Option A — Set from logged-in admin's name (via `useAuth`).** Replaces the hardcoded `'Admin'` literal.

---

## Decisions inherited from earlier phases (not re-asked)

- **Draft announcements are hidden from public `/announcements`** (already enforced by backend — `query.status = { $ne: 'draft' }`).
- **Pagination on public view** — the current 6-per-page rendering is acceptable; the bug to fix is that page numbers are capped at 5 silently (BUG-ANN-008).
- **Recursive CRUD** — model already supports soft-delete via the `status: 'draft'` field (no hard-delete needed).
- **Date format** — `formatDate` utility exists; use it (do not hardcode Islamic dates).
