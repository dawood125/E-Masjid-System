# 05 Prayer Timings Module - Manual Testing Guide

## For: My Partner (Non-Technical)

This guide walks you through the **Prayer Times** module — the public `/prayer-times` page that everyone sees, plus the admin's "Manage Prayer Times" page. We just finished a major upgrade (Phase 5) that fixed 10 bugs and added the ability to schedule future dates (e.g., Ramadan 2027).

The automated test already passed **24 out of 24 checks**. This manual guide confirms everything looks right with your own eyes.

---

## How To Start Testing

**Step 1:** Re-seed the database (creates 2 mosques + prayer times for today + 6 days + Ramadan 2027 + Eid ul-Fitr 2027):
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

**Step 5:** Resize the browser to a few widths during testing:
- Desktop ≥1024px
- Tablet 768-1023px
- Phone <768px

---

## Test Accounts (use these)

| Role | Email | Password |
|------|-------|----------|
| Admin (Al-Noor) | `admin@emasjid.pk` | `admin123` |
| Admin (Al-Rahman) | `admin2@emasjid.pk` | `admin123` |

---

## Part 1: Public /prayer-times page (no login needed)

### Test 1: Page loads with all sections

**What You're Testing:** The full public prayer times page renders without errors.

**Steps to Follow:**
1. Open `http://localhost:5173/prayer-times`
2. Look at the page top to bottom

**What Should Happen:**
- **Hero** section with green background, "Prayer Times" heading, today's Islamic + Gregorian date
- **Next Prayer countdown** card (dark green, gold border) showing live HH:MM:SS timer
- **Today's Schedule** with 5-6 prayer cards: Fajr, Sunrise (amber), Dhuhr (or Jumu'ah on Friday), Asr, Maghrib, Isha
- **Weekly Jama'ah Schedule** table with 7 rows, each row showing the date and 5 (or 6 with Sunrise) prayer times
- **Quote section** at the bottom

**Mark Result:** ☐ PASS ☐ FAIL — Notes: __pass_____

---

### Test 2: Today's "Today" badge appears in the weekly table (BUG-PRAYER-001 fix)

**What You're Testing:** The row for today's date in the weekly table has a green "Today" badge.

**Steps to Follow:**
1. On `/prayer-times`, scroll to "Weekly Jama'ah Schedule"
2. Find the row matching today's date
3. Look for a small green "Today" pill next to the date

**What Should Happen:**
- Today's row has a light green background tint
- A small green "Today" pill badge is visible to the right of the date

**Mark Result:** ☐ PASS ☐ FAIL — Notes: _____pass__

---

### Test 3: Sunrise column is shown (BUG-PRAYER-006 fix)

**What You're Testing:** The Sunrise time is displayed (no longer the fake hardcoded 06:45 — it's now per-mosque from the database).

**Steps to Follow:**
1. On `/prayer-times`, look at "Today's Schedule" cards
2. Find the Sunrise card (amber/orange color)
3. Look at the Weekly table — there should be a "Sunrise" column header

**What Should Happen:**
- Today's Schedule has a Sunrise card showing **06:45 AM** (Al-Noor) or **06:30 AM** (Al-Rahman)
- Weekly table has a Sunrise column between Fajr and Dhuhr

**Mark Result:** ☐ PASS ☐ FAIL — Notes: ____pass___

---

### Test 4: Next Prayer countdown shows Jumu'ah on Friday (BUG-PRAYER-003 fix)

**What You're Testing:** On a Friday, the countdown should say "Jumu'ah" not "Dhuhr" before the Jummah time.

**Steps to Follow:**
1. Note today — if today is NOT a Friday, skip this test (you can run it next Friday)
2. If today IS a Friday, look at the Next Prayer countdown card
3. The card should say "Jumu'ah" (with mosque icon), not "Dhuhr"

