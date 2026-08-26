# 10 Financial Transparency — Manual Testing Guide

> QA procedure for a professional reviewer. Run against a fresh backend (`npm run seed`) and the latest frontend build. The flow is split into three roles: logged-out public, community donor, and admin (Al-Noor).

## Test setup

1. `cd backend && npm run seed` — recreates Al-Noor + 3 other masjids, 5 donations, 4 expenses, 2 anonymous donations, 1 refunded donation, 1 pending online donation.
2. `cd backend && node server.js` — backend on `http://localhost:5000`. Confirm `[mongo] connected to emasjid` in the log.
3. `cd frontend && npm run dev` — frontend on `http://localhost:5173`.
4. Log in options:
   - `admin@emasjid.pk / admin123` — Al-Noor admin.
   - `manager@emasjid.pk / manager123` — super manager (sees all 4 masjids).
   - Public view — no login, just open `/transparency`.

---

## 1. Public Transparency page (`/transparency`)

### 1.1 Trend cards (BUG-T02 / BUG-T13)

**Steps**
1. Open `/transparency` as a logged-out user.
2. Look at the "Total Donations Received" card and the "Total Funds Utilized" card.

**Expected**
- Each card shows a real signed percentage, e.g. `+20% from last month`, `-15% from last month`, `Flat vs last month`, or `New this month`.
- The icon matches the direction (`trending_up` / `trending_down` / `remove` / `info`).
- The colour is green for positive donation trend, red for negative expense trend, gray for flat.

**How to break it**
- Seed a new donation in the past month so this month > last month → expect positive.
- Seed a new expense so this month < last month → expect negative on the expense card.
- Set both months to 0 → expect "No prior data" with `info` icon.

### 1.2 Tables, filters, and pagination (BUG-T01)

**Steps**
1. Open `/transparency`. The Donation History and Expense History tables should each show 6 rows by default.
2. Open DevTools → Network. Filter `donations` and `expenses`.
3. Click "View All" on each table. Confirm the request includes `limit=100`.
4. Click "Next page" on the donations table. Confirm `page=2`.
5. Change the month filter to `august`. Confirm the request includes `month=august`.

**Expected**
- Public `GET /api/donations?mosqueId=…&page=…&limit=…` (no auth) works.
- `?month=invalidmonth` returns 400 with `Invalid month format. Use full English month name like 'august'.`
- `?mosqueId=not-an-object-id` returns 400.
- "View All" → up to 100 rows; "Collapse" → back to 6 per page.

### 1.3 Anonymous donor masking (security)

**Steps**
1. Seed one donation with `isAnonymous: true`, donorName: "Real Name Hidden".
2. Open `/transparency`.
3. Inspect the response of the public donations endpoint (`GET /api/donations?mosqueId=…`).

**Expected**
- The row shows `Anonymous` in the donor column.
- The JSON response shows `donorName: "Anonymous"`, `email: ""`, `phone: ""`.
- The "Top Donors" card does **not** include the anonymous donor.

### 1.4 Cross-mosque public isolation

**Steps**
1. Switch the active masjid to Al-Noor in the user header.
2. Save a donation as Al-Noor.
3. Switch to a different masjid. Open `/transparency`.

**Expected**
- The Al-Noor donation is not visible in the other masjid's transparency view.
- The `GET /api/donations?mosqueId=<otherMosqueId>` call returns only that masjid's rows.

### 1.5 Donate now (BUG-T06 / BUG-T11)

**Steps**
1. As a logged-out user, open `/donate`, pick `Zakat`, amount `5000`, fill in the form, submit.
2. Complete Stripe test checkout with `4242 4242 4242 4242`.
3. Land on `/donate?success=1&session_id=cs_test_…`.

**Expected**
- A spinner modal "Confirming your donation" appears.
- Within 30s the modal switches to the JazakAllah Khair confirmation with the real amount.
- Reload the page → the donation appears in `/transparency` (after the webhook fires).

**How to break it**
- Submit the form twice in 100ms → only one Stripe session is created (idempotency key).
- Cancel at Stripe (`?canceled=1`) → warning toast, no confirmation modal.

### 1.6 Refunded donations are excluded from the trend

**Steps**
1. Seed a refunded donation: `status: 'refunded'`, amount 100,000, in the current month.
2. Reload `/transparency`.

**Expected**
- The "Total Donations Received" card and `thisMonth` do **not** include the refunded amount (the aggregation `aggregateSummary` filters `status: { $ne: 'refunded' }`).
- The transaction does still appear in the Donation History table (we want a full audit trail), just not in the totals.

---

## 2. Admin Donations & Expenses

### 2.1 Save button double-click (BUG-T04)

**Steps**
1. As `admin@emasjid.pk`, open Admin → Donations & Expenses.
2. Click "Add Donation", fill in `donorName: "Test"`, `amount: 1000`, `type: Sadaqah`, `paymentMethod: Cash`.
3. Double-click Save within 200ms.

**Expected**
- Exactly one row appears (or one new toast).
- The Save button shows "Saving…" and is disabled during the in-flight request.
- All other inputs and the Cancel / × buttons are also disabled.
- The new row is the first item on page 1 (BUG-T05 — optimistic merge).

