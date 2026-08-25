# 19 Admin Dashboard + Reports Module — Manual Testing Guide

> **For the project partner / FYP examiner.** No technical knowledge required. All tests run in the browser. Estimated time: ~12 minutes.

**Test environment setup:**
- Backend running on `http://localhost:5000`
- Frontend running on `http://localhost:5174`
- Test admin: `admin@emasjid.pk` / `admin123` (Al-Noor admin)

---

## Test 1 — Admin Dashboard loads with correct numbers (2 min)

**What we're testing:** When you log in as the Al-Noor admin, the Dashboard page should show 4 stat cards (Total Donations, Total Expenses, Pending Nikah, Upcoming Events) with non-zero numbers.

### Steps

1. Open `http://localhost:5174/admin/login`.
2. Log in as `admin@emasjid.pk` / `admin123`.
3. You should land on `/admin/dashboard`.
4. Look at the 4 stat cards:
   - **Total Donations:** should be ~PKR 35,400 (from prior test donations)
   - **Total Expenses:** should be ~PKR 60,000
   - **Pending Nikah:** should show some number (the count of pending nikah bookings for Al-Noor)
   - **Upcoming Events:** should show the count of events happening in the next 7 days

### Verification

5. Below the 4 stat cards you should see:
   - **Quick Actions** grid (6 buttons: Add Donation, Record Expense, New Announcement, Create Event, Update Prayer Times, Add Scholar)
   - **Recent Donations** section (top 3 by date)
   - **Recent Expenses** section (top 3 by date)
   - **Financial Summary** section (Total Income, Total Expenses, Current Balance)

6. **Verify the numbers match** between the Total Donations stat card and the Total Income in the Financial Summary. They should be identical.
7. **Verify the balance** = Total Donations − Total Expenses = PKR 35,400 − PKR 60,000 = **PKR −24,600** (negative balance is fine — just reflects current test data state)

### Expected result

✅ **Pass:** Dashboard loads cleanly, all 4 stat cards show non-zero numbers, no fake "+12% this month" labels visible.

❌ **Fail:** Dashboard doesn't load, OR numbers are NaN, OR fake trend labels still appear → flag for dev investigation.

---

## Test 2 — Admin scope: cannot view other masjid's data via API (3 min, requires browser devtools)

**What we're testing:** The Al-Noor admin should NOT be able to fetch Al-Rahman's expenses/donations via the admin endpoint, even if they craft a request manually.

### Steps

1. Log in as `admin@emasjid.pk` / `admin123` in the browser.
2. Open browser devtools (press F12) → **Console** tab.
3. Find your JWT token. Easiest way:
   - In devtools, go to **Application** tab → **Local Storage** → `http://localhost:5174` → look for the `token` key (or similar auth key)
   - Copy the token value
4. In devtools console, paste this (replace `YOUR_TOKEN` with the actual token):

```javascript
const token = 'YOUR_TOKEN';

fetch('http://localhost:5000/api/expenses/admin?mosqueId=PUT_AL_RAHMAN_ID_HERE', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(d => console.log('Result:', d));
```

5. You need Al-Rahman's ObjectId. To find it: ask the developer OR query:
```javascript
fetch('http://localhost:5000/api/mosques', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(d => console.log(JSON.stringify(d, null, 2)));
```
Then find the entry for "Masjid Al-Rahman" in the response, copy its `_id` value.

6. Now retry the first fetch with Al-Rahman's id.

### Expected result

You should get HTTP **403** with a message like `"Cannot view expenses for a different mosque"`.

✅ **Pass:** 403 — admin scope enforced.

❌ **Fail:** 200 with Al-Rahman expenses in the response → CRITICAL scope leak, flag immediately.

### Same test for donations

7. Repeat the test using `/api/donations/admin?mosqueId=AL_RAHMAN_ID`:

```javascript
fetch('http://localhost:5000/api/donations/admin?mosqueId=PUT_AL_RAHMAN_ID_HERE', {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json()).then(d => console.log('Result:', d));
```

✅ **Pass:** 403 — same scope enforcement.

❌ **Fail:** 200 → critical scope leak.

---

## Test 3 — Donations + Expenses page with month filter (3 min)

**What we're testing:** Navigate to `/admin/donations`, switch the date filter, see the totals change accordingly.

### Steps