**What Should Happen:**
- On Friday before 13:00: countdown shows "Jumu'ah" + countdown to 13:00
- On Friday after 13:00: countdown shows the next prayer (Asr)
- On other days: countdown shows Dhuhr/Zuhr as normal

**Mark Result:** ☐ PASS ☐ FAIL — Notes: ____n/a___ (or N/A if not Friday)

---

### Test 5: Mosque switch updates the page (your coverage-gap reminder)

**What You're Testing:** When you switch mosques in the navbar, the prayer times change without page reload.

**Steps to Follow:**
1. On `/prayer-times`, note the Fajr time (e.g., 05:30 for Al-Noor)
2. In the navbar, click the Mosque selector (right side, shows current mosque name)
3. A modal opens — pick the OTHER mosque
4. Click "Confirm Selection"
5. **Do not refresh the page**

**What Should Happen:**
- The hero changes to the new mosque's name/city
- Today's Fajr changes to the other mosque's time (e.g., 05:15 for Al-Rahman)
- Weekly table rows update to the new mosque's schedule
- Sunrise time updates (e.g., 06:30 instead of 06:45)
- No white flash, no page reload

**Mark Result:** ☐ PASS ☐ FAIL — Notes: ____pass___

---

## Part 2: Admin Manage Prayer Times

### Test 6: Admin login + navigate to Prayer Times

**What You're Testing:** Admin can reach the prayer times management page.

**Steps to Follow:**
1. Go to `http://localhost:5173/admin/login`
2. Enter email: `admin@emasjid.pk`
3. Enter password: `admin123`
4. Click Login
5. In the admin sidebar, click "Prayer Times"

**What Should Happen:**
- Login redirects to `/admin`
- Clicking Prayer Times opens `/admin/prayer-times`
- Page title: **"Manage Prayer Times"**

**Mark Result:** ☐ PASS ☐ FAIL — Notes: ___pass____

---

### Test 7: Current Prayer Times cards (live data)

**What You're Testing:** The "Current Prayer Times" section shows live data from the DB (today's row).

**Steps to Follow:**
1. On `/admin/prayer-times`, look at the top section "Current Prayer Times"
2. Read the 7 cards: Fajr, Zuhr, Asr, Maghrib, Isha, Jum'ah, Sunrise

**What Should Happen:**
- 7 cards in a grid (responsive — 4-2-1 on desktop)
- Each card shows the prayer name + the current time
- Sunrise card has amber styling
- Jumu'ah card has primary (dark green) styling
- "Last updated" timestamp below

**Mark Result:** ☐ PASS ☐ FAIL — Notes: ____pass___

---

### Test 8: Editing TODAY's times (the classic flow)

**What You're Testing:** The date picker defaults to today. Editing + saving reflects on the public page.

**Steps to Follow:**
1. On `/admin/prayer-times`, the date picker should show TODAY's date
2. Find the **Fajr** input, change it to **05:42**
3. Click **"Update {today's date}"** button at the bottom
4. Wait for the success toast
5. Open a new tab → `http://localhost:5173/`
6. Scroll to the Prayer Times widget

**What Should Happen:**
- Toast appears: "Prayer times for {today's date} updated successfully!"
- Homepage widget's Fajr shows **5:42 AM**
- No need to manually refresh the homepage — it should reflect within ~1 second

**Mark Result:** ☐ PASS ☐ FAIL — Notes: ____pass___

---

### Test 9: Editing a FUTURE date (your new ask, BUG-PRAYER-005 fix)

**What You're Testing:** The admin can pre-set prayer times for any future date.

**Steps to Follow:**
1. On `/admin/prayer-times`, click the date picker at the top
2. Pick a future date — try **2027-02-20** (which is during Ramadan 2027 and is already seeded)
3. Watch the form auto-populate
4. Find the **Fajr** input, change it to **05:11**
6. Click **"Update 2027-02-20"** button
7. Wait for the success toast

**What Should Happen:**
- Form auto-populates with that date's existing values (Fajr should be 05:05 from Ramadan seed)
- After saving, the toast shows the picked date
- Switching the date to a different one and back shows your edited value persisted

