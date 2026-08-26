# 10 Financial Transparency — Bugs Found

> Phase 10 — 2026-08-25
>
> The transparency surface is two read-only pages (public `/transparency`, admin Donations & Expenses) plus four services (`donationsService`, `expensesService`, `stripeWebhookService`) and a handful of routes. Bugs were found by walking the user journey with a seeded database, then by inspecting the code with Phase 21's NFR checklist.
>
> Confirmed bugs in **bold** were fixed in this phase. Italicised items are deferred (cosmetic, low-impact, or "code style" only).

## Severity key

- **Critical** — data leak, broken feature, or financial misstatement.
- **High** — UX-broken or admin-unusable, but no data loss.
- **Medium** — visible wrong value that does not block flow.
- **Low** — polish, copy, alignment, code style.

---

## **BUG-T01 / BUG-005 (Critical) — Admin has no admin endpoints**

- Public `/api/donations` and `/api/expenses` are open, but no admin-only listing endpoint existed.
- The admin Donations & Expenses page (`frontend/src/components/Admin/Pages/DonationsExpenses.jsx`) was calling the public endpoints, then paginating/filtering in the browser. With 500 records the tab froze.
- Manager role also had no way to view a single masjid's books.

## **BUG-T02 / BUG-013 (High) — Hardcoded "+12% from last month"**

- `frontend/src/components/User/Pages/Transparency.jsx` had `<p>+12% from last month</p>` hardcoded next to the "Total Donations Received" stat.
- Same line shape was duplicated on the "Total Funds Utilized" stat with the same string.
- A real `thisMonth` / `lastMonth` aggregation did not exist on the backend either.

## **BUG-T03 / BUG-015 (High) — Hardcoded "10:30 AM" + "${type} contribution" in admin table**

- `DonationsExpenses.jsx` rendered every donation row with `<p>10:30 AM</p>` and `${donation.type} contribution`, regardless of the actual `createdAt` or `note`.
- Expense rows had the same problem.
- The `note` field existed in the schema only as `description`; admins had no way to record context.

## **BUG-T04 (Critical) — Save button could be double-clicked**

- The Add/Edit modal had no `submitting` state. A fast double-click on Save posted two identical `POST /api/donations` calls, creating two duplicate rows.
- The cancel and close buttons stayed enabled during the in-flight request.

## **BUG-T05 (Critical) — Save dialog races with parent re-render**

- After a successful `POST /api/donations`, `setDonationPage(1)` reset pagination, but `setDonations(...)` was not called — the new row was missing from the donations list until the next manual refresh.
- The patch in the page did not optimistically merge the response back into the existing list (it did only on edit, not create).

## **BUG-T06 (High) — Stripe checkout had no idempotency**

- A second click on "Donate" before the redirect created two `Donation` documents and two Stripe sessions, charging the user twice.
- The `/api/donations/online` handler did not pre-write a `pending` donation for the success page to poll against, so `?success=1` couldn't be confirmed.

## BUG-T07 (Medium) — No type/category on expense create payload validation

- `POST /api/expenses` accepts any `category` string. The `Expense` model enum restricts it, but the controller/service did not re-validate; an empty string passed mongoose coercion and the UI rendered the blank chip.

## BUG-T08 (Medium) — `mosqueId` not ObjectId-cast for aggregation match

- `donationsService.aggregateTopDonors` and `aggregateSummary` accept `mosqueId` as a string but `Donation.aggregate` does not auto-cast in `$match`. When the public Transparency page sent a string, the `$match` matched nothing and the top-donors card rendered empty.
- Fix wraps the value with `toObjectId(id)` before passing to `$match` (later commit, also fixed in Phase 21 hardening).

## BUG-T09 (Medium) — `/api/donations/admin` does not clamp `limit`

- The new admin endpoint accepts any `limit`; sending `?limit=99999` returned the whole collection in one response, defeating the BUG-T01 fix.
- Same issue on `/api/expenses/admin`.

## BUG-T10 (Low) — Edit modal loses the expense's `description`

- `onEditDonation` populated `recordForm.description` to `''` even for donation edits. The current code only sets `note`, but the shared form field reads `description` for expense mode and `note` for donations — easy to break later.

## BUG-T11 (Low) — Donations report download shows "—" for empty pages

- `handleDownloadReport` in `Transparency.jsx` runs against the *currently displayed* donations/expenses arrays. If the user has not clicked "View All", the report only contains the visible page (6 records) and the CSV says "Page 1 of 1 · 6 records" — misleading.

## BUG-T12 (Low) — Deleted-donation confirm requires name only

- For an anonymous donation `confirmDeleteDonation.donorName` is `'Anonymous'`, so the confirm-to-delete modal expects the user to literally type `Anonymous` — works but is confusing. Better to use amount like the expense modal does.

---

## Not bugs (deferred / by design)

- Public listing does not paginate the unpaid `pending` donations. By design: pending rows are never returned to public, only `completed`.
- `top-donors` returns at most 10 names. That cap is the design ceiling.
- `note` length cap of 300 chars is the schema limit, not a UI bug.
