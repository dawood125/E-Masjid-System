# Phase 8 — Expenses Module: bugs fixed

## Fix list

### F1 — Added category filter chips for expenses

**Bug:** B1
**Files touched:**
- `frontend/src/components/User/Pages/Transparency.jsx`
- `frontend/src/utils/report.js` (created — CSV helper)
- `backend/services/expensesService.js` (added `month` filter)

**Change:** Added a row of category chip buttons (Maintenance,
Utilities, Salary, Events, Charity, Renovation, Education,
Equipment, Other) below the donation chips. Selecting a chip
filters the expenses list via the `category` query param. The
month filter was also wired to the expenses API (it was only
applied to donations before). A "Reset (N)" button shows when
any filter is active.

**Verification:** Live smoke confirmed `category=Salary` returns 1
row, `category=Utilities` returns 1 row, `month=august` returns
all 4 seeded rows.

---

### F2 — View All loads up to 100 rows

**Bug:** B2
**Files touched:**
- `frontend/src/components/User/Pages/Transparency.jsx`

**Change:** View All now sets a `viewAll` flag that swaps the API
`limit` from 6 to 100 and hides the pagination controls. A new
"Collapse" button appears to revert to paginated view.

---

### F3 — Download Report generates a sectioned CSV

**Bug:** B3
**Files touched:**
- `frontend/src/components/User/Pages/Transparency.jsx`
- `frontend/src/utils/report.js` (created)

**Change:** Download Report now generates a CSV file with these
sections in order:
1. Header (mosque name, generated timestamp, active filters)
2. Donations Summary (total + by type)
3. Top Donors
4. Recent Donations (date, donor, type, method, amount, anonymous)
5. Expenses Summary (total + by category)
6. Recent Expenses (date, category, description, amount)
7. Net Balance

Each section is separated by a blank row. Currency is formatted
with `PKR` prefix and thousand separators. Dates use ISO
`YYYY-MM-DD`. Anonymous donors display as `Anonymous`. A BOM (﻿)
is prepended so Excel detects UTF-8 correctly.

**Filename:** `e-masjid-report-{mosque-name}-{YYYY-MM-DD}.csv`

---

### F4 — Switched SMTP from SendGrid to Gmail

**Bug:** B4
**Files touched:**
- `backend/utils/sendEmail.js` (rewritten — Gmail SMTP only)
- `backend/package.json` (removed `@sendgrid/mail`)
- `backend/.env` (replaced SendGrid + Mailtrap vars with Gmail vars)
- `backend/.env.example` (rewritten without comments)

**Change:** Removed the entire SendGrid provider block from
`sendEmail.js`. Kept only the Nodemailer SMTP path. Gmail SMTP
config:
- `EMAIL_HOST=smtp.gmail.com`
- `EMAIL_PORT=587` (STARTTLS)
- `EMAIL_USER=dawood.bhatti8812@gmail.com`
- `EMAIL_PASS=<app password>` (16 chars with spaces stripped)
- `EMAIL_FROM=dawood.bhatti8812@gmail.com`
- `EMAIL_FROM_NAME=E-Masjid System`

The existing `stripMailPassword` helper already handles the spaces
in the app password.

**Verification:** End-to-end forgot-password test sent a real reset
email to `dawood.bhatti8812@gmail.com`. No SMTP errors in backend
log.

---

### F5 — City filter now uses substring match

**Bug:** B5
**Files touched:**
- `backend/services/mosquesService.js`

**Change:** Removed the `^...$` anchors from the city regex:
```js
filter.city = new RegExp(escapeRegex(sanitizeString(city)), 'i');
```

**Verification:** Live smoke confirmed typing "sheikh" matches all
4 masjids (all in Sheikhupura). "Lahore" returns 0 (no matches in
seed). "xyz" returns 0.

---

### F6 — Cleaned up .env + .env.example

**Files touched:**
- `backend/.env`
- `backend/.env.example`

**Change:** Removed:
- All SendGrid vars (`SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`,
  `SENDGRID_FROM_NAME`)
- All Mailtrap fallback vars (`EMAIL_HOST`, `EMAIL_PORT`,
  `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM` — old ones)
- All comment lines and section dividers

Kept: `NODE_ENV`, `PORT`, `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRE`,
`CLIENT_URL`, `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`,
`STRIPE_WEBHOOK_SECRET`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`,
`EMAIL_PASS`, `EMAIL_FROM`, `EMAIL_FROM_NAME`.

`package.json` no longer depends on `@sendgrid/mail`.

---

## Commit hashes

(Pending — user will commit after retest.)
