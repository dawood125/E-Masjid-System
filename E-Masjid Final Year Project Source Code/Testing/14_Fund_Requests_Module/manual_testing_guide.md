# 14 User Fund Request Module — manual testing guide

Run this after `backend/utils/seed.js` has been loaded and the seed
script has created the Al-Noor committee accounts (`committee@emasjid.pk`
+ 3 real Gmail accounts) so the voting half of the flow has enough
material to test.

Community accounts seeded for Al-Noor:
- `user@emasjid.pk` / `user1234` (the requester used in scenarios A–L)
- `user2@emasjid.pk` / `user1234` (used in scenarios H to verify scoping)

Admin account: `admin@emasjid.pk` / `admin1234` (Al-Noor admin)
Committee accounts: `committee@emasjid.pk`, `wb494929@gmail.com`, `ara786125@gmail.com`, `dawood.ahmed786678@gmail.com` (all `committee123`)

---

## Scenario A — Empty state

1. Log in as `user2@emasjid.pk` (fresh community user with no requests).
2. Navigate to `/my-requests`.
3. **Expected:** Inbox icon, *"No Requests Yet — You haven't submitted
   any fund requests."* and a green CTA *"Submit a Request"*.

## Scenario B — Form blocks too-short reason

1. Log in as `user@emasjid.pk`.
2. Navigate to `/fund-request`.
3. Fill name, email, phone, amount=12500, category=Medical, terms=true.
4. Type only *"too short"* in the reason textarea.
5. Click *Submit Request*.
6. **Expected:** Inline red error *"Reason must be at least 30 characters."*

## Scenario C — Form blocks zero amount

1. From the same form, fill amount=0.
2. Fill a 30-char reason (any text).
3. Click *Submit Request*.
4. **Expected:** Inline red error *"Valid amount is required."*

## Scenario D — Form blocks unchecked terms

1. From the same form, fill amount=12500, a 30-char reason, but uncheck
   *I agree to the terms of the fund policy*.
2. Click *Submit Request*.
3. **Expected:** Inline red error *"You must agree to the terms before
   submitting."*

## Scenario E — Form blocks empty name

1. Clear the *Full Name* field. Leave the other required fields populated.
2. Click *Submit Request*.
3. **Expected:** Inline red error *"Full name is required."*

## Scenario F — Successful submission via UI

1. Fill the form with valid data:
   - Full Name: `Hassan Umoor Test`
   - Email: `hassan.phase14@example.com`
   - Phone: `0305-9998877`
   - Amount: `12500`
   - Category: `Medical`
   - Reason: `Phase 14 E2E — father needs urgent heart medication for the next 60 days and insurance is not covering it; please consider.`
   - Terms: checked
2. Click *Submit Request*.
3. **Expected:** Success page with heading *"Request Submitted"* and a
   reference ID formatted `FR-YYYYMMDD-XXXX`.

## Scenario G — MyRequests shows pending card with amber banner

1. Navigate to `/my-requests` as the same user.
2. Find the card from Scenario F.
3. **Expected:**
   - Status pill: amber *"Pending Review"*
   - Reason text matches what you typed
   - Amber banner: *"Committee has not started voting yet. We will email
     you once a final decision is made."*
   - No *"Final Decision"* card is shown (still pending).

## Scenario H — Cross-user scoping

1. In a separate browser/incognito window, log in as `user2@emasjid.pk`.
2. Navigate to `/my-requests`.
3. **Expected:** The Hassan card from Scenario F is **not** here. user2
   sees only their own requests (or the empty state if they have none).

## Scenario I — Live tally appears after first vote

Continuing from G:
1. In a separate window, log in as `committee@emasjid.pk`.
2. Open the committee dashboard, find the Hassan card, vote **Approve**.
3. Refresh the community user's `/my-requests`.
4. **Expected:** The amber banner is gone; instead the *"Committee is
   reviewing"* card shows `1 thumb_up` and `of 1 vote(s)`.

## Scenario J — Tally persists as more votes arrive

1. In the committee window, vote as `wb494929@gmail.com` (Approve) and
   `ara786125@gmail.com` (Reject).
2. Refresh the community user's `/my-requests`.
3. **Expected:** Tally reads `2 thumb_up · 1 thumb_down of 3 vote(s)`.

## Scenario K — Admin finalize surfaces Final Decision

1. In a third window, log in as `admin@emasjid.pk`.
2. Go to admin fund requests, find the Hassan row, click *Finalize*.
3. The modal shows the same `2✓ · 1✗` tally and an auto outcome of
   *Approved (majority approve)*.
4. Type a final note (e.g., *"Verified home visit confirmed medication
   need; please collect at office."*).
5. Click *Confirm Finalize*.
6. Refresh the community user's `/my-requests`.
7. **Expected:**
   - Status pill: green *"Approved"*
   - Green *"Final Decision"* card with the admin's name + timestamp
     + the final note you typed
   - Green hint *"Please visit the mosque office during working hours
     to collect your assistance."*

## Scenario L — Legacy fallback still works

1. The seed script created one legacy approved request for
   `user@emasjid.pk` with `reviewedBy` / `reviewNote` set and
   `finalizedBy` / `finalNote` unset.
2. Navigate to `/my-requests` as that user.
3. **Expected:** The legacy card still renders the *"Final Decision by
   Abdullah Manager"* line and the *"Verified by committee with local
   reference and documents."* note — the fallback to the legacy fields
   is verified in Section 7 of the Playwright test.

## Scenario M — Rejected with admin override also shows Final Decision

1. Create a tied request (1 approve + 1 reject from two different
   committee accounts).
2. As admin, click *Finalize*; the modal shows a *Tied votes — please
   pick an outcome* dropdown.
3. Pick `Rejected`, type a note, click *Confirm Finalize*.
4. Refresh the community user's `/my-requests`.
5. **Expected:** Red *"Final Decision"* card with `Rejected by <admin
   name>`, the timestamp, the final note, and no office-visit hint
   (approved-only).