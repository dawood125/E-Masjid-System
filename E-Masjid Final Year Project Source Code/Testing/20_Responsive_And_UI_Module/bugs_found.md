# 20 Responsive + UI Module — Bugs Found

> Step C — 2026-08-25
>
> **8 bugs identified** across 8 files. All 8 are HIGH or MEDIUM severity. The codebase already has the right patterns in 2 places (Announcements "type title to confirm", Marketing "Are you sure" modal) — the bugs are pages that *don't follow* the existing pattern.

---

## Bug inventory

| # | Severity | Bug | File | Line |
|---|---|---|---|---|
| BUG-PHASE20-001 | **HIGH** | Sidebar shows hardcoded "Haji Ahmad" / "Administrator" instead of logged-in user's name/role | `frontend/src/components/Common/Sidebar.jsx` | 117–118 |
| BUG-PHASE20-002 | **HIGH** | Delete event button has NO confirmation modal — deletes immediately on click | `frontend/src/components/Admin/Pages/Events.jsx` | 402–416 |
| BUG-PHASE20-003 | **HIGH** | Delete committee member button has NO confirmation | `frontend/src/components/Admin/Pages/Committee.jsx` | 164 |
| BUG-PHASE20-004 | **MEDIUM** | Activate/Deactivate scholar button has NO confirmation (one-way toggle with no undo) | `frontend/src/components/Admin/Pages/Scholars.jsx` | 360–373 |
| BUG-PHASE20-005 | **HIGH** | Delete donation button has NO confirmation (financial data loss) | `frontend/src/components/Admin/Pages/DonationsExpenses.jsx` | 409–423 |
| BUG-PHASE20-006 | **HIGH** | Delete expense button has NO confirmation (financial data loss) | `frontend/src/components/Admin/Pages/DonationsExpenses.jsx` | 519–533 |
| BUG-PHASE20-007 | **MEDIUM** | Authenticated mobile users can't reach their dashboard quick link from Navbar mobile menu (only see avatar + logout) | `frontend/src/components/Common/Navbar.jsx` | 425–455 |
| BUG-PHASE20-008 | **LOW** | Admin/Manager login forms use `autocomplete="email"` and `autocomplete="current-password"` — but the Community Login has a "Portal Access" select that lets user choose `community` or `scholar` — this works, but the role select should also be accessible (have a `<label>`). Already has `htmlFor="role"` ✓ — actually OK, skip | n/a | n/a |

> BUG-PHASE20-008 was a false alarm — Login.jsx line 128 already has the label. Removed from the fix list.

---

## Existing good patterns (reference for fixes)

These two patterns already exist in the codebase. Phase 20 fixes should reuse them, not invent new ones.

### Pattern A — "type title to confirm" (used by Announcements)

**File:** `frontend/src/components/Admin/Pages/Announcements.jsx:530–582`

Strong confirmation: user must type the announcement title exactly to enable the "Delete Permanently" button.

Best for: high-impact destructive actions (delete announcements, delete donation, delete expense).

### Pattern B — "Are you sure" modal (used by Marketing)

**File:** `frontend/src/components/Admin/Pages/Marketing.jsx:71–78`

Simpler confirmation: a Modal with the item name shown and Cancel/Delete buttons.

Best for: medium-impact actions (delete committee member, delete event) and one-way toggles (activate/deactivate scholar).

### Pattern C — `window.confirm()` (used by MyBookings)

**File:** `frontend/src/components/User/Pages/MyBookings.jsx:74`

Native browser confirm. Simplest. But inconsistent UX with the rest of the app.

---

## Per-bug details

### BUG-PHASE20-001 — Sidebar hardcoded "Haji Ahmad" / "Administrator"

**Why it matters:** When the admin or scholar opens the sidebar, the bottom always shows "Haji Ahmad / Administrator" regardless of who is logged in. This is a privacy/trust bug — it tells the user the app is showing demo data, not real data.

**Current code:**
```jsx
<div className="p-4 border-t border-primary-700 bg-primary-800 flex-shrink-0">
  <div className="flex items-center gap-3">
    <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
      <i className="material-icons-round text-sm">person</i>
    </div>
    <div className="text-sm flex-1">
      <p className="font-medium">Haji Ahmad</p>          {/* ← HARDCODED */}
      <p className="text-primary-100 text-xs">Administrator</p>  {/* ← HARDCODED */}
    </div>
  </div>
</div>
```

