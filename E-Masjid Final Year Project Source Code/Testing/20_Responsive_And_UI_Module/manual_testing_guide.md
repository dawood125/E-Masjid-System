# 20 Responsive + UI Module — Manual Testing Guide

> **For the project partner / FYP examiner.** No technical knowledge required. All tests run in the browser. Estimated time: ~20 minutes.

**Test environment setup:**
- Backend running on `http://localhost:5000`
- Frontend running on `http://localhost:5174`
- Test users:
  - `admin@emasjid.pk` / `admin123` — admin of Masjid Al-Noor
  - `scholar1@emasjid.pk` / `scholar123` — religious scholar
  - `committee1@emasjid.pk` / `committee123` — committee member
- **Mobile testing tip:** Open Chrome DevTools (F12) → click the device toolbar icon (Ctrl+Shift+M) → pick "iPhone 12 Pro" or any phone preset to simulate mobile.

---

## Test 1 — Sidebar shows your real name (2 min)

**What we're testing:** When you log in as the Al-Noor admin, the admin sidebar's footer should show YOUR name (not "Haji Ahmad").

### Steps

1. Open `http://localhost:5174/admin/login`.
2. Log in as `admin@emasjid.pk` / `admin123`.
3. You land on `/admin/dashboard`.
4. Look at the bottom-left sidebar — it should show **"Administrator"** with the real admin's name above it.
5. The fake name "Haji Ahmad" should NOT appear anywhere.

### Verification

✅ **Pass:** Sidebar shows your real name (not "Haji Ahmad").

❌ **Fail:** Sidebar still shows "Haji Ahmad / Administrator" → fix didn't apply.

### Repeat for scholar (30 sec)

6. Log out. Log in as `scholar1@emasjid.pk` / `scholar123` at `/login`.
7. Look at the sidebar footer — should show the scholar's name + "Scholar Panel".

✅ **Pass:** Sidebar shows scholar's name with role label "Scholar Panel".

---

## Test 2 — Delete event now requires confirmation (2 min)

**What we're testing:** Clicking the trash icon on an event should NOT delete it immediately. Instead, a confirmation modal should appear.

### Steps

1. Log in as `admin@emasjid.pk` / `admin123`.
2. Navigate to `/admin/events` (Events in the sidebar).
3. Find any event in the list. Click the red trash icon on its row.
4. **A modal should appear** titled "Delete Event" with the event's name shown.
5. **Click Cancel** — modal closes, event is NOT deleted (still in the list).
6. Click the trash icon again.
7. **Click "Delete Event"** — modal closes, event is removed, success toast appears.

### Verification

✅ **Pass:** Modal appears before any deletion. Cancel = no change. Confirm = deletion.

❌ **Fail:** Event disappears instantly without modal → fix didn't apply.

---

## Test 3 — Delete committee member now requires confirmation (2 min)

### Steps

1. As `admin@emasjid.pk`, navigate to `/admin/committee`.
2. Click the red trash icon next to any committee member.
3. **A modal should appear** titled "Remove Committee Member" with the member's name shown.
4. **Click Cancel** — nothing happens.
5. Click trash again → click **"Remove Member"** — member is removed, toast shown.

### Verification

✅ **Pass:** Modal works as expected.

---

## Test 4 — Activate/Deactivate scholar with new icon (3 min)

**What we're testing:** Two things:
- The deactivate icon is now a `block` icon (not a trash can)
- A confirmation modal appears before the action

### Steps

1. As `admin@emasjid.pk`, navigate to `/admin/scholars` (Manage Scholars).
2. Find an active scholar card. Look at the action buttons in the top-right of the card.
3. The deactivate button should now show a **`block` icon** (a circle with a slash through it), NOT a trash can.
4. Click it → **modal appears**: "Are you sure you want to mark {name} as inactive?..."
5. Click Cancel → nothing happens.
6. Click the icon again → click **"Mark Inactive"** → scholar is deactivated, toast appears.
7. The icon should now flip to **`check_circle`** (green) for re-activation.
8. Click it → modal says "re-activate {name}..." → click Activate → scholar is re-activated.

### Verification

✅ **Pass:** Block icon (not trash), modal appears, action reversible.

❌ **Fail:** Still shows trash icon, OR no modal, OR no reversal possible.

---

## Test 5 — Delete donation requires typing donor name (3 min)

**What we're testing:** Highest-stakes delete in the app — donation records. Pattern A: type the donor name to enable deletion.

### Steps

1. As `admin@emasjid.pk`, navigate to `/admin/donations`.
2. On the Donations tab, find any donation row. Click the red trash icon.
3. **Modal appears** titled "Delete Donation" with:
   - Donor name (e.g., "Ahmad Raza")
   - Amount (e.g., "PKR 5,000")
   - Prompt: "To confirm, type the donor name exactly:"
   - A grey box showing the donor name in monospace
   - An input field for typing the name
4. **Type a wrong name** (e.g., "ahmad raza" lowercase) — the "Delete Permanently" button stays DISABLED.
5. **Type the exact name** "Ahmad Raza" — the button becomes ENABLED.
6. Click "Delete Permanently" — row is removed, toast shown.

