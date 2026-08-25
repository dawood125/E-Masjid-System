# 21 NFRs — Manual Testing Guide

> How a professional QA would exercise each of the 15 Phase 21 fixes end-to-end. Run against a freshly seeded backend (`npm run seed`) and the latest frontend build.

## Test setup

1. `cd backend && npm run seed` — recreates Al-Noor + 3 other masjids, committee, scholars, donations and expenses.
2. `cd backend && node server.js` — backend on `http://localhost:5000`. Watch for `[mongo] connected to emasjid` in the log.
3. `cd frontend && npm run dev` — frontend on `http://localhost:5173` (or whichever port Vite picks).
4. Log in with `admin@emasjid.pk / admin123` (Al-Noor admin), or use `manager@emasjid.pk / manager123` to test manager scope.

---

## BUG-001 / BUG-002 — Pagination works

**Steps**
1. Open `http://localhost:5173/` as a logged-out user.
2. Open DevTools → Network tab.
3. Filter for `announcements` and `events` calls.
4. Verify request URLs include `mosqueId=…&limit=…&page=…`.

**Expected**
- Request: `GET /api/announcements?mosqueId=...&limit=3&page=1` returns at most 3 records.
- Request: `GET /api/events?mosqueId=...&limit=2&page=1` returns at most 2 records.
- Total / page / totalPages fields are present in the JSON response.

**How to break it**
- `?limit=999` → server clamps to 100.
- `?limit=-5` → server clamps to 1.
- `?page=abc` → server clamps to 1.

---

## BUG-003 / BUG-014 — Fund requests list + atomic vote

**Steps**
1. Log in as `pa672189@gmail.com / manager123` (manager role).
2. Create three fund requests in different masjids via the super-admin or manager UI.
3. Open the committee dashboard, vote on a single fund request twice in quick succession from two different committee accounts in different browser tabs.

**Expected**
- BUG-003: the request list shows `reviewedBy` / `finalizedBy` / `voteMembers.member` populated in a single MongoDB round trip (check backend logs for one `find` per page).
- BUG-014: only one of the two rapid votes is recorded. The second attempt returns `You have already voted on this request`. The `votes` array has exactly one new entry.

**How to break it**
- Submit two votes from the same account in parallel using two `curl` requests → second one returns 400 / 409, never creates a duplicate vote.

---

## BUG-004 — Home page only fetches what it renders

**Steps**
1. Seed at least 50 announcements and 20 events.
2. Open DevTools → Network → filter `/api/announcements` and `/api/events`.
3. Reload the home page.

**Expected**
- Both calls go out with `limit=3` and `limit=2` respectively, regardless of total record count.
- Response payload size is bounded; no full history is shipped.

---

## BUG-005 — Admin donations/expenses use admin endpoints + pagination

**Steps**
1. Log in as `admin@emasjid.pk / admin123`.
2. Open the admin Donations & Expenses page.
3. Filter by donation type "Zakat", change page to 5, then switch to the Expenses tab and filter by category "Maintenance".

**Expected**
- Network calls go to `/api/donations/admin?page=…&limit=20&type=Zakat` and `/api/expenses/admin?page=…&limit=20&category=Maintenance`.
- The footer shows `Showing X to Y of Z donations · Page N of M`.
- Going past the last page disables the Next button.
- After clicking Add Donation, then Save, the new row appears at the top (because we reset to page 1).

---

## BUG-006 — JWT secret is rotated

**Steps**
1. Open `backend/.env`. Confirm `JWT_SECRET` is a 60+ char base64url string, **not** the previous placeholder.
2. Open `backend/.env.example`. Confirm the rotation procedure and `JWT_SECRET_OLD` documentation are present.

