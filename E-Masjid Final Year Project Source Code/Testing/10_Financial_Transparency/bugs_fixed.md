# 10 Financial Transparency — Bugs Fixed

> Phase 10 — 2026-08-25
>
> Five critical/high bugs were fixed end-to-end. Each entry below shows the file, the relevant code shape, and how the fix was verified. References match the actual `git log` of the phase.

---

## BUG-T01 / BUG-005 — Admin listing endpoints + pagination (Critical)

**Files**
- `backend/services/donationsService.js` — new `listAdmin(query, user)`.
- `backend/services/expensesService.js` — new `listAdmin(query, user)`.
- `backend/routes/donations.js` — new `router.get('/admin', protect, authorize('admin', 'manager'), ctrl.listAdmin)`.
- `backend/routes/expenses.js` — same.
- `frontend/src/utils/api.js` — new `getAdminDonations`, `getAdminExpenses`.
- `frontend/src/components/Admin/Pages/DonationsExpenses.jsx` — switched to admin endpoint, bumped `PAGE_SIZE` 5 → 20.

Service shape (admin scope):

```js
async function listAdmin(query, user) {
  const { type, month, page = 1, limit = 10, mosqueId } = query;
  const filter = {};
  if (user.role === 'manager') {
    const Mosque = require('../models/Mosque');
    if (mosqueId) {
      if (!isValidObjectId(mosqueId)) throw httpError(400, 'Invalid mosqueId');
      const owned = await Mosque.findOne({ _id: mosqueId, managerId: user._id }).select('_id');
      if (!owned) throw httpError(403, 'You do not manage this masjid');
      filter.mosqueId = mosqueId;
    } else {
      const managed = await Mosque.find({ managerId: user._id }).select('_id');
      const ids = managed.map((m) => m._id);
      if (!ids.length) return { data: [], total: 0, page: 1, totalPages: 0 };
      filter.mosqueId = { $in: ids };
    }
  } else {
    if (!user.mosqueId) throw httpError(400, 'Your account is not assigned to a mosque');
    if (mosqueId && String(mosqueId) !== String(user.mosqueId)) {
      throw httpError(403, 'Cannot view donations for a different mosque');
    }
    filter.mosqueId = user.mosqueId;
  }
  if (type && type !== 'all') filter.type = new RegExp(type, 'i');
  if (month && month !== 'all') {
    filter.$expr = { $eq: [{ $month: '$createdAt' }, monthIndex(month)] };
  }
  const total = await Donation.countDocuments(filter);
  const donations = await Donation.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));
  return { data: donations, total, page: Number(page), totalPages: Math.ceil(total / limit) };
}
```

**Verified**
- `GET /api/donations/admin` returns `{ success: true, data, total, page, totalPages }`.
- `GET /api/donations/admin?mosqueId=<other-mosque>` from a non-manager admin returns `403`.
- See `donations_scope.test.js` "admin scoped listing endpoint" block — all 7 cases pass.

---

## BUG-T02 / BUG-013 — Real trend instead of hardcoded "+12%" (High)

**Files**
- `backend/services/donationsService.js#aggregateSummary` — added `thisMonth` / `lastMonth` to the returned object.
- `backend/services/expensesService.js#aggregateSummary` — same.
- `frontend/src/components/User/Pages/Transparency.jsx` — replaced hardcoded `<p>+12% from last month</p>` with `computeTrend(current, previous)`.

Backend aggregation (donations):

```js
const now = new Date();
const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
const monthly = await Donation.aggregate([
  { $match: { ...match, createdAt: { $gte: startOfLastMonth } } },
  { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, total: { $sum: '$amount' } } },
]);
const monthlyMap = monthly.reduce((acc, item) => { acc[item._id] = item.total; return acc; }, {});
const thisMonthKey = `${startOfThisMonth.getFullYear()}-${String(startOfThisMonth.getMonth() + 1).padStart(2, '0')}`;
const lastMonthKey = `${startOfLastMonth.getFullYear()}-${String(startOfLastMonth.getMonth() + 1).padStart(2, '0')}`;
return {
  totalDonations: totals[0]?.total || 0,
  byType: byType.reduce((acc, item) => { acc[item._id] = item.total; return acc; }, {}),
  thisMonth: monthlyMap[thisMonthKey] || 0,
  lastMonth: monthlyMap[lastMonthKey] || 0,
};
```

Frontend `computeTrend`:

```js
function computeTrend(current, previous) {
  if (!previous || previous <= 0) {
    if (!current) return { label: 'No prior data', tone: 'muted', icon: 'info' };
    return { label: 'New this month', tone: 'positive', icon: 'trending_up' };
  }
  const diff = current - previous;
  const pct = Math.round((diff / previous) * 100);
  if (Math.abs(pct) < 1) return { label: 'Flat vs last month', tone: 'muted', icon: 'remove' };
  const direction = pct > 0 ? 'up' : 'down';
  const tone = pct > 0 ? 'positive' : 'negative';
  const sign = pct > 0 ? '+' : '';
  return { label: `${sign}${pct}% from last month`, tone, icon: direction === 'up' ? 'trending_up' : 'trending_down' };
}
```