1. As `admin@emasjid.pk`, navigate to `/admin/donations`.
2. At the top of the page, you'll see 3 stat cards: **Total Donations (Income)**, **Total Expenses (Spending)**, and **Net Balance**.
3. Just below, find the date filter dropdown (labeled "Date Range" or similar) — it has options: This Month, Last Month, Last 3 Months, This Year, Last Year.
4. The default should be **"This Month"**.
5. Note the totals shown.
6. Switch the dropdown to **"This Year"**.
7. The totals should change (likely get bigger, since "this year" includes more data than "this month").
8. Switch to **"Last 3 Months"**.
9. Totals should show data from approximately the last 3 months.
10. Switch to **"Last Year"**.
11. Totals should show 2025 data (likely 0 if no donations were made last year).

### Expected result

✅ **Pass:** Totals change as you switch filters. No fake "+12% vs last month" labels appear next to the totals.

❌ **Fail:** Totals don't change between filters → client-side filter broken.

❌ **Fail:** Fake "+12% vs last month" labels still visible → fix wasn't applied.

---

## Test 4 — Download CSV report (2 min)

**What we're testing:** The "Download Report" / "Download CSV" button produces a valid CSV file with all sections.

### Steps

1. As `admin@emasjid.pk`, navigate to `/admin/donations`.
2. Pick a date filter (any option — "This Year" is fine).
3. Scroll down to find the **"Download Report"** or **"Download CSV"** button (usually near the totals section or bottom of the page).
4. Click it. Your browser will download a file named like `e-masjid-report-Masjid-Al-Noor-2026-08-25.csv`.
5. Open the downloaded file in:
   - **Excel** (double-click on Windows)
   - **OR** a text editor (Notepad, VS Code)

### Verification (Excel)

6. Excel should auto-detect UTF-8 encoding and show:
   - Title row: `E-Masjid Financial Report`
   - Mosque row: `Mosque: Masjid Al-Noor`
   - Generated date row
   - Filters row showing what you picked
   - Empty rows
   - **DONATIONS SUMMARY** section header + total + by-type breakdown
   - **TOP DONORS** section (rank, donor, total amount, count) — note: anonymous donors are NOT in this list (expected)
   - **RECENT DONATIONS** section (date, donor, type, method, amount, anonymous flag) — anonymous donors show as "Anonymous" (no real name)
   - **EXPENSES SUMMARY** section + by-category breakdown
   - **RECENT EXPENSES** section (date, category, description, amount)
   - **NET BALANCE** section showing total donations, total expenses, balance

✅ **Pass:** All 7 sections present, totals match what's shown on screen, anonymous masking works (no real donor names leaked).

❌ **Fail:** File is blank → report generation broken.

❌ **Fail:** File is malformed / unreadable → check BOM and CSV escaping.

❌ **Fail:** Anonymous donors show real names → privacy bug, flag immediately.

---

## Test 5 — Verify backend rejects bad month format (1 min, requires devtools)

**What we're testing:** If someone tries to use a malformed month value in the API, they should get a clear 400 error, not a confusing "Resource not found".

### Steps

1. Logged in as `admin@emasjid.pk`, open devtools console.
2. Run:
```javascript
const token = 'YOUR_TOKEN';
fetch('http://localhost:5000/api/donations/admin?month=2026-08&limit=5', {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json()).then(d => console.log(d));
```
3. You should get HTTP 400 with message: `"Invalid month format. Use full English month name like 'august'."`

### Expected result

✅ **Pass:** 400 with the clear validation message above.

❌ **Fail:** 200 with empty data → validation not enforced.

❌ **Fail:** 400 with "Resource not found" → fix wasn't applied.

---

## What to look out for

| Symptom | Likely cause | What to do |
|---|---|---|
| Dashboard shows no numbers (all zeros) | Wrong masjidId selected OR no data for that masjid | Pick Masjid Al-Noor in dropdown, ensure data exists |
| "+12% this month" or "+5% this month" labels appear | Fix not applied | Re-run Phase 19 fixes |
| 403 when accessing own masjid | Token expired or wrong role | Re-login as `admin@emasjid.pk` / `admin123` |
| CSV file opens but is one long line | Excel opened with wrong encoding | Re-save with UTF-8 BOM (the file already has BOM, so this should not happen) |
| Donations/Expenses totals don't change with date filter | Client-side filter broken | Check `DonationsExpenses.jsx` useMemo on lines 111-125 |
| Top Donors list shows anonymous donors | Aggregation filter missing `isAnonymous:false` | Flag for dev investigation |

---

## Reporting

When you've run the tests, report back:

- ✅ All passed → move on to next phase
- ❌ One or more failed → describe what you saw (screenshot if possible), which test number, and any toast messages / error text / unexpected numbers

The developer will investigate any failures.