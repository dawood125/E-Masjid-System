# 21 Non-Functional Requirements — Bugs Fixed

> Phase 21 — 2026-08-25
>
> 15 NFR bugs found in the audit were fixed end-to-end across backend + frontend. Code-style and "no real bug" findings remain in the backlog (see `bugs_found.md`). This file records what was actually shipped.

## At a glance

| # | ID | NFR area | What broke | Where we fixed it |
|---|---|---|---|---|
| 1 | BUG-001 | Performance | Public announcements endpoint returned every record, no pagination | `services/announcementsService.js`, `controllers/announcementsController.js` |
| 2 | BUG-002 | Performance | Public events endpoint returned every record | `services/eventsService.js`, `controllers/eventsController.js`, `routes/events.js` |
| 3 | BUG-003 | Performance | Fund requests list did N+1 lookups + returned everything | `services/fundRequestsService.js`, `controllers/fundRequestsController.js` |
| 4 | BUG-004 | Performance | Home.jsx asked the full list with no `?limit` | `components/User/Pages/Home.jsx` |
| 5 | BUG-005 | Performance | Admin donations/expenses endpoints didn't exist, frontend used public endpoint | `routes/donations.js`, `routes/expenses.js`, `services/*`, `controllers/*`, `utils/api.js`, `components/Admin/Pages/DonationsExpenses.jsx` |
| 6 | BUG-006 | Security | Hardcoded weak `JWT_SECRET` in `.env` | `.env`, `.env.example`, `utils/generateToken.js`, `middleware/auth.js` |
| 7 | BUG-007 | Security | JWT only in localStorage (XSS-readable) — moved to httpOnly cookie + Bearer dual-auth | `controllers/authController.js`, `routes/auth.js`, `server.js`, `middleware/auth.js`, `utils/api.js`, `context/AuthContext.jsx` |
| 8 | BUG-008 | Reliability | MongoDB connection had no retry/reconnect handlers | `config/db.js` |
| 9 | BUG-009 | Reliability | Stripe checkout had no idempotency, could create double PendingDonation | `services/donationsService.js`, `models/Donation.js` |
| 10 | BUG-010 | Reliability | Webhook only handled `checkout.session.completed` — refunds + failed payments were dropped | `services/stripeWebhookService.js`, `models/Donation.js` |
| 11 | BUG-011 | Reliability | Donate page assumed success without confirming Stripe webhook | `components/User/Pages/Donate.jsx`, `utils/api.js` (already had `getDonationBySession`) |
| 12 | BUG-012 | Usability | Modal "Save" button could be double-clicked creating duplicate records | `components/Admin/Pages/DonationsExpenses.jsx` |
| 13 | BUG-013 | Usability | Transparency page showed hardcoded "+12% from last month" | `services/donationsService.js`, `services/expensesService.js`, `components/User/Pages/Transparency.jsx` |
| 14 | BUG-014 | Reliability | Race condition: two committee members could double-vote on the same fund request | `services/fundRequestsService.js` |
| 15 | BUG-015 | Usability | Donation rows in admin showed hardcoded "10:30 AM" + `${type} contribution` | `components/Admin/Pages/DonationsExpenses.jsx`, `models/Donation.js` |

---

## BUG-001 — Public announcements endpoint had no pagination

**Before:** `Announcement.find({}).sort(...)` returned every announcement document with no `.lean()` / `.select()`.

**After (`backend/services/announcementsService.js`):**
- `clampLimit` / `clampPage` helpers enforce `1 ≤ limit ≤ 100` and `page ≥ 1`.
- `listPublic()` and `listForCaller()` now run `find(...).lean().select(...).skip().limit()` in parallel with `countDocuments()` via `Promise.all`.
- Returns `{ data, total, page, totalPages }`; controllers spread the page so `res.data` remains the array the frontend already consumes.

**Verified:** `GET /api/announcements?page=1&limit=3` returns `{ success: true, data: [...], total, page: 1, totalPages }`.

---

## BUG-002 — Public events endpoint had no pagination + no registrations endpoint

**Before:** every event was returned; admins had no way to see who registered.

**After:**
- `listPublic` / `listForCaller` paginate the same way BUG-001 does, with `.select('title date time location image category description maxParticipants requiresRegistration mosqueId registeredUsers')` and computed `registeredCount`.
- New `getRegistrations(id)` returns the populated list of registered users.
- New route `GET /api/events/:id/registrations` (admin/manager/scholar/committee).

---

## BUG-003 — Fund requests list did N+1 lookups + returned every row

**Before:** `find().populate('reviewedBy').populate('finalizedBy')` issued one round-trip per request.

**After:** `listForCaller(user, query)` runs a single `$facet` aggregation with two `$lookup` stages to fold `reviewedBy`, `finalizedBy` and `voteMembers.member` into one query, paginated with `$skip` + `$limit`. Filter `pending` / `approved` / `rejected` works as before. Returns `{ data, total, page, totalPages }`.

---

## BUG-004 — Home.jsx asked for full lists

**Before:** `Home.jsx` fetched `/api/events` and `/api/announcements` without `?limit` — pulled every record.