**Verified**
- Seeded last month 50,000 / this month 75,000 → renders "+50% from last month" with `trending_up`.
- All-zero previous month → renders "No prior data" with `info` icon.
- `donations_scope.test.js#summary aggregation` checks `thisMonth` / `lastMonth` totals are scoped to the requested mosqueId.

---

## BUG-T03 / BUG-015 — Real time + note in admin table (High)

**Files**
- `backend/models/Donation.js` — added `note: { type: String, trim: true, maxlength: 300 }`.
- `frontend/src/components/Admin/Pages/DonationsExpenses.jsx` — added `formatRecordTime(dateString)` and `recordNote(item, activeTab)`; replaced the hardcoded `<p>10:30 AM</p>` and `${type} contribution` strings.

```js
function formatRecordTime(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function recordNote(item, activeTab) {
  if (!item) return '';
  if (activeTab === 'donations') {
    if (item.note && String(item.note).trim()) return item.note;
    if (item.description && String(item.description).trim()) return item.description;
    return `${item.type || 'Donation'} contribution`;
  }
  return item.description || `${item.category || 'Expense'} expense`;
}
```

**Verified**
- Two donations seeded at 09:15 and 14:42 → admin table shows `9:15 AM` and `2:42 PM`.
- Donation with `note: "For new carpet"` → description column shows that string, not "Sadaqah contribution".
- Donation with no note → falls back to `${type} contribution`.

---

## BUG-T04 — Save button double-submit guard (Critical)

**Files**
- `frontend/src/components/Admin/Pages/DonationsExpenses.jsx` — added `submitting` state, `submittingRef` re-entry guard, and disabled the Save button + all inputs during the in-flight request.

```js
const handleCreateRecord = async (event) => {
  event.preventDefault();
  if (submittingRef.current) return;
  submittingRef.current = true;
  setSubmitting(true)
  try {
    if (activeTab === 'donations') { ... }
    else { ... }
    setIsCreateOpen(false)
    setEditingDonation(null)
  } catch (err) {
    showToast(err.message || 'Failed to add record.', 'error')
  } finally {
    submittingRef.current = false
    setSubmitting(false)
  }
};
```

Button now renders:

```jsx
<button
  type="submit"
  disabled={submitting}
  className="rounded-lg bg-primary-700 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-60"
>
  {submitting ? 'Saving...' : 'Save'}
</button>
```

The `submittingRef` (a `useRef`) covers the case where React hasn't flushed the state update yet, so a synchronous double-click in the same tick still no-ops.

**Verified**
- Double-clicking Save in <200ms produces exactly one `POST /api/donations`, one DB row, one toast.
- Cancel and × close buttons are also disabled while `submitting === true`.

---

## BUG-T05 — Optimistic merge on create (Critical)

**Files**
- `frontend/src/components/Admin/Pages/DonationsExpenses.jsx#handleCreateRecord` — the create branch now pushes the returned donation into local state on top of resetting to page 1 (so it shows on the first page after the reset).

```js
const res = await api.createDonation(payload)
showToast('Donation added successfully.', 'success')
setDonations((prev) => [{ ...res.data, id: res.data._id || res.data.id, date: res.data.createdAt || res.data.date }, ...prev])
setDonationPage(1)
```

Same optimistic-merge was already in place for `updateDonation`; the create branch now matches.

**Verified**
- After Save the new row is the first item on page 1 without a refresh.

---

## BUG-T06 — Stripe checkout idempotency (Critical)

Tracked primarily under BUG-009 / BUG-010 / BUG-011 in Phase 21, but it lives on this surface. The shape is:

**Files**
- `backend/services/donationsService.js#createStripeCheckout` — pre-creates a `Donation` with `status: 'pending'` and `stripeSessionId: idempotencyKey` (random `crypto.randomBytes(12).toString('hex')`).
- Stripe session created with the same `idempotencyKey` in options.
- `backend/services/stripeWebhookService.js#processEvent` — handles `checkout.session.completed`, `charge.refunded`, `payment_intent.payment_failed` and flips `status` accordingly.
- `frontend/src/components/User/Pages/Donate.jsx` — polls `api.getDonationBySession(sessionId)` every 1.5s for up to 30s before showing the JazakAllah Khair modal.

**Verified**
- `donations_scope.test.js#Stripe checkout flow (mocked)` — 4 cases pass.
- `donations_scope.test.js#Stripe webhook signature + event handling (mocked)` — 4 cases pass.

---

## BUG-T09 — Clamp `limit` on admin endpoints (Medium)

`listAdmin` now calls a shared `clampLimit` helper (`Math.min(100, Math.max(1, Number(limit) || 10))`) before `skip()` / `limit()`. Sending `?limit=99999` returns at most 100 rows.

---

## What is **not** in this commit (intentional)

- BUG-T07 (category validation on POST /api/expenses) — schema enum already rejects; controller tightened in a later hardening pass.
- BUG-T08 (ObjectId cast in `$match`) — fixed under Phase 21's broader aggregation audit.
- BUG-T10 / T11 / T12 — low priority, deferred to Phase 18 (polish) backlog.
