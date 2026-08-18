# Phase 8 — Expenses Module: manual testing guide

This phase validates the Expenses CRUD pipeline and the public
transparency page. Seed data has 4 expenses under Al-Noor only; the
other 3 masjids start empty. Scope rules are the same as Events:
each admin only sees their own masjid, the super admin (manager)
sees all 4.

## Prerequisites

- Backend running on `http://127.0.0.1:5000`
- Frontend running on `http://127.0.0.1:5174`
- Seeded with `npm run seed` (creates 4 masjids + manager + admins).
- Seeded expenses live under Masjid Al-Noor only:
  - Mosque Utilities (Electricity & Water) — PKR 8000 — Utilities
  - Staff Salaries – Monthly — PKR 25000 — Salary
  - Renovation Materials — PKR 15000 — Renovation
  - Charity Distribution — PKR 12000 — Charity

## Credentials

| Role | Email | Password | Scope |
|---|---|---|---|
| Super admin (manager) | `manager@emasjid.pk` | `manager123` | All 4 masjids |
| Admin Al-Noor | `admin@emasjid.pk` | `admin123` | Al-Noor only |
| Admin Al-Rahman | `admin2@emasjid.pk` | `admin123` | Al-Rahman only |
| Admin Al-Falah | `admin3@emasjid.pk` | `admin123` | Al-Falah only |
| Admin Al-Taqwa | `admin4@emasjid.pk` | `admin123` | Al-Taqwa only |
| Community | `user@emasjid.pk` | `user1234` | — |

## Test scenarios

### A. Public Expenses on the Transparency page

1. While logged out, visit `http://127.0.0.1:5174/transparency`.
2. The Expenses tab should show the 4 seeded Al-Noor expenses
   newest-first.
3. Use the navbar masjid selector to switch to **Masjid Al-Rahman**.
   The list should empty out (Al-Rahman has no expenses yet).
4. Try the **Category** filter — pick `Salary`. Only the Staff Salaries
   row should remain.
5. Try the **Date range** filter — switch to `Last 3 Months`. All 4
   rows stay visible (seeded dates are recent).

Expected: list filters honor both `mosqueId` and `category`. Empty
list shows the "No expenses found for this filter" message rather
than a blank table.

Failed
### B. Public Summary aggregation

1. With Al-Noor selected, look at the summary card at the top of the
   Expenses tab.
2. Total should equal `8000 + 25000 + 15000 + 12000 = 60000`.
3. The by-category breakdown should list 4 rows (Utilities, Salary,
   Renovation, Charity) with the right amounts.
4. Switch to Al-Falah via the navbar — the summary should drop to
   `total: 0, byCategory: {}`.

Expected: summary respects `mosqueId` query. Empty masjid shows zeros
rather than hiding the card.
passed
### C. Admin CRUD

1. Log in as `admin@emasjid.pk` and go to
   `http://127.0.0.1:5174/admin/donations`.
2. Click the **Expenses** tab (the table title swaps from "Donations"
   to "Expenses" and the "Add Donation" button becomes "Add Expense").
3. Click **Add Expense**.
4. Fill in: description `"Friday Pizza for Volunteers"`, amount `3500`,
   category `Events`, date = today.
5. Click **Create Expense**. The new row appears at the top of the
   table.
6. Click the edit button on your new row, change the amount to `4000`,
   click **Update Expense**. The amount updates in-place.
7. Click the delete button; confirm the browser dialog. The row
   disappears.

Expected: all four CRUD actions succeed. The "addedBy" field is
auto-filled from the admin's token (you don't pick it in the modal).
The new row's `mosqueId` is forced to Al-Noor — you cannot pick
another masjid from the form.

### D. Cross-mosque authorization (the important bit)

Log in as `admin2@emasjid.pk` (Al-Rahman admin) and try in the
browser DevTools console:

```js
const t = JSON.parse(localStorage.user).token
await fetch('http://127.0.0.1:5000/api/expenses?mosqueId=6a831e3469e03811eeb58607', {
  headers: { Authorization: 'Bearer ' + t }
}).then(r => r.json()).then(j => console.log('total:', j.total, 'items:', j.data.length))
```

You should see `total: 0, items: 0` — Al-Rahman admin cannot see
Al-Noor's expenses via direct API call.

Then try a cross-mosque write:

```js
const alNoorExpenseId = j.data[0]._id  // grab an Al-Noor id from a separate admin1 session
await fetch(`http://127.0.0.1:5000/api/expenses/${alNoorExpenseId}`, {
  method: 'PUT',
  headers: { 'Authorization': 'Bearer ' + t, 'Content-Type': 'application/json' },
  body: JSON.stringify({ amount: 99999 })
})
```

Expected: `HTTP 404 — Expense not found`. The Al-Noor row should
remain unchanged (refresh the admin1 page, amount is still 4000).

Then try DELETE on the same id — same 404 result.

### E. Super admin scope

1. Log in as `manager@emasjid.pk`.
2. Go to `http://127.0.0.1:5174/admin/donations`, Expenses tab.
3. Use the navbar masjid selector to switch between Al-Noor,
   Al-Rahman, Al-Falah, and Al-Taqwa — the table re-filters each
   time.

In DevTools, try an unmanaged masjid id:

```js
await fetch('http://127.0.0.1:5000/api/expenses?mosqueId=5f4f4f4f4f4f4f4f4f4f4f4f', {
  headers: { Authorization: 'Bearer ' + t }
}).then(r => r.json()).then(j => console.log(j))
```

Expected: empty result (super admin with the navbar masjid selector
mismatch acts like "no mosque in scope for this query"), or a 400 if
you pass an obviously fake id.

### F. Form validation

Try submitting the Add Expense modal with these payloads and verify
each is rejected with a helpful inline error (or toast) — never a
500:

1. Description empty → "Description is required"
2. Amount = 0 → "Amount must be a positive number"
3. Amount = -100 → same as above
4. Amount = "abc" → same as above
5. Category set to something not in the enum (e.g. `Luxury`) → "Invalid category"
6. Description = `"x"` (1 char, under min 3) → "Description is required"

Expected: every failure surfaces a usable error message; none of
them write a partial record to the database.

### G. Public anonymity — N/A here

Unlike donations, expenses are not anonymous — admins *want* their
work visible. Skip this scenario.

## Notes

- The expenses tab and donations tab share the same
  `/admin/donations` route (DonationsExpenses.jsx). The active tab
  is local component state, not URL-driven, so a refresh always
  lands on the Donations tab. Click the **Expenses** tab again
  after refresh.
- Date filters in the admin table default to **This Month** — if
  you create an expense outside the current month, switch the
  filter to **All Time** (or **This Year**) to see it.
- Categories accepted by the API: `Maintenance`, `Utilities`,
  `Salary`, `Events`, `Charity`, `Renovation`, `Education`,
  `Equipment`, `Other`. Anything else yields 400.
- The `addedBy` field on the seeded rows is the Al-Noor admin. The
  field is set internally from `req.user._id` — clients cannot
  override it via the request body.
- Prefer running scenario D and E in Postman instead of DevTools —
  the request runner makes the 404/200 contrast obvious in the
  Tests tab.
