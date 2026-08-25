# 16 Manager Multi-Mosque Module — Manual Testing Guide

**For:** Partner / supervisor
**Time needed:** ~20 minutes
**Browser:** Chrome (any modern browser works)
**Accounts you'll need (all in Sheikhupura, all under ONE super admin):**

| Account | Email | Password | Role |
|---|---|---|---|
| Super admin (manages all 4 masjids) | `manager@emasjid.pk` | `manager123` | manager |
| Admin of Masjid Al-Noor | `admin@emasjid.pk` | `admin123` | admin |
| Scholar of Masjid Al-Noor | `scholar@emasjid.pk` | `scholar123` | scholar |
| Committee of Masjid Al-Noor | `committee@emasjid.pk` | `committee123` | committee |
| Community user of Masjid Al-Noor | `user@emasjid.pk` | `user1234` | community |

The seed creates 4 masjids (Al-Noor, Al-Rahman, Al-Falah, Al-Taqwa) — all in Sheikhupura — and one orphan manager (`pa672189@gmail.com` / `manager123`, 0 masjids) used to test the empty-masjid code path.

---

## Test 1 — Manager login + dashboard (2 min)

**What this tests:** Route guard + minimal dashboard.

1. Open the website homepage `http://localhost:5174/` and confirm the public homepage loads (you should see Masjid Al-Noor's prayer times, hero carousel, and announcements).
2. Open a new tab to `http://localhost:5174/manager/login`.
3. Enter `manager@emasjid.pk` / `manager123` and click **Sign In to Manager Portal**.
4. You should land on `http://localhost:5174/manager` (the Manager Dashboard).
5. **Expected:** Two stat cards (Total Mosques: 4, Active Mosques: 4) and a 4-card grid showing Masjid Al-Noor, Al-Rahman, Al-Falah, Al-Taqwa, each with an "Active" badge.

## Test 2 — Create a new masjid (3 min)

**What this tests:** Manager-only access + new masjid starts **inactive** (per your Q3 answer).

1. From the dashboard, click **Add Mosque** (top right of "Your Mosques" section) or sidebar **Manage Mosques → Add Mosque**.
2. Fill the form:
   - **Mosque Name:** `Masjid Al-Test` (or any name you like)
   - **City:** `Sheikhupura`
   - **Address:** (optional) `Test Address 123`
   - **Phone:** (optional) `0300-0000000`
   - **Email:** (optional) `test@example.pk`
3. Click **Create Mosque**.
4. **Expected:**
   - A success toast: "Mosque created. Now create the first admin for it."
   - The **Create Admin Account** modal auto-opens with the new masjid name in the header.
   - The new masjid appears in the list with an **Inactive** badge (NOT Active).
   - The new masjid is **NOT** visible on the public homepage or in the navbar dropdown (visit `http://localhost:5174/` in another tab to confirm).

## Test 3 — Create the first admin for the new masjid (2 min)

**What this tests:** Super-admin admin-creation endpoint + generated-password display.

1. In the **Create Admin Account** modal (still open from Test 2), fill:
   - **Full Name:** `Test Admin`
   - **Email:** `test.admin@emasjid.pk`
   - **Phone:** (optional)
   - **Password:** (leave blank for auto-generate)
2. Click **Create Admin**.
3. **Expected:**
   - A success toast: "Admin account created. Share the credentials securely."
   - A green confirmation banner shows the email and a random 10-character password (e.g., `a8f3kq9p2x`).
   - **Copy this password** — you'll need it for Test 4 and Test 5.

## Test 4 — New admin can log in only after their masjid is activated (3 min)

**What this tests:** BUG-PHASE16-001 — admins of inactive masjids are blocked at login.

1. **First**, log out of the manager panel (sidebar → Logout).
2. Open `http://localhost:5174/admin/login` in a fresh tab.
3. Try to log in with the new admin's email + the auto-generated password from Test 3.
4. **Expected:** ❌ Login is **rejected** with the error: "Your masjid (Masjid Al-Test) is currently deactivated. Please contact your manager." This is correct — the masjid is still inactive.
5. Go back to the manager tab (log in as `manager@emasjid.pk` / `manager123` if needed), open **Manage Mosques**, find "Masjid Al-Test", click the **Inactive** pill to flip it to **Active**.
6. **Expected:** A success toast: "Status updated." The badge changes to "Active".
7. Try Test 4 step 2-3 again with the same admin credentials.
8. **Expected:** ✅ Login **succeeds** — you land on the admin dashboard.

## Test 5 — Re-activation check: deactivate Al-Noor + verify other roles are blocked (4 min)

**What this tests:** Same fix, different roles. Tests admin + scholar + committee. Community users should NOT be blocked.

1. Log out as the new admin, log back in as `manager@emasjid.pk` / `manager123`.
2. Open **Manage Mosques**, find "Masjid Al-Noor", click the **Active** pill to flip it to **Inactive**.
3. **Expected:** Success toast + badge changes to "Inactive". Al-Noor disappears from the public homepage (`http://localhost:5174/` in another tab) and from the navbar dropdown.
4. Now try logging in as each of the following (open separate incognito tabs to avoid session conflicts):

| Role | Email / Password | Expected |
|---|---|---|
| admin | `admin@emasjid.pk` / `admin123` | ❌ Blocked — "Your masjid (Masjid Al-Noor) is currently deactivated. Please contact your manager." |
| scholar | `scholar@emasjid.pk` / `scholar123` | ❌ Blocked — same message |
| committee | `committee@emasjid.pk` / `committee123` | ❌ Blocked — "Account is deactivated" (this account was seeded with `isActive: false`, so it fails the user check first — also correctly blocked) |
| community | `user@emasjid.pk` / `user1234` | ✅ **Allowed** — community users are not blocked (per your "no scope creep" rule; they have no elevated mutations) |

5. Log back in as the manager, flip Al-Noor back to **Active**.
6. **Expected:** All 4 masjids are now Active again. Public homepage shows Al-Noor content again.

## Test 6 — Edit masjid details (2 min)

**What this tests:** PUT /api/mosques/:id + UI edit modal.

1. In **Manage Mosques**, find any masjid (e.g. Al-Noor), click **Edit**.
2. Change the phone number to something different (e.g. `0321-9999999`), click **Save Changes**.
3. **Expected:** Toast: "Mosque updated successfully." The modal closes. The masjid card now shows the new phone.

## Test 7 — Manage Admins page (2 min)

**What this tests:** Read-only admin list with search + filter.

1. Click **Manage Admins** in the sidebar.
2. **Expected:** A table with all admins across the 4 masjids (Haji Ahmad, Qari Imran, Mufti Bilal, Maulana Tariq Jameel) + the new admin you created in Test 3. Each row shows the masjid name as a pill.
3. Type `Haji` in the search box → only Haji Ahmad's row remains.
4. Clear the search, pick **Masjid Al-Rahman** from the masjid filter → only Qari Imran's row remains.
5. Set filter back to **All masjids**.
6. **Expected:** All admins reappear. No edit/delete buttons in the table (intentional — admins are created from Manage Mosques).

## Test 8 — Logout + role boundary (1 min)

**What this tests:** Logout + cross-role redirect.

1. From the manager dashboard, click **Logout** in the sidebar.
2. **Expected:** Redirected to `http://localhost:5174/manager/login`.
3. Try visiting `http://localhost:5174/manager/mosques` directly.
4. **Expected:** Auto-redirected back to `/manager/login` (the route guard checks `user.role === 'manager'`).

---

## What to report back

For each test, just say:
- ✅ **PASS** (the expected behaviour happened)
- ❌ **FAIL** (something else happened — tell me what you saw)
- ⚠️ **CONFUSING** (worked but unclear — tell me what was unclear)

If any test fails, please include:
- Which test number
- What you did
- What you expected
- What actually happened (error message, screenshot if you can)

---

## Quick reference: file changes from Phase 16

| File | What changed |
|---|---|
| `backend/services/authService.js` | Blocked admin/scholar/committee login if their masjid is `isActive: false` |
| `backend/middleware/auth.js` | Same block, applied on every protected request (mid-session defense) |
| `backend/models/Mosque.js` | `isActive` default changed from `true` to `false` (new masjids start inactive) |
| `frontend/src/components/Manager/Pages/Mosques.jsx` | Create form now sends `isActive: false` (defense in depth with model default) |
| `frontend/src/components/Manager/Pages/Admins.jsx` | Fixed lint error (unescaped apostrophe) |

No other files were touched.
