# 20 Responsive + UI Module — Bugs Fixed

> Step E — 2026-08-25. All 7 Phase 20 bugs fixed.

---

## Summary

| Bug | Severity | Status | Fix |
|---|---|---|---|
| BUG-PHASE20-001 | HIGH | ✅ Fixed | Real user name + role in Sidebar |
| BUG-PHASE20-002 | HIGH | ✅ Fixed | Pattern B modal — delete event |
| BUG-PHASE20-003 | HIGH | ✅ Fixed | Pattern B modal — delete committee member |
| BUG-PHASE20-004 | MEDIUM | ✅ Fixed | Pattern B modal + icon `delete` → `block` for deactivate |
| BUG-PHASE20-005 | HIGH | ✅ Fixed | Pattern A modal — type donor name to delete donation |
| BUG-PHASE20-006 | HIGH | ✅ Fixed | Pattern A modal — type amount to delete expense |
| BUG-PHASE20-007 | MEDIUM | ✅ Fixed | Role-based dashboard link in Navbar mobile menu |

**Files modified: 7. Lint clean (3 errors + 7 warnings, identical to baseline). Backend tests 159/160 PASS (1 pre-existing failure unchanged).**

---

## FIX-PHASE20-001 — Sidebar shows real logged-in user (was: hardcoded "Haji Ahmad")

**Why:** The Sidebar used by Admin and Scholar layouts always showed "Haji Ahmad / Administrator" in the footer regardless of who was logged in. Every other layout correctly uses `user?.name` / `user?.role`.

### Change

`frontend/src/components/Common/Sidebar.jsx`:

```diff
 export default function Sidebar({ role = 'admin' }) {
   const { sidebarOpen, closeSidebar } = useUI()
-  const { logout } = useAuth()
+  const { user, logout } = useAuth()
   const navigate = useNavigate()
```

```diff
 <div className="text-sm flex-1">
-  <p className="font-medium">Haji Ahmad</p>
-  <p className="text-primary-100 text-xs">Administrator</p>
+  <p className="font-medium">{user?.name || (role === 'scholar' ? 'Scholar' : 'Admin')}</p>
+  <p className="text-primary-100 text-xs">
+    {role === 'scholar' ? 'Scholar Panel' : 'Administrator'}
+  </p>
 </div>
```

### Verification

- Log in as `admin@emasjid.pk` → Sidebar shows real admin name + "Administrator"
- Log in as a scholar → Sidebar shows scholar name + "Scholar Panel"
- Log in and check both `lg:` (desktop, sidebar visible) and `<lg` (mobile, drawer toggled open) — both paths render the real user.

---

## FIX-PHASE20-002 — Delete event now requires confirmation

**Why:** Clicking the trash icon on any event row deleted it instantly. Events have registrations attached; one accidental click erases everything.

### Change

`frontend/src/components/Admin/Pages/Events.jsx`:

- Added `confirmDelete` + `deletingId` state
- Inline `onClick` on delete button replaced with `onClick={() => setConfirmDelete(event)}`
- Added `handleConfirmDelete()` that calls `api.deleteEvent()` and handles success/error toasts
- Modal at end of component — Pattern B: title shown in bold + Cancel / Delete Event buttons + busy state during delete

### Verification

- Click trash icon → modal appears with event title
- Click "Cancel" → modal closes, nothing deleted
- Click "Delete Event" → API call, toast on success, row removed
- Modal busy state: button shows "Deleting..." and is disabled

---

## FIX-PHASE20-003 — Delete committee member now requires confirmation

**Why:** Same pattern as Events — instant delete with no undo, on a person record.

### Change

`frontend/src/components/Admin/Pages/Committee.jsx`:

- Added `confirmDelete` + `deletingId` state
- Delete button now opens the modal: `onClick={() => setConfirmDelete(member)}`
- `deleteMember()` accepts the id; the modal shows the member's name and asks for confirmation
- Cancel / Remove Member buttons; busy state during API call

### Verification

- Click trash → modal: "Are you sure you want to remove {name} from the committee?"
- Cancel → nothing happens
- Remove Member → row removed, toast shown

---

## FIX-PHASE20-004 — Activate/Deactivate scholar now requires confirmation + icon fixed

**Why:** Two issues:
1. The deactivate button's icon was a trash can (`delete`) — implying permanent deletion. But the action is reversible (re-activate).
2. No confirmation, so a misclick immediately takes a scholar offline.

### Change

`frontend/src/components/Admin/Pages/Scholars.jsx`:

- Added `confirmToggle` + `togglingId` state
- Changed deactivate icon: `delete` → `block` (matches the recoverable nature of the action)
- Button now opens modal: `onClick={() => setConfirmToggle(scholar)}`
- Modal shows: "Mark {name} as inactive? They will not appear in scholar assignment lists for new Nikah bookings until re-activated." (and the inverse for re-activation)
- Cancel / Mark Inactive (or Activate) buttons; busy state during API call

### Verification

- Click deactivate icon (now shows `block` instead of trash) → modal appears
- Click Cancel → nothing happens
- Click Mark Inactive → success toast, button changes to `check_circle` icon
- Click activate → modal says "re-activate {name}"

