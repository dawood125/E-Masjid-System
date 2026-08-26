# 10 Financial Transparency — Questions Asked

> Likely viva / defense questions for an external examiner, and the answers we would give. Tone is conversational — these are the answers we have ready, not a script.

---

### Q1. Why are refunded donations excluded from the trend cards on `/transparency`, but still visible in the Donation History table?

**A.** The trend cards answer "how much money did the masjid actually keep this month". A refunded donation is a reversal, not income, so it would distort the month-over-month comparison. The Donation History table, on the other hand, is an audit ledger — auditors want to see every transaction, including reversals. That split is encoded in `donationsService.aggregateSummary` which has `match.status: { $ne: 'refunded' }`, while `listPublic` and `listAdmin` do not filter on `status`.

### Q2. How do you stop a committee member from voting twice on the same fund request? (The BUG-T14 fix is in `fundRequestsService.js`, but the same race-condition class applies to donations — what if a network retry double-posts a `POST /api/donations`?)

**A.** Two layers. (1) The Save button is locked with a `submittingRef` re-entry guard in `DonationsExpenses.jsx`, so a UI-level double-click cannot post twice. (2) For online donations, `donationsService.createStripeCheckout` generates a `crypto.randomBytes(12)` idempotency key, pre-creates a `pending` donation with that key as `stripeSessionId`, and passes the same key to Stripe's `checkout.sessions.create({...}, { idempotencyKey })`. If the browser retries the same request, Stripe returns the same session URL. The pending donation is `upsert`ed, not duplicated. Cash donations don't have the same risk because the user is staring at the modal.

### Q3. Why is the anonymous donor's `email` and `phone` returned as empty strings in the public response, not just `undefined`?

**A.** `donationsService.maskAnonymous` explicitly sets `email: ''` and `phone: ''` so the public JSON shape is identical whether a donor chose to be anonymous or not. This prevents a side-channel: if `email` were `undefined` for anonymous donors and a real string for identified donors, an attacker could enumerate which donations are anonymous by inspecting the response shape. Returning the same shape with empty strings is consistent and the public route also omits these from any summary or top-donors roll-up.

### Q4. The Transparency page's `aggregateSummary` aggregation returns `thisMonth` and `lastMonth`. What if someone makes a donation on 31 August at 23:59 PKT and reads the page at 00:01 on 1 September? Which bucket does it land in?

**A.** The aggregation is `createdAt: { $gte: startOfLastMonth }` and then grouped by `$dateToString: { format: '%Y-%m' }`. The `startOfLastMonth` is computed in the Node process's local timezone (`new Date(now.getFullYear(), now.getMonth() - 1, 1)`), so the boundary is 00:00 local time on the 1st of the month. A 31 Aug 23:59 PKT donation would be in the August bucket; reading the page on 1 Sept 00:01 PKT, `now.getMonth()` is `8` (Sept), so the August donation is no longer in `thisMonth` and shows up only in the August table filter. This is the expected behavior — the system clock and the database `createdAt` use the same convention.

### Q5. Why does the public `/api/donations` endpoint not require auth, but `/api/donations/admin` does?

**A.** Transparency is a public trust feature — donors and community members should be able to see the books without logging in. The admin endpoint exposes PII (donor name, email, phone), the full payment method, and the ability to mutate records, so it is gated by `protect` + `authorize('admin', 'manager')`. The service functions are split (`listPublic` vs `listAdmin`) precisely so the public path can never accidentally return `email` / `phone` to the wire — `maskAnonymous` is only called on the public path.

### Q6. The admin table footer says "Showing 21 to 40 of 25 donations" on the last page if the server returns 25 total and a page of 20. How do you avoid that?

**A.** The footer math is `Math.min(page * limit, total)`. With `page=2, limit=20, total=25`, the upper bound is `Math.min(40, 25) = 25`, so the footer reads "Showing 21 to 25 of 25 donations". The `donationSafePage` / `expenseSafePage` clamps the page to `Math.min(Math.max(1, page), totalPages || 1)` so the user can never be on page 3 of a 2-page result by editing the URL either.

### Q7. What happens if a manager is added to a masjid after they have already issued a JWT — does the new scope take effect on their next request?