**Proposed fix:**
```jsx
<p className="font-medium">{user?.name || (role === 'scholar' ? 'Scholar' : 'Admin')}</p>
<p className="text-primary-100 text-xs">
  {role === 'scholar' ? 'Scholar Panel' : 'Administrator'}
</p>
```

`user` is destructured from `useAuth()` which is already imported on line 7 (currently unused in Sidebar.jsx for this purpose). Fix is a 4-line change.

**Severity:** HIGH — every admin/scholar who opens the sidebar sees fake data. Very visible.

---

### BUG-PHASE20-002 — Delete event with no confirmation

**Current code:** `Events.jsx:402-416`
```jsx
<button
  type="button"
  onClick={async () => {
    try {
      await api.deleteEvent(event.id)
      setEvents((prev) => prev.filter((e) => (e._id || e.id) !== event.id))
      showToast('Event deleted successfully.', 'success')
    } catch (err) {
      showToast(err.message || 'Failed to delete event.', 'error')
    }
  }}
  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-200 text-red-600 hover:bg-red-50"
>
  <i className="material-icons-round text-base">delete</i>
</button>
```

**The problem:** One accidental click on the trash icon and the event is gone. The whole row + registrations + associated data — lost.

**Proposed fix:** Reuse Pattern B (`ConfirmDelete`-style modal). Add `const [confirmDel, setConfirmDel] = useState(null)` state, replace the inline `onClick` with `onClick={() => setConfirmDel(event)}`, render the modal with the event title.

**Severity:** HIGH — events have registrations attached. Data loss has cascading effect.

---

### BUG-PHASE20-003 — Delete committee member with no confirmation

**Current code:** `Committee.jsx:164`
```jsx
<button onClick={() => deleteMember(member.id)} className="...">
  <i className="material-icons-round text-lg">delete</i>
</button>
```

**Proposed fix:** Reuse Pattern B. Add `const [confirmDel, setConfirmDel] = useState(null)` and require modal confirmation before calling `deleteMember()`.

