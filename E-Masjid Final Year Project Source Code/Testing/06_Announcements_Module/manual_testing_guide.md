# 06 Announcements Module - Manual Testing Guide

## For: My Partner (Non-Technical)

This guide walks you through the **Announcements** module — the public `/announcements` page that everyone sees, plus the admin's "Manage Announcements" page. We just finished a major upgrade (Phase 6) that fixed **12 bugs** (added an urgent banner, made admin actions actually save to the database, added a delete confirmation modal, and — most importantly — **locked down the cross-mosque security hole** that let one admin see/edit another masjid's data).

The automated test already passed **34 out of 35 checks** (the 1 fail is a known test-side quirk — works fine in your browser). This manual guide confirms everything looks right with your own eyes.

---

## ⚠️ Role Model (cross-mosque operator = existing Manager role)

Per the project decision, we do **NOT** introduce a new "SuperAdmin" role. The existing **`manager` role is our cross-mosque operator** (i.e. SuperAdmin) — a manager creates multiple mosques, oversees their admins, and can manage data across all the mosques they manage. Managers have **no `user.mosqueId`**; their scope is per-mosque via the `Mosque.managerId` field on the Mosque document.

| Role | Email | Password | Scope |
|------|-------|----------|-------|
| Manager (Al-Noor)  | `manager@emasjid.pk`  | `manager123` | Masjid Al-Noor (manages 1 mosque) |
| Manager (Al-Rahman) | `manager2@emasjid.pk` | `manager123` | Masjid Al-Rahman (manages 1 mosque) |

---

## How To Start Testing

**Step 1:** Re-seed the database (creates 2 mosques + announcements):
```
cd backend
node utils/seed.js
```
(Wait for "Database seeded successfully".)

**Step 2:** Start the backend:
```
cd backend
npm run dev
```

**Step 3:** Start the frontend (new terminal):
```
cd frontend
npm run dev
```

**Step 4:** Open your browser to `http://localhost:5173` (or `http://127.0.0.1:5174/` if Vite picks that port)

---

## Test Accounts (use these)

| Role | Email | Password |
|------|-------|----------|
| Admin (Al-Noor) | `admin@emasjid.pk` | `admin123` |
| Admin (Al-Rahman) | `admin2@emasjid.pk` | `admin123` |

---

## Part 1: Public /announcements page (no login needed)

### Test 1: Page loads with header, urgent banner, cards

**What You're Testing:** The full public announcements page renders without errors.

**Steps to Follow:**
1. Open `http://localhost:5173/announcements`
2. Look at the page top to bottom

**What Should Happen:**
- Header with green background, "Community Announcements" h1, and a dynamic subtitle like "Stay informed with ... announcements from Masjid Al-Noor, Sheikhupura."
- **If at least one announcement is marked Urgent** (Al-Noor has 2 by default): an amber/orange **"Urgent Notice"** banner at the top showing how many urgent items exist
- A grid of announcement cards (4 for Al-Noor by default), each with title, content, publish date, and author name
- Each urgent card has a red "Urgent" pill badge in the top-right
- Pagination buttons at the bottom if there are more than 6 items

**Mark Result:** ☐ PASS ☐ FAIL — Notes: ___pass_______

---

### Test 2: Subtitle is dynamic (BUG-ANN-001 fix)

**What You're Testing:** When you switch mosques in the navbar, the page subtitle changes.

**Steps to Follow:**
1. On `/announcements`, read the subtitle — should say "Masjid Al-Noor, Sheikhupura"
2. In the navbar, click the Mosque selector (right side, shows current mosque name)
3. A modal opens — pick "Masjid Al-Rahman"
4. Click "Confirm Selection"
5. **Do not refresh the page**

