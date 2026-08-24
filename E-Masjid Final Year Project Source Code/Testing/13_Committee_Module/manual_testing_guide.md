# 13 Committee Voting Module — manual testing guide

> The Playwright E2E suite at `committee_voting_test.js` covers 19 of the
> 20 checks below automatically. The scenarios in this guide are the manual
> re-verification path an examiner can follow from any browser.

## Test accounts (Al-Noor)

| Role           | Email                              | Password       |
|----------------|------------------------------------|----------------|
| Al-Noor Admin  | `admin@emasjid.pk`                 | `admin123`     |
| Al-Noor User   | `user@emasjid.pk`                  | `user1234`     |
| Committee #1   | `committee@emasjid.pk`             | `committee123` |
| Committee #2   | `wb494929@gmail.com`               | `committee123` |
| Committee #3   | `ara786125@gmail.com`              | `committee123` |
| Committee #4   | `dawood.ahmed786678@gmail.com`     | `committee123` |

## Scenarios

### A. Community submits a request
1. Login as `user@emasjid.pk`.
2. Visit `/fund-request` and submit: name, valid email, phone, amount,
   category, ≥30-char reason, accept the terms. Click **Submit Request**.
3. **Expect**: success card with reference ID; toast *"Request submitted
   successfully"*.

### B. Community sees the pending request
1. After A, visit `/my-requests`.
2. **Expect**: card shows the request in **Pending Review** state with the
   amount, reason, and a "Committee has not started voting yet" banner
   while no votes are recorded.

### C. Committee member A1 casts an approve vote
1. In another tab, login as `committee@emasjid.pk`.
2. Land on `/committee`. Find the new request.
3. Click **Cast my vote**, type a note, click **Approve**.
4. **Expect**: tally pill switches to `1 approve`, request still **Pending**,
   *"Your vote: APPROVE"* badge is visible. A real email lands in
   `committee@emasjid.pk` (committee notification — only on first submit).

### D. Committee member A2 records a reject via API
1. From the developer's terminal:
   ```
   curl -X POST http://127.0.0.1:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"wb494929@gmail.com","password":"committee123"}'
   ```
2. Use that token to call
   `POST /api/fund-requests/<id>/vote` with `{"vote":"reject", "note":"..."}`.
3. Reload `/committee`. **Expect**: tally `1 approve · 1 reject`.

### E. Two real-Gmail committee members vote concurrently
1. Login as `ara786125@gmail.com` in a fresh browser window (use Chrome
   private window to avoid session collisions). Vote reject or approve.
2. Login as `dawood.ahmed786678@gmail.com` in another window and vote the
   opposite.
3. **Expect**: all votes recorded, one entry per member. UI tally shows
   whichever mix the two chose.

### F. Admin sees the tally in the Fund Requests table
1. Login as `admin@emasjid.pk`.
2. Visit `/admin/fund-requests`.
3. **Expect**: the row for the request shows a `2✓ · 1✗` style tally
   column + a `Finalize` action button (replaces the button with
   *"Awaiting votes"* when tally count = 0).

### G. Admin finalizes a majority decision
1. On `/admin/fund-requests`, click **Finalize** on the Bilal Test row.
2. **Expect**: modal opens with title "Finalize Fund Request", shows the
   committee vote chips, an auto-outcome banner ("Outcome will be set to
   **approved** based on the majority") and a Final Note textarea.
3. Type a note and click **Finalize & notify**.
4. **Expect**: row flips to **Approved** (green pill), and the requester
   receives an email with the final note (use a real Gmail as the
   requester to verify).

### H. Tied votes force an explicit override
1. As `committee@emasjid.pk` and `wb494929@gmail.com`, vote **approve** and
   **reject** on a new request so the tally reads `1 approve · 1 reject`.
2. As admin, click Finalize.
3. **Expect**: modal shows the warning *"Votes are tied. Pick a side to
   override"* and two side buttons. The *Finalize & notify* button stays
   disabled until one side is picked. Pick *Approve* → request becomes
   Approved with the override tracked in `finalNote`.

### I. Cannot vote on already-decided request
1. After step G, log in as `committee@emasjid.pk` again and try to cast
   another vote via the API or UI.
2. **Expect**: `409 Request is already approved; cannot vote`.

### J. Email actually lands in a real Gmail inbox
1. Use a request whose `requesterEmail` is one of your own Gmail
   addresses.
2. Run through G. Open Gmail and check you received **"Fund Request
   Approved – E-Masjid"** (or "Rejected").

### K. Cross-mosque isolation
1. Login as `admin2@emasjid.pk` (Al-Rahman).
2. Visit `/admin/fund-requests`.
3. **Expect**: zero Al-Noor requests visible. No leaks.

### L. Deactivated committee mid-flow
1. As `manager@emasjid.pk` (or via a future Phase-15 admin tool), flip one
   of the Al-Noor committee accounts to `isActive: false`.
2. Try to cast a vote with that account.
3. **Expect**: `401 Account is deactivated`. Existing votes they cast
   earlier still count toward the tally.

### M. Concurrent finalize race
1. As admin, fire two `POST /:id/finalize` requests back-to-back (e.g. via
   two `curl` tabs).
2. **Expect**: one returns `200` and flips to `approved`, the other
   returns `409 Request is already finalized`. The DB row ends up with
   exactly one `finalizedBy` + `finalizedAt`.