**Severity:** HIGH — deleting a committee member removes their access (and votes on past fund requests stay attributed, but future votes won't happen). Admin might click by mistake.

---

### BUG-PHASE20-004 — Activate/Deactivate scholar with no confirmation

**Current code:** `Scholars.jsx:360-373`
```jsx
<button
  type="button"
  onClick={() => toggleActive(scholar)}
  className={`inline-flex h-8 w-8 items-center justify-center rounded-md border ${
    scholar.isActive ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
  }`}
  title={scholar.isActive ? 'Deactivate' : 'Activate'}
>
  <i className="material-icons-round text-base">
    {scholar.isActive ? 'delete' : 'check_circle'}
  </i>
</button>
```

`toggleActive(scholar)` directly mutates state on line 211-227.

**The problem:** The icon shows a trash can (`delete`) for deactivation — implying deletion. But the action is just deactivation, not delete. Worse, there's no confirmation. Misclick = scholar can't accept Nikah bookings.

**Proposed fix:**
1. Change the deactivate icon from `delete` to `block` (or similar) so the action matches the icon
2. Add Pattern B confirmation: "Mark {scholar.name} as inactive? They won't be able to accept new Nikah bookings until re-activated."

**Severity:** MEDIUM — recoverable (can re-activate), but visible side effect and bad icon choice.

---

### BUG-PHASE20-005 — Delete donation with no confirmation

**Current code:** `DonationsExpenses.jsx:409-423`
```jsx
<button
  type="button"
  onClick={async () => {
    try {
      await api.deleteDonation(donation.id)
      ...
    }
  }}
>
  <i className="material-icons-round text-base">delete</i>
</button>
```

**Proposed fix:** Reuse Pattern A (type donor name or amount to confirm) — high-stakes financial data. Or Pattern B with "Delete donation of PKR 35,000 from Ahmad?".

**Severity:** HIGH — donation records affect the Transparency page (public) and the dashboard totals. Misclick erases donor history.

---

### BUG-PHASE20-006 — Delete expense with no confirmation

**Current code:** `DonationsExpenses.jsx:519-533` — same pattern as BUG-PHASE20-005.

**Proposed fix:** Same as BUG-PHASE20-005. Pattern A or B.

**Severity:** HIGH — expense records affect Transparency page and financial reports.

---

### BUG-PHASE20-007 — Mobile menu missing dashboard link for authenticated users

**Current code:** `Navbar.jsx:425-455`
```jsx
{isAuthenticated && (
  <div className="mt-4 pt-4 border-t">
    <div className="mb-4 flex items-center gap-3 ...">
      {/* avatar + name + email + role badge */}
    </div>
    <button onClick={() => { logout(); closeMobileMenu() }} className="btn btn-secondary w-full">
      Logout
    </button>
  </div>
)}
```

**The problem:** On desktop (Navbar line 296), the `UserAvatarMenu` shows:
- Admin → "Admin Dashboard" link
- Scholar → "Scholar Dashboard" link
- Committee → "Committee Panel" link
- Community → "My Bookings" link

But on mobile, the same logged-in user only sees "Logout". They have to log out and back in via desktop to reach their panel? No — they can't. The mobile menu doesn't show how to navigate to their dashboard.

**Proposed fix:** Add the same role-based dashboard link section above the Logout button in the mobile menu.

**Severity:** MEDIUM — UX gap. Users CAN reach their dashboard by typing the URL directly, but mobile-only users would be stuck. Real-world impact: admin who's at the masjid using their phone can't check admin dashboard.

---

## What was checked and is OK (no bug)

| Area | Status |
|---|---|
| Login pages (User/Admin/Manager/Committee) have labels + password toggle | ✅ |
| Auth forms use `htmlFor`/`id` linkage | ✅ |
| Modal close: ESC key, backdrop click, X button | ✅ (announcements modal works on all three) |
| Loading states: dashboards show "Loading..." or skeleton | ✅ |
| Empty states: tables show "No X found" | ✅ |
| Tailwind responsive classes used across all 48 component files | ✅ |
| Sidebars collapse to drawer with backdrop on mobile (Manager/Committee/Common-Sidebar all have it) | ✅ |
| Footer present on user pages | ✅ |
| `useEffect` mount-checked to prevent state update on unmounted components | ✅ |
| `aria-label` on icon-only buttons (e.g., password toggle) | ✅ |
| Toast notifications for success/error on most async actions | ✅ |
| Forms disable submit button during loading | ✅ |
| Honest UI labels (no fake "+12% this month" — Phase 19 already cleaned) | ✅ |

---

## Files NOT changed (intentionally)

| File | Why skipped |
|---|---|
| `frontend/src/components/Admin/Pages/FundRequests.jsx` | The "Finalize & notify" button (line 287) IS destructive (changes request status + emails everyone) but it already shows a preview of the outcome (lines 238-247) and is only reachable after explicitly clicking into a request. Adding another modal would slow down a 4-member committee meeting. Skipping per "no scope creep". |
| `frontend/src/components/Scholar/Pages/Dashboard.jsx` | Already has a reject-modal-with-reason flow (lines 19-20, 76-100). Accept button is OK without confirmation (low impact — just claims a booking). |
| `frontend/src/components/User/Pages/MyBookings.jsx` | Already uses `window.confirm()` (line 74). |

---

## Estimated fix size

| Bug | Lines added | Lines changed |
|---|---|---|
| BUG-PHASE20-001 | 0 | 4 lines (Sidebar) |
| BUG-PHASE20-002 | ~30 | ~10 lines (Events modal) |
| BUG-PHASE20-003 | ~25 | ~10 lines (Committee modal) |
| BUG-PHASE20-004 | ~25 | ~5 lines (Scholars modal + icon) |
| BUG-PHASE20-005 | ~30 | ~10 lines (DonationsExpenses modal) |
| BUG-PHASE20-006 | ~30 | ~10 lines (DonationsExpenses modal) |
| BUG-PHASE20-007 | ~15 | 0 (add to Navbar mobile menu) |
| **Total** | **~155 lines added, ~49 lines changed** | |

Reuses existing patterns (no new component). Pure confirmation modals.

---

## What I need from you (Step D)

For each of the 7 bugs, please confirm the fix approach. I have recommended a default for each one (Pattern A vs B). If you want a different approach (e.g., toast with undo button, or skip the bug), flag it.

**My default fix recommendation:**
- BUG-001: Fix (real user name from `useAuth`)
- BUG-002: Fix (Pattern B modal)
- BUG-003: Fix (Pattern B modal)
- BUG-004: Fix (Pattern B modal + fix icon from `delete` to `block`)
- BUG-005: Fix (Pattern B modal — financial, but simple confirmation is sufficient since admin is the only actor)
- BUG-006: Fix (Pattern B modal)
- BUG-007: Fix (add dashboard link to mobile menu)

If you say "go ahead with defaults" I'll apply all 7 fixes and re-verify.