### Verification

✅ **Pass:** Strong confirmation. Wrong name = no delete. Right name = delete proceeds.

❌ **Fail:** Button enabled without typing, OR any text works → fix didn't apply.

---

## Test 6 — Delete expense requires typing amount (3 min)

### Steps

1. On the same `/admin/donations` page, switch to the **Expenses** tab.
2. Click trash on any expense row.
3. **Modal appears** showing:
   - Category (e.g., "Utilities")
   - Amount formatted (e.g., "PKR 12,500")
   - Description
   - Prompt to type the amount
   - A grey box showing the formatted amount "12,500"
   - Input field
4. **Type "12500"** (no comma) — button stays disabled (it wants the formatted version).
5. **Type "12,500"** (with comma) — button becomes enabled.
6. Click "Delete Permanently" — row removed, toast shown.

### Verification

✅ **Pass:** Must type the formatted amount (with comma).

❌ **Fail:** Button enables with "12500" or any other variant → too lenient.

---

## Test 7 — Mobile menu shows dashboard quick link (2 min)

**What we're testing:** On mobile width (<1024px), authenticated users should see a button linking to their dashboard in the hamburger menu.

### Steps

1. Open the website in your browser.
2. Press F12 → click the device toolbar icon (Ctrl+Shift+M) → pick "iPhone 12 Pro".
3. The page reloads in mobile width.
4. The navbar should now show a hamburger icon instead of the desktop nav.
5. Click the hamburger.
6. The mobile menu slides in. Scroll to the bottom (below "Community" links).
7. If you are logged in (try `admin@emasjid.pk` via `/admin/login` first):
   - You should see a green-highlighted **"Admin Dashboard"** link with a dashboard icon
   - Below it, the **Logout** button
8. Click "Admin Dashboard" → goes to `/admin`.

### Verification

✅ **Pass:** Dashboard link visible and clickable on mobile.

❌ **Fail:** Only Logout button shows, no dashboard link → fix didn't apply.

### Repeat for other roles (1 min each)

9. Log out, log in as `scholar1@emasjid.pk` / `scholar123`. Resize mobile. Mobile menu should show **"Scholar Dashboard"**.
10. Log in as `committee1@emasjid.pk` / `committee123`. Mobile menu should show **"Committee Panel"**.

---

## Test 8 — Responsive layout still works (3 min)

**What we're testing:** The existing responsive design wasn't broken by the modal additions.

### Steps

1. On desktop width (1920×1080), open `/admin/dashboard`.
2. Resize the browser window through these widths: 1920 → 1280 → 1024 → 768 → 414 → 320.
3. At each width, verify:
   - No horizontal scrollbar appears
   - The sidebar collapses to a drawer (hamburger appears) below 1024px
   - Stat cards stack from 4-column (xl) to 2-column (md) to 1-column (sm)
   - Tables allow horizontal scroll (`overflow-x-auto`)
4. On mobile (≤640px), open a modal (e.g., Add Donation).
5. The modal should fit within the viewport without overflow. Buttons should be tappable (≥44px tall).

### Verification

✅ **Pass:** Layout adapts cleanly at every breakpoint. Modals fit on mobile.

❌ **Fail:** Horizontal scroll, overlapping elements, modal overflows viewport.

---

## Test 9 — Existing good patterns still work (1 min)

### Steps

1. As `admin@emasjid.pk`, navigate to `/admin/announcements`.
2. Click delete on any announcement — the **existing** "type title to confirm" modal should still work (unchanged from Phase 16).
3. Navigate to `/admin/marketing`. Click delete on a hero slide — the **existing** "Are you sure" modal should still work.

### Verification

✅ **Pass:** Both existing modals still work as before. No regression.

---

## What to look out for

| Symptom | Likely cause | What to do |
|---|---|---|
| Delete still happens with no confirmation | Fix didn't apply to that file | Re-check the file's onClick handler |
| Modal appears but Cancel button does nothing | Missing `setConfirmDelete(null)` in onClick | Re-check the Cancel button's onClick |
| "Delete Permanently" button is enabled with empty input | Comparison logic broken | Check the `disabled={... !== expected}` expression |
| Modal doesn't close after successful delete | Missing `setConfirmDelete(null)` after success | Should be there in `handleConfirmDelete` |
| Toast says "Failed to delete" on a successful delete | Wrong response handling | Check the `.then()` / `.catch()` chain |
| Sidebar still says "Haji Ahmad" | Wrong variable destructured | Confirm `const { user, logout } = useAuth()` |
| Mobile menu still missing dashboard link | Link added but `user?.role` is undefined | Verify you're logged in when testing |
| Modal text overflows on tiny screen | `max-w-md` too wide for 320px | Reduce padding in the modal |

---

## Reporting

When you've run the tests, report back:

- ✅ All passed → move on to Phase 21
- ❌ One or more failed → describe what you saw (screenshot if possible), which test number, and any toast messages / error text

The developer will investigate any failures.