**A.** Yes, because `listAdmin` looks up the manager's `managerId` against the live `Mosque` collection on every request, not from the JWT payload. The JWT carries only `userId`, `role`, and the per-user `mosqueId`; the manager's `managedIds` are resolved per-request. The trade-off is one extra `Mosque.find` per admin request, which we considered acceptable. (A cache layer would be premature for the seed data sizes; the query uses `.select('_id')` and is index-hit.)

### Q8. You use `RegExp(type, 'i')` to filter donations by type. Why not an exact-match equality?

**A.** The admin's filter dropdown shows the canonical names ("Sadaqah", "Zakat", "Masjid Fund") but historical donations may have a trailing space, a different case, or — for some legacy rows — a free-form type string. The case-insensitive substring match is forgiving without becoming a true wildcard. The public endpoint uses the same pattern, and the test suite locks in the behavior with `donationInA` and `donationInB` of different types.

### Q9. The admin "Add Donation" form's Payment Method dropdown has only "Cash". Why?

**A.** Online donations are a separate flow (Stripe checkout). The admin form is for recording walk-in / hand-delivered cash donations, so the only payment method we expose is Cash. The `paymentMethod` enum on the model still allows `Card` and `Online` because the Stripe webhook writes them. The disabled state of the dropdown is intentional — it documents why those values exist without confusing the admin.

### Q10. How would you add a "donations by category over the last 12 months" chart to the public transparency page?

**A.** Reuse the existing `aggregateSummary` shape — it already returns `byType: { Sadaqah: 120000, Zakat: 80000, ... }`. The frontend already has a `topDonors` card layout, so the chart would be a sibling card. No new endpoint is required; we just call the existing `GET /api/donations/summary?mosqueId=…`. We deferred this for scope reasons, but the data path is there.

### Q11. What is the impact of a masjid being soft-deleted (`isActive: false`) on the transparency page?

**A.** The public `/api/mosques/public` route already filters to `isActive: true`, so a soft-deleted masjid does not appear in the header dropdown. Its donations remain in the database and remain reachable if you have a direct link with its `mosqueId`, but the soft delete is the source-of-truth "should we still show this masjid" signal. The admin endpoints do **not** filter on `isActive` — managers should still be able to see historical books of a deactivated masjid for audit. We documented this in `manual_testing_guide.md` §2.2.

### Q12. The "Top Donors" card shows up to 10 names. Why 10, and what if there are ties?

**A.** 10 was a UX ceiling — the card uses gold/silver/bronze styling for ranks 1-3 and `#N` for the rest, and at >10 the card pushes the rest of the page below the fold. Ties are broken by MongoDB's natural ordering on the `$group` result (insertion order), which is deterministic enough for a non-strict ranking. If two donors have the exact same `totalAmount`, both are listed; the rank number may skip. The aggregation is `{ $sort: { totalAmount: -1 } }, { $limit: 10 }` — adding a secondary sort key like `donationCount` would change this; we left it as a documented product decision.

### Q13. Could a malicious user trigger the `/api/donations/online` endpoint with a huge amount and cause a Stripe timeout?

**A.** The route validator `body('amount').isFloat({ gt: 0 })` allows any positive number, and the Stripe call would just convert it to paisa. There is no upper bound. We rely on Stripe's own fraud detection (Stripe Radar) and the `STRIPE_SECRET_KEY` test-vs-live separation to gate production. For an extra-hardening pass we would add a `body('amount').isFloat({ lt: 10_000_000 })` cap and a per-IP rate limit; both are in the post-defense backlog.

### Q14. The "Donations (Income)" / "Expenses (Spending)" cards on the admin page sum the **current page only**, not the total. Is that a bug?

**A.** It is a UX choice. The cards are positioned next to the pagination footer, so users see the "Showing X to Y of Z donations · Page N of M" line and understand the sum is for the current view. A "Total across all pages" card would require a second `countDocuments` round-trip on every filter change. The data is already available on the server (`total` in the response) so wiring it up later is a 3-line change. We chose to ship the visible page sum first and have not had a user complaint.

### Q15. The `note` field on donations is capped at 300 characters. Why not more?

**A.** The field is shown in the admin table description column without a tooltip, so >300 chars wraps and breaks the table layout. The Stripe receipt description is also 300 chars in practice. If longer notes are needed, the right answer is a separate `DonationNote` collection with a modal viewer — out of scope for this phase.
