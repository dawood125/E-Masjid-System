# Phase 9 — Donations Module: manual testing guide

This module covers both the **public donation flow** (`/donate`) and
the **admin donation management** (`/admin/donations`). It also
exercises **scope isolation** between four masjids, **anonymity**,
the **Stripe checkout** (real + legacy fallback), and the **Stripe
webhook** (signature verification + event processing).

## Prerequisites

- Backend running on `http://127.0.0.1:5000`
- Frontend running on `http://127.0.0.1:5174`
- Seeded with `npm run seed` (creates 4 masjids + manager + admins).
- Stripe real-mode (test key in `.env` returns the Stripe-hosted
  checkout URL) or Stripe mocked (clearing `STRIPE_SECRET_KEY` in
  the env returns the donation record immediately). Both paths are
  exercised by the manual tests below.

## Credentials

| Role | Email | Password | Scope |
|---|---|---|---|
| Super admin (manager) | `manager@emasjid.pk` | `manager123` | All 4 masjids |
| Admin Al-Noor | `admin@emasjid.pk` | `admin123` | Al-Noor only |
| Admin Al-Rahman | `admin2@emasjid.pk` | `admin123` | Al-Rahman only |
| Community | `user@emasjid.pk` | `user1234` | — |

## Test scenarios

### A. Public `/donate` flow

1. Visit `http://127.0.0.1:5174/donate` while logged out.
2. Pick a donation type from the 3 chip buttons (Sadaqah / Zakat /
   Masjid Fund).
3. Pick a preset amount or enter a custom one (minimum PKR 100).
4. Toggle the **Anonymous Donor** checkbox.
5. Pick a masjid from the navbar masjid selector.
6. Click **Continue to Payment**.
   - With Stripe live: you are redirected to the Stripe-hosted
     checkout page (test mode URL like `checkout.stripe.com/...`).
   - With Stripe mocked (no key): the donation is created
     immediately and you see a success toast.

Expected: redirect vs success toast match the configured Stripe mode.
Donation record has `paymentMethod: 'Online'` and `isAnonymous`
matches the checkbox state.

### B. Public `/transparency` donations tab

1. While logged out, visit `/transparency`.
2. The Donations tab shows a summary card (Total + by-type bars)
   and a paginated list of recent donations.
3. Use the navbar masjid selector to switch between Al-Noor,
   Al-Rahman, Al-Falah, Al-Taqwa. Summary card and list refresh.
4. Click a Type chip (e.g. **Zakat**) → list filters to Zakat.
5. Click a Month chip (e.g. **Last 3 Months**) → list re-filters.
6. Click **View All** → list expands to up to 100 rows; a
   **Collapse** button appears.

Expected: anonymous donors display as `Anonymous` (real name +
email + phone are hidden). Public list respects `mosqueId` from
the navbar selector.

### C. Admin `/admin/donations` — donations tab

1. Log in as `admin@emasjid.pk` and go to `/admin/donations`.
2. The page opens on the **Donations** tab with a fresh table
   scoped to Al-Noor.
3. Click **Add Donation**.
4. Fill: donor `"Cash Donor Test"`, amount `2500`, type `Zakat`,
   payment method defaults to `Cash`. Submit.
5. The new row appears at the top.
6. Click the row's edit icon, change amount to `3000`, save.
7. Click the row's delete icon, confirm the dialog. The row
   disappears.

Expected: CRUD succeeds. The new row's `mosqueId` is forced to
Al-Noor from the JWT; client cannot override it via the form.

### D. Anonymous donation — admin sees real name

1. From the public site, place an anonymous donation (tick the
   box in `/donate`).
2. Log in as `admin@emasjid.pk`.
3. Go to `/admin/donations`. The anonymous donation now shows the
   real donor name (the admin view is the one place anonymity
   is lifted — required for receipts/tax/audit).

Expected: admin sees real name + email + phone; public site
sees `Anonymous` with empty email/phone.

### E. Cross-mosque authorization