**How to break it**
- Disable JavaScript in DevTools → form still POSTs once on submit; no double-submit.
- Click Save, then immediately click Cancel → Cancel is disabled, no action.

### 2.2 Cross-mosque admin (BUG-T01, manager scope)

**Steps**
1. As `manager@emasjid.pk`, open Admin → Donations & Expenses.
2. With no filter, the page should list donations across all 4 masjids.
3. In the URL bar, append `?mosqueId=<unmanagedMosqueId>` (a 5th masjid you create on the fly via a test seed).
4. Reload.

**Expected**
- A mosque you do **not** manage returns 403: `You do not manage this masjid`.
- A valid managed masjid returns 200 with only its rows.
- `?mosqueId=not-an-object-id` returns 400.

### 2.3 Edit + delete donation (BUG-T03 / BUG-T15)

**Steps**
1. As `admin@emasjid.pk`, open Admin → Donations & Expenses → Donations tab.
2. Click edit on any row. Change `amount: 5000` → `6000`, add `note: "Updated"`. Save.
3. Click delete on the same row. The confirm modal asks for the donor name; type it exactly. Click "Delete Permanently".

**Expected**
- After edit: row reflects the new amount and shows "Updated" as the description column.
- The row's time stays the original `createdAt` (not `now()`); only `updatedAt` changes.
- After delete: row disappears; total donations count drops by 1.
- Refreshing `/transparency` as a public user reflects the change.
- Anonymous donation delete: confirm modal expects the literal string `Anonymous` (BUG-T12, not yet fixed — only annoys the admin, no security issue).

### 2.4 Edit + delete expense

**Steps**
1. Switch to the Expenses tab.
2. Edit an existing expense, change `description: "Electricity bill"`. Save.
3. Delete an expense. Confirm modal asks for the amount (`toLocaleString('en-PK')`), not the description.

**Expected**
- Confirm input is enabled only when the typed value matches the amount exactly (with thousand separators).
- Deleting a `0` amount expense: the input expects `0` (literal), which still works.

### 2.5 Add an expense with an empty category (BUG-T07)

**Steps**
1. Open the Add Expense modal. Pick Category = Utilities, set amount to 100, leave description blank.
2. Save.

**Expected**
- Server returns 400 with `Description is required` (route validator `body('description').isLength({ min: 3 })`).

### 2.6 Pagination footer

**Steps**
1. With 25 seeded donations, page through the list.
2. Footer should read "Showing 1 to 20 of 25 donations · Page 1 of 2".
3. On page 2, "Previous" is enabled, "Next" is disabled.
4. Filter to a category with 3 donations → "Showing 1 to 3 of 3 donations · Page 1 of 1" and both buttons disabled.

**Expected**
- Footer math uses the server's `total` and `totalPages`, not the local array length.
- `?limit=99999` (BUG-T09) is clamped server-side; footer never shows >100 per page.

### 2.7 Real time + note in the admin table (BUG-T03 / BUG-T15)

**Steps**
1. Seed donations at 09:15 and 14:42.
2. Open the admin page. Each row should show a real time, not `10:30 AM`.
3. Add a donation with note "For new carpet". The row's description column shows "For new carpet".
4. Add another with no note. The row falls back to `Sadaqah contribution`.

**Expected**
- Time format: `9:15 AM` / `2:42 PM` (en-US locale).
- Expense rows show the same time format.

---

## 3. Stripe webhook surface (BUG-T06 / BUG-T10)

**Steps**
1. With Stripe CLI forwarding: `stripe listen --forward-to localhost:5000/api/donations/webhook`.
2. `stripe trigger checkout.session.completed` → donation status becomes `completed`.
3. `stripe trigger charge.refunded` → matching donation `status = 'refunded'`, `refundedAmount` set.
4. `stripe trigger payment_intent.payment_failed` → donation `status = 'failed'`.
5. Send a payload with an invalid signature → 400, "Invalid signature".

**Expected**
- Webhook returns `{ received: true }` for all valid events.
- `aggregateSummary` excludes refunded donations from the totals.

---

## 4. Negative cases / "how to break it" cheatsheet

| Action | Expected |
| --- | --- |
| `GET /api/donations?mosqueId=bad-id` | 400 Invalid mosqueId |
| `GET /api/donations?month=foo` | 400 Invalid month format |
| `POST /api/donations` (committee token) | 403 |
| `POST /api/donations` with `mosqueId` of another masjid | 403 |
| `POST /api/donations/online` with `amount: 50` | 400 Minimum donation amount is PKR 100 |
| `PUT /api/donations/<other-mosque-id>` (admin A) | 404 (no leak) |
| `DELETE /api/donations/<other-mosque-id>` (admin A) | 404 |
| `GET /api/donations/admin` (no token) | 401 |
| `?limit=99999` on admin endpoints | clamped to 100 |
| Stripe webhook with bad signature | 400 |
| Stripe `charge.refunded` for non-existent donation | logged, `received: true` |
| Public route `/api/donations/admin` (no token) | 401 |
| Anonymous donation delete confirm | expects literal `Anonymous` (BUG-T12, low priority) |