**Expected**
- No change needed if the existing tokens still validate (the secret wasn't rotated mid-flight).

**Rotation drill**
1. Generate a new secret: `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`.
2. In `.env`: set `JWT_SECRET=<new>`, `JWT_SECRET_OLD=<previous>`.
3. Restart the backend. Tokens issued under the old secret still authenticate via the fallback path.
4. After `JWT_EXPIRE` (8h) elapses for the last old token, remove `JWT_SECRET_OLD` and restart.

---

## BUG-007 — JWT lives in an httpOnly cookie

**Steps**
1. Open DevTools → Application → Cookies. Clear all cookies for localhost.
2. POST to `/api/auth/login` from the frontend (or via curl with `-c cookies.txt`).
3. Inspect the response cookies.

**Expected**
- `emasjid_token` is present, `HttpOnly` checked, `Path=/`, `SameSite=Lax` in dev / `Strict` in prod.
- The token is **not** in `document.cookie` (because HttpOnly).
- `GET /api/donations/admin` with the cookie alone (no Bearer) returns 200.
- Click "Logout" in the frontend → `POST /api/auth/logout` returns 200 + `Set-Cookie: emasjid_token=; Max-Age=0`.

---

## BUG-008 — MongoDB retry / reconnect

**Steps**
1. Start the backend. Watch the log.
2. From your MongoDB Atlas dashboard (or local mongod console), pause / drop the cluster for ~30 seconds, then resume.
3. Try `GET /api/health` during the outage.

**Expected**
- On boot: `[mongo] connected to emasjid` is logged.
- During outage: requests error with a 500, but the connection state shows `disconnected` in the logs.
- On resume: `[mongo] reconnected` is logged and requests start succeeding again without restarting the backend.

---

## BUG-009 — Stripe checkout is idempotent

**Steps**
1. Log in as a community user, open `/donate`, pick an amount, fill in details, submit.
2. Watch the `Donation` collection in MongoDB.

**Expected**
- A `pending` donation is created **before** the redirect to Stripe (so `getDonationBySession` can find it on return).
- The `stripeSessionId` starts as `donation_<randomhex>` and is replaced with the real `cs_test_…` once Stripe responds.
- The Stripe session has `client_reference_id` matching that prefix.

**Idempotency check**
1. Submit the same form twice in 100ms (use browser DevTools' "Re-send" button on the donation POST).
2. Result: only one Stripe session is created (Stripe returns the same session on the duplicate call because we pass the same `idempotencyKey`).

---

## BUG-010 — Webhook handles refunds + failures

**Steps**
1. Use Stripe CLI: `stripe trigger checkout.session.completed` (need Stripe CLI configured to your test account).
2. `stripe trigger charge.refunded` — verify a donation's `status` becomes `refunded` and `refundedAmount` is set.
3. `stripe trigger payment_intent.payment_failed` — verify the matching donation's `status` becomes `failed`.

**Expected**
- `POST /api/donations/webhook` returns `{ received: true }` for all three.
- The Donation document is updated in each case.

---

## BUG-011 — Donate page waits for webhook confirmation

**Steps**
1. Submit a real Stripe test donation with card `4242 4242 4242 4242`.
2. After Stripe redirects you back to `/donate?success=1&session_id=cs_test_…`, the spinner modal opens.
3. Wait up to 30 seconds.

**Expected**
- The spinner closes and the JazakAllah Khair modal opens with the real `amount` and `stripePaymentId`.
- If you cancel at Stripe (`?canceled=1`), a warning toast appears and no modal opens.
- If the webhook is delayed past 30s, the spinner closes and an error modal says "We are still confirming your payment".

**How to break it**
- Replay an old `session_id` after the donation has been cleaned up → spinner turns into the error modal.

---

## BUG-012 — Save button is locked while submitting

**Steps**
1. Open admin Donations & Expenses.
2. Open the Add Donation modal, fill it in, click Save.
3. Try to click Save a second time before the modal closes.

**Expected**
- The Save button changes to "Saving…", is greyed out, and the second click is a no-op (no duplicate POST, no duplicate DB row).
- All other inputs and the Cancel button are also disabled while submitting.

---

## BUG-013 — Transparency trend is real

**Steps**
1. Seed donations so that last month had PKR 50,000 and this month so far has PKR 75,000.
2. Visit `/transparency` as a logged-out user.

**Expected**
- "Total Donations Received" card shows "**+50% from last month**" with a green `trending_up` icon.
- Change `thisMonth` to 40,000 (create new expenses to eat into it) → card now shows "**-20% from last month**" with a red `trending_down` icon.
- If both months are 0 → "No prior data".

**How to break it**
- Hardcode a wrong percentage in the JSX → should not show up.

---

## BUG-014 — Race condition (also covered above)

Already covered by BUG-003/014 steps. The atomic `findOneAndUpdate({ ..., 'votes.member': { $ne: user._id } }, { $push: ... })` is the actual safeguard.

---

## BUG-015 — Real time + description in admin tables

**Steps**
1. Seed donations at distinct times (e.g., one at 09:15, one at 14:42).
2. Open admin Donations & Expenses.
3. Add a new donation with note "For new carpet".
4. Add a second donation with **no** note.

**Expected**
- Row timestamps show `9:15 AM` and `2:42 PM` (not `10:30 AM`).
- Row descriptions show "For new carpet" for the first and "Sadaqah contribution" for the second (fallback).
- Edit the first donation, change the note, save → row updates in place.