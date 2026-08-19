# Phase 9 — Donations Module: bugs fixed

## Fix list

### F1 — Reject cross-mosque body.mosqueId in admin POST

**Bug:** B1
**Files touched:**
- `backend/services/donationsService.js` (`createCash`)
- `backend/tests/integration/donations_scope.test.js`
  (test added: `POST /api/donations with cross-mosque body.mosqueId → 403`)

**Change:**
```js
async function createCash(input, user) {
  if (input.mosqueId && user.mosqueId &&
      String(input.mosqueId) !== String(user.mosqueId)) {
    throw httpError(403, 'Cannot create donations for a different mosque');
  }
  ...
}
```

**Verification:** Live curl returns `HTTP 403` with
`Cannot create donations for a different mosque`. Old test
(`assigns mosqueId from token when client sends own mosqueId`)
updated to expect `mosqueId === A` (own masjid) in body — the
case the test was *intended* to cover; it now exercises the new
happy path rather than the silent overwrite.

---

### F2 — `listAdmin()` with role-based scope

**Bug:** B2
**Files touched:**
- `backend/services/donationsService.js` (added `listAdmin`)
- `backend/controllers/donationsController.js` (added `listAdmin`)
- `backend/routes/donations.js`
  (wired `GET /api/donations/admin` with `authorize('admin', 'manager')`)
- `backend/tests/integration/donations_scope.test.js`
  (5 new tests)

**Change:**
```js
async function listAdmin(query, user) {
  if (!user) throw httpError(401, 'Authentication required');
  if (user.role !== 'admin' && user.role !== 'manager') {
    throw httpError(403, 'Not authorized');
  }
  ...
}
```

Admin → forced to own `user.mosqueId` (or 403 if body is wrong).
Manager → only masjids where `Mosque.managerId === user._id` (or
403 if a query param asks for an unmanaged masjid). No token →
401. No role → 403.

**Verification:** All 5 new tests pass; live curl matches.

---

### F3 — Manager scope narrows to `Mosque.managerId === user._id`

**Bug:** B3
**Files touched:**
- `backend/services/donationsService.js` (`listAdmin` manager branch)

**Change:**
```js
if (user.role === 'manager') {
  const Mosque = require('../models/Mosque');
  if (mosqueId) {
    if (!isValidObjectId(mosqueId)) throw httpError(400, 'Invalid mosqueId');
    const owned = await Mosque.findOne({ _id: mosqueId, managerId: user._id }).select('_id');
    if (!owned) throw httpError(403, 'You do not manage this masjid');
    filter.mosqueId = mosqueId;
  } else {
    const managed = await Mosque.find({ managerId: user._id }).select('_id');
    if (!managed.length) return { data: [], total: 0, page: 1, totalPages: 0 };
    filter.mosqueId = { $in: managed.map((m) => m._id) };
  }
}
```

**Verification:** Playwright now sees
- `manager GET /admin?mosqueId=Al-Noor` → 200
- `manager GET /admin?mosqueId=Al-Rahman` → 200
- `manager GET /admin?mosqueId=<unmanaged>` → 403

Three integration tests added.

---

### F4 — Tests no longer rely on real Stripe SDK during suite

**Bug:** B4
**Files touched:**
- `backend/tests/integration/donations_scope.test.js`
  (top-level `beforeAll` now clears `STRIPE_SECRET_KEY`; the
  Stripe describe blocks explicitly re-set it; `afterAll` restores)

**Change:**
```js
const realStripeKey = process.env.STRIPE_SECRET_KEY;
beforeAll(async () => {
  process.env.STRIPE_SECRET_KEY = '';
  ...
});
afterAll(async () => {
  ...
  if (realStripeKey) process.env.STRIPE_SECRET_KEY = realStripeKey;
  else delete process.env.STRIPE_SECRET_KEY;
});
```

**Verification:** All 28 donations integration tests pass with
the .env-derived key cleared. Stripe-describe block sets a fake
`sk_test_real_looking_key_1234567890` that does NOT include the
`your_test_key_here` substring, so the Stripe path is exercised.

---

### F5 — Stripe mocked: 8 checkout/webhook integration tests

**Files touched:**
- `backend/tests/integration/donations_scope.test.js`
  (top-of-file `jest.mock('stripe', ...)` + 2 new describe blocks)

**Coverage added:**

Checkout path (`POST /api/donations/online` with Stripe configured):
1. Returns Stripe checkout URL when key configured
2. Donor info flows through Stripe `session.metadata`
3. Amount converts from PKR → paisa (250 PKR → `unit_amount: 25000`)
4. Legacy fallback when key is empty (no mock call, record created)

Webhook path (`POST /api/donations/webhook`):
5. Invalid signature → 400 with `Webhook Error` message
6. Valid signature + `checkout.session.completed` → records donation
7. Valid signature + invalid amount in metadata → swallowed, 200, no record
8. Unknown event type → 200 acknowledged, no record created

---

### F6 — Playwright form selectors now match the JSX

**Bug:** B5 (and B5-adjacent: false-fail in admin CRUD test)
**Files touched:**
- `Testing/09_Donations_Module/donations_test.js`

**Change:**
- Use label-scoped selectors (`label:has-text("Donor Name") input`)
  because the form inputs in `DonationsExpenses.jsx` have no
  `name` attribute — they're controlled components keyed off
  `value={recordForm.donorName}`.
- Use `form.last()` to scope the selectors to the modal.
- Verify the created donation via `GET /api/donations/admin`
  instead of relying on the rendered table row (faster + not
  subject to pagination / filter UI state).
- Branch on Stripe vs legacy for the "anonymous masked" check.

---

## Commit hashes

(Pending — user will commit after manual smoke retest.)