**Mark Result:** ☐ PASS ☐ FAIL — Notes: ___pass____

---

### Test 10: Sunrise field in admin form (BUG-PRAYER-006 fix)

**What You're Testing:** The admin can set a custom Sunrise time per date.

**Steps to Follow:**
1. On `/admin/prayer-times`, find the **Sunrise Time** input (amber-colored input field)
2. Change it to **06:50**
3. Click **Update** (saves the current picked date)
4. Visit the public page

**What Should Happen:**
- The form has a dedicated "Sunrise" section with an amber-styled input
- Saving updates the sunrise time in the DB
- Public `/prayer-times` Sunrise card reflects the new time

**Mark Result:** ☐ PASS ☐ FAIL — Notes: ___pass____

---

### Test 11: Mosque mismatch banner (BUG-PRAYER-004 fix)

**What You're Testing:** When the navbar shows a different mosque than the admin's own, a yellow warning banner appears.

**Steps to Follow:**
1. While logged in as `admin@emasjid.pk` (Al-Noor admin), navigate to the homepage
2. Click the navbar's mosque selector and switch to "Masjid Al-Rahman"
3. Confirm selection
5. Navigate to `/admin/prayer-times`

**What Should Happen:**
- A yellow warning banner appears at the top of the page:
  **"You're viewing a different mosque in the navbar. This form always saves to your own mosque's schedule..."**
- The form below still shows Al-Noor times (your own mosque), NOT Al-Rahman times
- This protects you from accidentally saving Al-Rahman times to the Al-Noor DB row

**Mark Result:** ☐ PASS ☐ FAIL — Notes: __pass_____

---

### Test 12: Editing a PAST date (BUG-PRAYER-011 / Q11)

**What You're Testing:** The admin can correct typos on yesterday or older dates.

**Steps to Follow:**
1. On `/admin/prayer-times`, click the date picker
2. Pick yesterday's date
3. Edit any prayer time
4. Click Update

**What Should Happen:**
- Form auto-populates with yesterday's values (or defaults if not set)
- Save succeeds (no "past dates not allowed" error)
- The public page for yesterday would reflect the change (though yesterday isn't shown in the public weekly table by default)

**Mark Result:** ☐ PASS ☐ FAIL — Notes: __pass_____

---

## Test 13: Responsive check at mobile width (375px)

**What You're Testing:** The prayer times pages work on phone.

**Steps to Follow:**
1. Resize browser to 375px wide
2. Visit `/prayer-times` and `/admin/prayer-times`

**What Should Happen:**
- Today's Schedule prayer cards stack to 1 column (or 2 on slightly wider phones)
- Weekly table scrolls horizontally if needed (you can swipe left/right)
- Countdown timer still readable
- Admin form inputs stack vertically
- Date picker full-width

**Mark Result:** ☐ PASS ☐ FAIL — Notes: ___pass____

---

## Summary Checklist

- [ ] Test 1 — Public page loads
- [ ] Test 2 — Today badge in weekly table
- [ ] Test 3 — Sunrise column shown
- [ ] Test 4 — Jumu'ah countdown (Friday only)
- [ ] Test 5 — Mosque switch updates page
- [ ] Test 6 — Admin login + navigate
- [ ] Test 7 — Current Prayer Times cards
- [ ] Test 8 — Edit today's times
- [ ] Test 9 — Edit a future date (Ramadan 2027 sample)
- [ ] Test 10 — Sunrise field in admin form
- [ ] Test 11 — Mosque mismatch banner
- [ ] Test 12 — Edit a past date
- [ ] Test 13 — Mobile 375px

**Total: 13 manual tests** (automated test already passed 24/24 internal checks).

---

## What To Do If You Find a Bug

If anything looks wrong:
1. Take a screenshot
2. Note the test name and what's wrong
3. Note the browser width
4. Send to me — I'll fix it before the demo