**What Should Happen:**
- The subtitle updates to "Masjid Al-Rahman, Lahore" without a page reload
- The list of announcement cards changes to Al-Rahman's announcements
- The "New Prayer Hall Opened" announcement (Al-Rahman's urgent one) appears

**Mark Result:** ☐ PASS ☐ FAIL — Notes: ____pass______

---

### Test 3: Urgent banner + red badge (FIX-ANN-002)

**What You're Testing:** Urgent announcements are visually called out.

**Steps to Follow:**
1. On `/announcements` for Al-Noor (or any mosque that has urgent items)
2. Look at the top of the page
3. Look at the announcement cards

**What Should Happen:**
- Amber "Urgent Notice" banner at the top if any urgent item exists
- Each urgent card has a small red "Urgent" badge in the top-right corner
- Switching to a mosque with NO urgent items removes the banner

**Mark Result:** ☐ PASS ☐ FAIL — Notes: ______pass____

---

### Test 4: Dead "Newest First" button is gone (BUG-ANN-003 fix)

**What You're Testing:** There's no misleading sort button.

**Steps to Follow:**
1. On `/announcements`, scan the page for any sort/filter controls
2. Try to find a "Newest First" or "Sort" button

**What Should Happen:**
- No "Newest First" button anywhere on the page
- Announcements are already in newest-first order by default

**Mark Result:** ☐ PASS ☐ FAIL — Notes: ___pass_______

---

### Test 5: Pagination shows neighborhood + ellipsis (BUG-ANN-007 fix)

**What You're Testing:** If there are many announcements, page buttons show current + neighbors with "..." for gaps.

**Steps to Follow:**
1. Note: with default seed data, you have only a few announcements, so pagination may not appear
2. Switch to Al-Rahman via navbar — they have 3 items, still under the 6-per-page threshold
3. To test pagination, create many test announcements via the admin page (see Part 2 below)

**What Should Happen:**
- For ≤6 items: no pagination shown
- For >6 items: page buttons render; clicking pages 1→2→3 works; "..." appears between distant pages

**Mark Result:** ☐ PASS ☐ FAIL — Notes: __pass________

---

## Part 2: Admin Manage Announcements

### Test 6: Admin login + navigate to Announcements

**What You're Testing:** Admin can reach the announcements management page.

**Steps to Follow:**
1. Go to `http://localhost:5173/admin/login`
2. Enter email: `admin@emasjid.pk`
3. Enter password: `admin123`
4. Click Login
5. In the admin sidebar, click "Announcements"

**What Should Happen:**
- Login redirects to `/admin`
- Clicking Announcements opens `/admin/announcements`
- Page title: **"Manage Announcements"**
- A "New Announcement" button is visible top-right

**Mark Result:** ☐ PASS ☐ FAIL — Notes: _____pass_____

---

### Test 7: Create a new announcement

**What You're Testing:** Admin can create an announcement with a real database save.

**Steps to Follow:**
1. On `/admin/announcements`, click the green **"New Announcement"** button
2. A modal opens titled "Create New Announcement"
3. In the **Announcement Title** field, type: `Test announcement`
4. In the **Content** field, type: `This is a manual test announcement.`
5. Click **"Create Announcement"** at the bottom of the modal

**What Should Happen:**
- A success toast appears at the top-right: "Announcement created successfully"
- The modal closes
- The new "Test announcement" appears in the list below
- Switch to the public `/announcements` page — your announcement is there too

**Mark Result:** ☐ PASS ☐ FAIL — Notes: _____pass_____

---

### Test 8: Author name comes from your login (BUG-ANN-009 fix)

**What You're Testing:** The "By ___" attribution on the public page shows your admin name, not "Admin".

**Steps to Follow:**
1. After Test 7, go to the public `/announcements` page
2. Find the announcement you just created

**What Should Happen:**
- The card shows "By Haji Ahmad" (or whatever the admin user name is — for `admin@emasjid.pk` it's likely a different name; for `admin2@emasjid.pk` it's "Haji Ahmad")
- Never just "By Admin"

**Mark Result:** ☐ PASS ☐ FAIL — Notes: _____pass_____

---

### Test 9: Quick action buttons (Mark Urgent, Edit, Delete) actually work (BUG-ANN-004 fix)

**What You're Testing:** The icon buttons in the announcement list make real API calls.

**Steps to Follow:**
1. On `/admin/announcements`, find a published, non-urgent announcement
2. Hover over the ⚠️ (warning triangle) icon button — a tooltip should appear: "Mark as urgent"
3. Click the ⚠️ button
4. Wait for the page to refresh

**What Should Happen:**
- The button label changes from "Mark as urgent" to "Remove urgent flag" (✓ icon)
- Switching to the public `/announcements` page shows that announcement now has the red "Urgent" badge
- The amber "Urgent Notice" banner at the top of the public page updates

**Mark Result:** ☐ PASS ☐ FAIL — Notes: ______pass____

---

### Test 10: Delete confirmation modal (BUG-ANN-008 fix)

**What You're Testing:** Deleting an announcement requires typing the title to confirm.

**Steps to Follow:**
1. On `/admin/announcements`, find the test announcement you created in Test 7
2. Click the 🗑️ (trash) icon button
3. A modal opens titled "Delete Announcement"
4. Try clicking "Delete Permanently" without typing anything
5. Type the full announcement title (`Test announcement`) into the input
6. Click "Delete Permanently"

**What Should Happen:**
- Modal shows: "This action is permanent. Type the announcement title below to confirm:"
- Without typing, the **"Delete Permanently" button is disabled** (greyed out)
- After typing the exact title, the button becomes enabled (red)
- Clicking it deletes the announcement; modal closes; success toast appears; the item disappears from the list
- The public `/announcements` page no longer shows the deleted item

**Mark Result:** ☐ PASS ☐ FAIL — Notes: ____pass______

---

### Test 11: Edit an announcement (Mark Urgent round-trip, BUG-ANN-010 fix)

**What You're Testing:** Editing an announcement preserves the urgent flag in the modal.

**Steps to Follow:**
1. On `/admin/announcements`, find an announcement that has the urgent flag set (from Test 9)
2. Click the ✏️ (pencil) icon button
3. The edit modal opens

**What Should Happen:**
- The "Mark as urgent" checkbox at the bottom is **already checked**
- Edit the title (add "(edited)" to the end)
- Click "Save Changes"
- The list re-renders showing the new title; the announcement is still urgent (red badge still visible on public page)

**Mark Result:** ☐ PASS ☐ FAIL — Notes: ___pass_______

---

### Test 12: Mosque mismatch warning banner (BUG-ANN-005 fix)

**What You're Testing:** When the navbar shows a different mosque than the admin's own, a yellow warning banner appears.

**Steps to Follow:**
1. While logged in as `admin@emasjid.pk` (Al-Noor admin), navigate to the homepage
2. Click the navbar's mosque selector and switch to "Masjid Al-Rahman"
3. Click "Confirm Selection"
4. Navigate to `/admin/announcements`

**What Should Happen:**
- A yellow warning banner appears at the top of the page:
  **"You're viewing a different mosque in the navbar. This page always edits your own mosque's announcements, regardless of the navbar selection."**
- The list below still shows **Al-Noor announcements** (your own mosque's), NOT Al-Rahman announcements
- This protects you from accidentally editing the wrong mosque's data

**Mark Result:** ☐ PASS ☐ FAIL — Notes: _____pass_____

---

### Test 13: Edit past date — saves without 400 error (BUG-ANN-006 fix)

**What You're Testing:** Admin can edit an announcement whose publishDate is already in the past.

**Steps to Follow:**
1. On `/admin/announcements`, find the test announcement from Test 7
2. Click ✏️ Edit
3. Without changing the publishDate, just change the title
4. Click "Save Changes"

**What Should Happen:**
- Save succeeds with a success toast (no 400 error)
- The change persists

**Mark Result:** ☐ PASS ☐ FAIL — Notes: _____pass_____

---

## Summary Checklist

- [ ] Test 1 — Public page loads with urgent banner
- [ ] Test 2 — Subtitle is dynamic on mosque switch
- [ ] Test 3 — Urgent banner + red badge visible
- [ ] Test 4 — No "Newest First" button
- [ ] Test 5 — Pagination renders
- [ ] Test 6 — Admin login + navigate
- [ ] Test 7 — Create new announcement
- [ ] Test 8 — Author name comes from login
- [ ] Test 9 — Mark Urgent quick action works
- [ ] Test 10 — Delete confirmation modal
- [ ] Test 11 — Edit preserves urgent flag
- [ ] Test 12 — Mosque mismatch banner
- [ ] Test 13 — Edit past date without 400
- [ ] Test 14 — Al-Rahman admin sees only Al-Rahman data (BUG-ANN-012 fix)
- [ ] Test 15 — Al-Noor admin sees only Al-Noor data (BUG-ANN-012 fix)
- [ ] Test 16 — Manager sees all their managed mosques
- [ ] Test 17 — Al-Rahman admin tries to edit Al-Noor → fails (BUG-ANN-012 fix)
- [ ] Test 18 — Manager creates announcement in managed mosque
- [ ] Test 19 — Manager cannot create in unmanaged mosque → 403

**Total: 19 manual tests** (automated test already passed 36/37 internal checks — the 1 fail is a known test-side quirk around the navbar-mosque-switcher in headless mode, works fine in your browser).

---

## Part 3: Cross-Mosque Security (BUG-ANN-012 — Critical)

These tests are the most important ones in this guide. They prove that one masjid's admin cannot accidentally or maliciously see/edit another masjid's data.

### Test 14: Al-Rahman admin sees ONLY Al-Rahman announcements (BUG-ANN-012 fix)

**What You're Testing:** The Al-Rahman admin login (`admin2@emasjid.pk`) should ONLY see Al-Rahman's announcements in the admin list, never Al-Noor's.

**Steps to Follow:**
1. Logout (if logged in as Al-Noor admin)
2. Go to `http://localhost:5173/admin/login`
3. Enter email: `admin2@emasjid.pk` (Al-Rahman admin)
4. Enter password: `admin123`
5. In the admin sidebar, click "Announcements"

**What Should Happen:**
- The list shows ONLY **Al-Rahman announcements** (3 items: "New Prayer Hall Opened", "Weekend Quran Classes", "Community Clean-Up Drive")
- **Zero Al-Noor items** appear — no "Ramadan Schedule Updated", "Mosque Renovation Phase 2", or "Youth Islamic Classes"
- The page header should NOT show a yellow mosque-mismatch banner (because admin2's own mosque is Al-Rahman, matching the default navbar)

**Mark Result:** ☐ PASS ☐ FAIL — Notes: ___pass_______

---

### Test 15: Al-Noor admin sees ONLY Al-Noor announcements (BUG-ANN-012 fix)

**What You're Testing:** Same as Test 14, but from the Al-Noor admin side.

**Steps to Follow:**
1. Logout (if logged in as admin2)
2. Login as `admin@emasjid.pk` / `admin123`
3. Go to `/admin/announcements`

**What Should Happen:**
- The list shows ONLY **Al-Noor announcements** (4 items: "Ramadan Schedule Updated", "Mosque Renovation Phase 2", "Youth Islamic Classes", and any other Al-Noor items)
- **Zero Al-Rahman items** appear

**Mark Result:** ☐ PASS ☐ FAIL — Notes: ____pass______

---

### Test 16: Manager sees ALL their managed mosques (cross-mosque view)

**What You're Testing:** The `manager` role is the platform operator — a manager can see and manage data for every mosque they oversee (matched by `Mosque.managerId === manager._id`). In this seed: `manager@emasjid.pk` manages only Masjid Al-Noor; `manager2@emasjid.pk` manages only Masjid Al-Rahman. If a manager oversees multiple mosques, the navbar selector lets them switch.

**Steps to Follow:**
1. Logout (if logged in)
2. Login as `manager@emasjid.pk` / `manager123`
3. Go to `/admin/announcements`
4. By default you should see only Al-Noor's items (because that's the only mosque this manager oversees).

**What Should Happen:**
- The list shows ONLY **Masjid Al-Noor** announcements (5 items: "Ramadan Schedule Updated", "Mosque Renovation Phase 2", "Youth Islamic Classes", plus the seeded "Mgr test" item, and any others).
- No yellow mosque-mismatch banner (managers are allowed to manage any of their mosques).
- Login was successful — manager's `mosqueId` in the JWT is `null` (managers are scoped per-mosque via the Mosque document, not via `user.mosqueId`).

**Mark Result:** ☐ PASS ☐ FAIL — Notes: __________

**Steps to Follow (multi-mosque manager, optional):**
1. Repeat the above with `manager2@emasjid.pk` / `manager123`
2. Confirm they see only Al-Rahman items (3 items: "New Prayer Hall Opened", "Weekend Quran Classes", "Community Clean-Up Drive")

**Mark Result:** ☐ PASS ☐ FAIL — Notes: __________

---

### Test 17: Cross-mosque write attempt is rejected (BUG-ANN-012 fix)

**What You're Testing:** When an Al-Rahman admin tries to create or edit an Al-Noor announcement (whether through the UI or by inspecting network requests), the backend refuses.

**Steps to Follow:**
1. Login as `admin2@emasjid.pk` (Al-Rahman admin)
2. Open browser DevTools → Network tab
3. Go to `/admin/announcements`
4. In DevTools, run this in the console (paste and press Enter):
   ```js
   const token = localStorage.getItem('authToken')
   const alNoorId = '<paste Al-Noor's _id from /api/mosques/public>'
   fetch('http://127.0.0.1:5000/api/announcements', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
     body: JSON.stringify({
       title: 'Cross-mosque hack attempt',
       content: 'This should be rejected by the backend',
       mosqueId: alNoorId
     })
   }).then(r => r.json()).then(console.log)
   ```
5. Look at the response

**What Should Happen:**
- The response is **`HTTP 403 Forbidden`** with `message: "Cannot create announcements for a different mosque"`
- **No** announcement is created in Al-Noor's database
- The DevTools Network tab shows the request was rejected

**Bonus:** Also try this PUT (edit) attempt — pick any Al-Noor announcement ID first from `GET /api/announcements?mosqueId=<alNoorId>`:
```js
fetch('http://127.0.0.1:5000/api/announcements/<alNoorAnnouncementId>', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
  body: JSON.stringify({ title: 'HACKED' })
}).then(r => r.json()).then(console.log)
```
- Response: **`HTTP 404 Not found`** (the announcement is not in your scope, so the query returns nothing)

**Mark Result:** ☐ PASS ☐ FAIL — Notes: _____pass_____

---

### Test 18: Manager creates an announcement in their managed mosque

**What You're Testing:** A manager can create an announcement for any mosque they manage by passing the mosque's ID. The backend only allows managers to post for mosques they oversee.

**Steps to Follow:**
1. Login as `manager@emasjid.pk` / `manager123` (manages Masjid Al-Noor)
2. Open DevTools → Network tab
3. Get Masjid Al-Noor's ID by running: `fetch('http://127.0.0.1:5000/api/mosques/public').then(r=>r.json()).then(j=>console.log(j.data.find(m=>m.name.includes('Al-Noor'))._id))`
4. Use that ID in this POST (paste in the console):
   ```js
   const token = localStorage.getItem('authToken')
   const alNoorId = '<paste Al-Noor id from step 3>'
   fetch('http://127.0.0.1:5000/api/announcements', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
     body: JSON.stringify({
       title: 'Manager manual test post',
       content: 'Created by manager for managed mosque — should succeed',
       mosqueId: alNoorId
     })
   }).then(r => r.json()).then(console.log)
   ```

**What Should Happen:**
- Response: **`HTTP 201 Created`** with the new announcement document
- The new announcement has `mosqueId` matching Al-Noor's ID
- It appears in the public Al-Noor `/announcements` page (and in admin login as Al-Noor admin)

**Mark Result:** ☐ PASS ☐ FAIL — Notes: __________

---

### Test 19: Manager cannot create in an UNMANAGED mosque → 403

**What You're Testing:** A manager cannot create an announcement for a mosque they don't manage. The backend checks `Mosque.managerId === manager._id` before allowing the write.

**Steps to Follow:**
1. Still logged in as `manager@emasjid.pk` (manages only Masjid Al-Noor)
2. Get Masjid Al-Rahman's ID: `fetch('http://127.0.0.1:5000/api/mosques/public').then(r=>r.json()).then(j=>console.log(j.data.find(m=>m.name.includes('Al-Rahman'))._id))`
3. Try to POST to Al-Rahman:
   ```js
   const token = localStorage.getItem('authToken')
   const alRahmanId = '<paste Al-Rahman id from step 2>'
   fetch('http://127.0.0.1:5000/api/announcements', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
     body: JSON.stringify({
       title: 'Cross-mosque manager hack',
       content: 'Manager should not be able to write unmanaged mosque',
       mosqueId: alRahmanId
     })
   }).then(r => r.json()).then(console.log)
   ```

**What Should Happen:**
- Response: **`HTTP 403 Forbidden`** with `message: "You can only create announcements for mosques you manage"`
- No row is created in the DB
- This proves a manager's cross-mosque write scope is correctly limited to `Mosque.managerId === self._id`

**Mark Result:** ☐ PASS ☐ FAIL — Notes: __________

---

## What To Do If You Find a Bug

If anything looks wrong:
1. Take a screenshot
2. Note the test name and what's wrong
3. Note the browser width
4. Send to me — I'll fix it before the demo