Try in the DevTools console as `admin2@emasjid.pk` (Al-Rahman):

```js
const t = JSON.parse(localStorage.user).token
const r = await fetch('http://127.0.0.1:5000/api/donations/admin', {
  headers: { Authorization: 'Bearer ' + t }
})
const j = await r.json()
console.log('items:', j.data.length, 'all in Al-Rahman?',
  j.data.every(d => d.mosqueId === j.data[0].mosqueId))
```

Expected: every returned donation has Al-Rahman's mosqueId. No
leak of Al-Noor rows.

Then try a direct cross-mosque POST:

```js
const noorDonationId = '...'  // grab from a separate admin1 session
await fetch(`http://127.0.0.1:5000/api/donations/${noorDonationId}`, {
  method: 'PUT',
  headers: { 'Authorization': 'Bearer ' + t, 'Content-Type': 'application/json' },
  body: JSON.stringify({ amount: 99999 })
})
```

Expected: `HTTP 404 — Donation not found`. Al-Noor's row stays
untouched (refresh admin1 page).

Same for DELETE → 404.

### F. Manager scope

1. Log in as `manager@emasjid.pk` and go to `/admin/donations`.
2. Use the navbar masjid selector to switch between the 4 masjids.
   The donations table re-filters each time.
3. In DevTools, try an unmanaged masjid id:

```js
await fetch('http://127.0.0.1:5000/api/donations/admin?mosqueId=5f4f4f4f4f4f4f4f4f4f4f4f', {
  headers: { Authorization: 'Bearer ' + t }
})
```

Expected: `HTTP 403 — You do not manage this masjid`.

### G. Stripe webhook (mocked)

Run in a terminal from `backend/`:

```bash
node -e "
  const crypto = require('crypto');
  const payload = JSON.stringify({type:'checkout.session.completed',data:{object:{
    id:'cs_test_demo',payment_intent:'pi_test_demo',
    metadata:{donorName:'Webhook Demo',amount:'500',type:'Sadaqah',
      mosqueId:'6a831e3469e03811eeb58607'}
  }}});
  const ts = Math.floor(Date.now()/1000);
  const sig = crypto.createHmac('sha256', process.env.STRIPE_WEBHOOK_SECRET)
    .update(ts + '.' + payload).digest('hex');
  fetch('http://127.0.0.1:5000/api/donations/webhook',{
    method:'POST',
    headers:{'stripe-signature':'t='+ts+',v1='+sig,'Content-Type':'application/json'},
    body: payload
  }).then(r=>r.text()).then(console.log);
"
```

Expected: `{ received: true }`. A donation with
`stripePaymentId: 'pi_test_demo'` now exists under Al-Noor.

Then tamper with the body and re-send — expected:
`HTTP 400 — Webhook Error`.

### H. Form validation

Try submitting the **Add Donation** modal as admin:

1. Donor name empty → relies on `Walk-in Donor` fallback (no error)
2. Amount = 0 → "Amount must be a positive number"
3. Amount = -50 → same
4. Amount = "abc" → same
5. Amount = 50 (below PKR 100) → same on the online endpoint
6. Type → only `Sadaqah / Zakat / Masjid Fund` accepted

Expected: every failure surfaces an inline error or toast; no row
written to the database.

## Notes

- `POST /api/donations/online` has a minimum of PKR 100. Admin
  `POST /api/donations` has no minimum (cash donations in the
  test environment may include small amounts in test runs).
- The Stripe webhook endpoint reads the **raw** request body and
  verifies the `stripe-signature` header using
  `STRIPE_WEBHOOK_SECRET`. Invalid signatures always return 400.
- Webhooks for unknown event types (e.g.
  `payment_intent.payment_failed`) are acknowledged with 200 but
  no donation record is created.
- Donation receipts are not part of this phase — none of the
  manual tests depend on email delivery.
- Anonymity is honored on `/transparency` and on `GET
  /api/donations` public endpoint. It is **not** honored on the
  admin `/admin/donations` route (admins see the real name).