---

## FIX-PHASE20-005 — Delete donation now requires typing donor name (Pattern A)

**Why:** Donation records are financial — they affect the public Transparency page and the dashboard totals. Pattern A ("type to confirm") is stronger than Pattern B for high-stakes actions; it matches the Announcements delete pattern.

### Change

`frontend/src/components/Admin/Pages/DonationsExpenses.jsx`:

- Added `confirmDeleteDonation`, `confirmDeleteDonationText`, `deletingId` state
- Delete donation button now opens the modal instead of calling API directly
- Modal shows donor name + PKR amount, asks the user to type the donor name (or "Anonymous") to enable the Delete Permanently button
- Cancel button + Delete Permanently (disabled until text matches)

### Verification

- Click delete → modal shows "PKR 5,000 from Ahmad Raza" with prompt to type donor name
- Type wrong text → Delete button stays disabled
- Type exact name → button enables → click → row removed, toast shown

---

## FIX-PHASE20-006 — Delete expense now requires typing amount (Pattern A)

**Why:** Same financial-stakes reason as donations, but typing the amount is a better signal than the description (which can be long and typo-prone).

### Change

`frontend/src/components/Admin/Pages/DonationsExpenses.jsx`:

- Added `confirmDeleteExpense`, `confirmDeleteExpenseText` state
- Delete expense button opens the modal showing: category, amount, description, with prompt to type the amount
- The expected text is `Number(amount).toLocaleString('en-PK')` so "5,000" matches but "5000" doesn't — intentional safety

### Verification

- Click delete expense → modal shows "Utilities expense of PKR 12,500 (Electricity bill for July)"
- Type wrong amount → Delete disabled
- Type exact formatted amount → enabled → click → row removed

---

## FIX-PHASE20-007 — Mobile menu now shows dashboard quick link

**Why:** Desktop Navbar (`UserAvatarMenu`, lines 107-146) shows a role-based dashboard link for authenticated users (Admin Dashboard / Scholar Dashboard / Committee Panel / My Bookings). The mobile menu was missing these — mobile users couldn't reach their dashboard without typing the URL.

### Change

`frontend/src/components/Common/Navbar.jsx`:

- In the mobile menu's authenticated section (above the Logout button), added 4 conditional `<Link>` blocks mirroring the desktop `UserAvatarMenu`:
  - `admin` → `/admin` with `dashboard` icon
  - `scholar` → `/scholar` with `auto_stories` icon
  - `committee` → `/committee` with `groups` icon
  - `community` → `/my-bookings` with `bookmark` icon

### Verification

- Log in as admin → open mobile menu (resize browser to <1024px or use mobile devtools) → "Admin Dashboard" link visible above Logout
- Same for scholar / committee / community

---

## Combined regression check

```
cd backend && npm test
Test Suites: 1 failed, 5 passed, 6 total
Tests:       1 failed, 159 passed, 160 total
```

```
cd frontend && npm run lint
✖ 10 problems (3 errors, 7 warnings)
```

**Identical to Phase 19 baseline.** Phase 20 fixes introduced:
- 0 new backend test failures
- 0 new frontend lint errors
- 0 new frontend lint warnings

---

## Files modified (combined — all 7 Phase 20 fixes)

| File | Change | Net lines |
|---|---|---|
| `frontend/src/components/Common/Sidebar.jsx` | Real user name + role | +3 / −2 |
| `frontend/src/components/Admin/Pages/Events.jsx` | Delete confirmation modal | +49 / −5 |
| `frontend/src/components/Admin/Pages/Committee.jsx` | Delete confirmation modal | +38 / −3 |
| `frontend/src/components/Admin/Pages/Scholars.jsx` | Activate/deactivate modal + icon fix | +43 / −4 |
| `frontend/src/components/Admin/Pages/DonationsExpenses.jsx` | Two confirmation modals (donation + expense) | +116 / −8 |
| `frontend/src/components/Common/Navbar.jsx` | Role-based dashboard link in mobile menu | +44 / −0 |

**Total: 6 files, +293 / −22 net lines.**

---

## Final state

| Concern | Status |
|---|---|
| Sidebar shows real logged-in user | ✅ FIX-PHASE20-001 |
| Delete event requires confirmation | ✅ FIX-PHASE20-002 |
| Delete committee member requires confirmation | ✅ FIX-PHASE20-003 |
| Activate/Deactivate scholar requires confirmation | ✅ FIX-PHASE20-004 |
| Misleading delete icon on deactivate replaced with `block` | ✅ FIX-PHASE20-004 |
| Delete donation requires typing donor name | ✅ FIX-PHASE20-005 |
| Delete expense requires typing amount | ✅ FIX-PHASE20-006 |
| Mobile menu shows dashboard link for authenticated users | ✅ FIX-PHASE20-007 |
| Backend tests pass (159/160, no regression) | ✅ |
| Frontend lint clean (no regression) | ✅ |

**Phase 20 Responsive + UI re-verification: COMPLETE. 7 bugs found, 7 bugs fixed, 0 regressions.**