# 06 Announcements Module - Questions Asked

> Phase 6 - Step A
> Date: 2026-08-13 (Re-asked after earlier Q1-Q3 were skipped)
> Module: Announcements Module
> **Status:** ✅ All 10 questions answered, all 10 applied as FIX-ANN-001 through 012 (12 BUGs fixed, 34/35 automated test PASS)

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

---

## Client Decisions (Q7-Q10) — raised after manual testing found BUG-ANN-012

> Phase 6 - Step B
> Date: 2026-08-14 (raised during manual testing)
> Trigger: admin2@emasjid.pk could see Al-Noor's announcements in the admin list — cross-mosque data leak.

### Q7 — Cross-mosque scope behavior
**Question:** What should happen when an admin tries to CRUD an announcement for a mosque they don't belong to?
**Answer:** ✅ **Reject with 403 Forbidden.** Backend ignores any mosqueId in body/query, forces `req.user.mosqueId`. If the resource's mosqueId doesn't match → 403. Standard RBAC pattern.

### Q8 — Cross-mosque operator (Manager role, not a new SuperAdmin role)
**Question:** Should we introduce a separate SuperAdmin role that bypasses per-mosque scope?
**Answer:** ❌ **No — use the existing `manager` role as the cross-mosque operator.** Per Dawood's direction: "manager is our super admin", "we should not increase features or scope because we already have a lot of features for our FYP." So we keep the existing `manager` enum value and use `Mosque.managerId` (the per-mosque manager on the Mosque document) as the scope source. Managers have **no `user.mosqueId`**; their scope is the union of mosques where `Mosque.managerId === manager._id`. They can pick one via `?mosqueId=` (or `body.mosqueId` on POST), or omit it to see/manage all their managed mosques. Trying to access a mosque they don't manage returns 400 (GET) or 403 (write).

### Q9 — Scholar / Committee Member scope
**Question:** How should Scholar and Committee Member accounts be treated?
**Answer:** ✅ **Same as Admin — strictly scoped to their own mosqueId.** Whatever JWT says their `mosqueId` is, that's the only mosque they can touch. No special privileges.

### Q10 — Scope of the fix
**Question:** How wide should the fix cast be in this round?
**Answer:** ✅ **Announcements only — surgical fix to the immediate bug.** Other modules (Events, Donations, etc.) get the same fix pattern in their own phases.