**After:** when a mosque is selected, `Home.jsx` now requests `mosqueId=…&limit=2&page=1` for events and `&limit=3&page=1` for announcements. The remaining pagination comes from `Pagination` controls in their respective sections.

---

## BUG-005 — Admin donations/expenses endpoints + pagination UI

**Before:** the admin Donations & Expenses page called the public `/api/donations` and `/api/expenses` endpoints. There were no admin endpoints at all. Frontend filtered / paginated in-memory after fetching one big array, so 500 records would lock the browser tab.

**After:**

Backend (`backend/services/donationsService.js` + `backend/routes/donations.js`):
- New `GET /api/donations/admin` (admin/manager) and `GET /api/expenses/admin` (admin/manager) return `{ data, total, page, totalPages }`.
- Admin scope uses `user.mosqueId`; manager scope accepts `?mosqueId=` and checks it against `managerId`.
- `GET /api/donations/by-session/:sessionId` is used for polling (BUG-011).

Frontend (`frontend/src/utils/api.js` + `frontend/src/components/Admin/Pages/DonationsExpenses.jsx`):
- New `getAdminDonations`, `getAdminExpenses` methods.
- Page size bumped from 5 to 20; type / category filters drive server-side `?type=` / `?category=` params.
- Pagination footer now shows "Showing X to Y of Z donations · Page N of M".

---

## BUG-006 — Weak hardcoded `JWT_SECRET`

**Before:** `JWT_SECRET=emasjid_jwt_secret_key_change_in_production_2026` — guessable, no rotation procedure.

**After:**
- New secret generated with `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` → 64-char URL-safe random string.
- Stored in `.env` (already ignored by `.gitignore`).
- `.env.example` now documents how to generate a secret, the 90-day rotation cadence, and a `JWT_SECRET_OLD` graceful-rollout procedure.
- `backend/utils/generateToken.js` exports a `verifyToken()` helper that tries `JWT_SECRET` first, falls back to `JWT_SECRET_OLD` so tokens issued under the previous secret keep validating during the rotation window.

---

## BUG-007 — JWT moved to httpOnly cookie (with Bearer header still supported)

**Before:** the JWT was only in `localStorage` — any XSS could read it.

**After:**
- `backend/controllers/authController.js` sets `emasjid_token` httpOnly cookie on login / register / refresh. `logout` clears it.
- `backend/server.js` parses cookies into `req.cookies` (lightweight in-line parser, no extra dep).
- `backend/middleware/auth.js` reads the cookie as a fallback when the `Authorization: Bearer` header is absent.
- `frontend/src/utils/api.js` now uses `credentials: 'include'` on every fetch, and exposes `api.logout()` which posts to `/api/auth/logout` so the cookie is cleared server-side.
- `frontend/src/context/AuthContext.jsx`'s `logout()` calls `api.logout()` first, then clears local state.

Verified manually:
- `POST /api/auth/login` returns `Set-Cookie: emasjid_token=...; HttpOnly; SameSite=Lax` (lax in dev, strict in prod).
- Subsequent `GET /api/donations/admin` with the cookie alone (no Authorization header) returns 200.
- `POST /api/auth/logout` returns `Set-Cookie: emasjid_token=; Max-Age=0`.

---

## BUG-008 — MongoDB retry/reconnect handlers

**Before:** a single `mongoose.connect()` with no retries; no listeners on `disconnected` / `reconnected` / `error`.

**After (`backend/config/db.js`):**
- `connectWithRetry(uri, attempt)` retries up to 5 times with exponential backoff (2s, 4s, 6s, 8s, 10s).
- `attachConnectionHandlers()` logs `connected`, `disconnected`, `reconnected`, `error`, `close` events.
- `SIGINT` handler closes the connection cleanly.
- Server logs `[mongo] connected to <dbname>` on first boot.

Verified live: server logs `[mongo] connected to emasjid` immediately on start.

---

## BUG-009 — Stripe checkout had no idempotency / no PendingDonation

**Before:** two clicks on "Donate" could create two Stripe sessions → two donations / no pre-write for the success page.

**After (`backend/services/donationsService.js`):**
- `createStripeCheckout()` generates `crypto.randomBytes(12).toString('hex')` → `idempotencyKey`.
- Pre-creates a `Donation` with `status: 'pending'` and `stripeSessionId: idempotencyKey` (so BUG-011 polling can find it).
- Stripe session receives `client_reference_id: idempotencyKey` and the same string as `idempotencyKey` in the `stripe.checkout.sessions.create(..., { idempotencyKey })` options — Stripe will return the existing session if a duplicate request is replayed.
- Updates the pre-created donation's `stripeSessionId` to the real session.id once Stripe returns.
- `Donation` model gained `status`, `stripeSessionId` (unique, sparse), `stripePaymentId`, `stripeChargeId`, `stripeRefundId`, `refundedAmount` fields plus the `status` index.

---

## BUG-010 — Webhook only handled `checkout.session.completed`

**Before:** refunds + failed payments were silently dropped.

**After (`backend/services/stripeWebhookService.js`):**
- `processEvent()` now dispatches by event type:
  - `checkout.session.completed` → `handleCheckoutCompleted()` (existing logic, but now looks up the pre-created pending donation via `metadata.donationId` or `client_reference_id` and flips it to `completed`, or falls back to creating one).
  - `charge.refunded` → `handleChargeRefunded()` sets `status: 'refunded'`, records `stripeChargeId`, `stripeRefundId`, `refundedAmount`.
  - `payment_intent.payment_failed` → `handlePaymentFailed()` sets `status: 'failed'`.
- Errors during event processing are logged and a `processed: false` flag returned without throwing — Stripe will retry the event.

---

## BUG-011 — Donate page didn't confirm Stripe webhook fired

**Before:** success modal opened immediately on `?success=1`, even if Stripe hadn't actually completed the charge.

**After (`frontend/src/components/User/Pages/Donate.jsx`):**
- New `useEffect` on mount reads `searchParams.get('success')` and `searchParams.get('session_id')`.
- When both are present, a spinner modal ("Confirming your donation") opens and `setInterval` polls `api.getDonationBySession(sessionId)` every 1.5s (max 20 attempts ≈ 30s).
- As soon as the donation status becomes `completed`, the spinner closes and the JazakAllah Khair modal opens with the real amount and Stripe payment intent id.
- If the status becomes `failed` or the poll times out, an error modal explains the situation and points the user to retry / contact the masjid.
- Success_url in `createStripeCheckout` now appends `&session_id={CHECKOUT_SESSION_ID}` so we always have the id.

---

## BUG-012 — Save button in Donations/Expenses modal could be double-clicked

**Before:** the modal's "Save" button had no disabled state — a fast double-click created two records.

**After (`frontend/src/components/Admin/Pages/DonationsExpenses.jsx`):**
- `submitting` state + `submittingRef` flag both prevent re-entry.
- Save button shows "Saving…" while in flight, is `disabled`, and has `disabled:opacity-60 disabled:cursor-not-allowed`.
- All form inputs and the Cancel / × close button are also disabled while submitting.

---

## BUG-013 — Transparency page showed hardcoded "+12%"

**Before:** "Total Donations Received" card displayed a fixed "+12% from last month" line.

**After:**
- `backend/services/donationsService.js#aggregateSummary` now returns `thisMonth` and `lastMonth` totals in addition to the existing fields. Same for `expensesService.js`. The aggregation excludes refunded donations for accuracy.
- `frontend/src/components/User/Pages/Transparency.jsx` computes `computeTrend(current, previous)`:
  - previous ≤ 0 → "New this month" or "No prior data".
  - pct < 1 → "Flat vs last month".
  - else signed percentage with up/down icon and matching green / red / gray tone.
- The Expenses card now shows the same computed trend instead of "Maintenance & Operations".

---

## BUG-014 — Race condition allowed double-voting on fund requests

**Before:** the controller did `findById` → push vote → `save()`, two concurrent votes could both pass the `votes.member` check and both get inserted.

**After (`backend/services/fundRequestsService.js`):**
- The vote is now a single atomic MongoDB update:

```js
const updated = await FundRequest.findOneAndUpdate(
  { _id: id, status: 'pending', 'votes.member': { $ne: user._id }, mosqueId: user.mosqueId },
  { $push: { votes: newVote } },
  { new: true }
);
```

- If `updated` is `null` we look up why (already voted, finalized, wrong mosque) and throw a 4xx with a precise message.

---

## BUG-015 — Hardcoded time / description in admin donations table

**Before:** every row showed `10:30 AM` and `${donation.type} contribution` regardless of the actual record.

**After (`frontend/src/components/Admin/Pages/DonationsExpenses.jsx`):**
- New `formatRecordTime(dateString)` returns `h:mm AM/PM` based on `createdAt` (or `—` if missing).
- New `recordNote(item, activeTab)` prefers `item.note`, then `item.description`, then falls back to `${type} contribution` / `${category} expense`.
- A `note` field has been added to the donation create / edit form and is now stored on the donation (`Donation` model gained `note: { type: String, trim: true, maxlength: 300 }`).
- Expense rows now also show the real `createdAt` time.

---

## Manual test runs

See `manual_testing_guide.md` for step-by-step instructions per bug. The smoke run on a fresh backend boot:

- `GET /api/health` → 200
- `POST /api/auth/login` (admin@emasjid.pk / admin123) → 200 + httpOnly cookie + token in JSON
- `GET /api/donations/admin?page=1&limit=5` (with cookie or Bearer) → 200 with `{ data, total, page, totalPages }`
- `GET /api/donations/summary?mosqueId=...` → `{ totalDonations, byType, thisMonth, lastMonth }`
- `GET /api/expenses/summary?mosqueId=...` → `{ totalExpenses, byCategory, thisMonth, lastMonth }`
- `GET /api/donations/by-session/cs_test_nonexistent` → 404 with `Donation not found yet`
- `POST /api/auth/logout` → 200 + clears cookie
- `node server.js` startup log includes `[mongo] connected to emasjid`