# 15 Committee Account Module — manual testing guide

Run this after `backend/utils/seed.js` has been loaded and the seed
script has created the Al-Noor committee accounts so the deactivate
half of the flow has real data to exercise.

Accounts seeded for Al-Noor:
- Admin: `admin@emasjid.pk` / `admin1234`
- Committee (1 synthetic + 3 real Gmail):
  `committee@emasjid.pk`, `wb494929@gmail.com`, `ara786125@gmail.com`,
  `dawood.ahmed786678@gmail.com` (all `committee123`)
- Community: `user@emasjid.pk` / `user1234`

Accounts seeded for Al-Rahman:
- Admin: `admin.rahman@emasjid.pk` / `admin123`
- Committee: `committee.rahman@emasjid.pk` / `committee123`

---

## Scenario A — Admin Committee page renders list

1. Log in as `admin@emasjid.pk`.
2. Navigate to `/admin/committee`.
3. **Expected:** Table with 4 committee rows (1 synthetic + 3 Gmail
   accounts). Each row shows name + initials avatar, email, phone,
   mosque name, an *Active* status pill, and a red trash button.

## Scenario B — Add Member form opens, validation fires

1. From the same page, click *Add Member*.
2. Fill email only (`not-an-email`).
3. Click *Create Member*.
4. **Expected:** Yellow warning toast *"Name and email are required"*
   OR the backend 400 *"Valid email is required"* surfaces inline.

## Scenario C — Create committee member

1. Fill the form with valid data:
   - Name: `Phase 15 Manual Tester`
   - Email: `phase15.manual@example.com`
   - Phone: `0301-5556677`
2. Click *Create Member*.
3. **Expected:** New row appears at the top of the list. A green toast
   shows the temp password (e.g., *"Temp password: a8j3kqx7"*). The
   member is `role: 'committee'`, `mosqueId` = Al-Noor, `isActive: true`.

## Scenario D — Toggle Active → Inactive

1. Find the row you just created.
2. Click the green *Active* pill.
3. **Expected:** Pill flips to a gray *Inactive* state, toast
   *"Status updated"* appears. Refresh — the pill stays *Inactive*.

## Scenario E — Login as the deactivated account is blocked

1. With the Phase 15 Manual Tester still inactive, open a separate
   browser/incognito window.
2. Try to log in as `phase15.manual@example.com` with the temp password.
3. **Expected:** Login fails with *"Account is deactivated"* (HTTP 403).

## Scenario F — Existing token of deactivated account is rejected

1. As `committee@emasjid.pk`, log in, copy the JWT token from
   DevTools > Application > Local Storage.
2. As admin, deactivate `committee@emasjid.pk` (click the *Active*
   pill — turns *Inactive*).
3. With the old token, try `GET /api/committee` (DevTools > Network).
4. **Expected:** HTTP 401 *"Account is deactivated. Please contact
   your administrator."*

## Scenario G — Deactivate-mid-vote edge case

1. Re-activate `committee@emasjid.pk`.
2. As community, submit a fresh fund request via `/fund-request`.
3. As `committee@emasjid.pk`, vote **Approve** in the committee
   dashboard. Note the tally shows `1 thumb_up`.
4. As admin, deactivate `committee@emasjid.pk`.
5. **Try** to change that committee member's vote (try clicking *Reject*
   in the committee dashboard while logged in as them in another
   window).
6. **Expected:** Request returns 401 *"Account is deactivated"* and the
   tally still shows only the original `1 thumb_up`. The vote they
   already cast is preserved (it's recorded in the database) but they
   cannot change it.

## Scenario H — Re-activate and vote again

1. As admin, reactivate `committee@emasjid.pk`.
2. As them, vote **Reject** on the same request (replace vote).
3. **Expected:** Vote succeeds (200), the tally flips to
   `1 thumb_down of 1 vote`. The atomic guard ensures only one entry
   per member.

## Scenario I — Cross-mosque isolation

1. Log in as `admin.rahman@emasjid.pk`.
2. Navigate to `/admin/committee`.
3. **Expected:** List shows only Al-Rahman committee members (zero
   Al-Noor rows). Trying `PUT /api/committee/<al-noor-id>` from this
   admin's DevTools console returns 404 *"Member not found"*.

## Scenario J — Delete member

1. As Al-Noor admin, find the Phase 15 Manual Tester row.
2. Click the red trash button.
3. **Expected:** Row disappears immediately. The user is fully removed
   from the database — they will not receive future committee emails
   and will not appear in any list.

## Scenario K — Re-creating with the deleted email

1. After Scenario J, try to *Add Member* again with the same email
   (`phase15.manual@example.com`).
2. **Expected:** New row is created. Email is unique across the entire
   database, but uniqueness is at the database level — once the row is
   deleted, the email is free again.

## Scenario L — API reject duplicate email across mosques

1. As Al-Noor admin, try to create a committee member with email
   `committee.rahman@emasjid.pk`.
2. **Expected:** 400 *"Email already registered"* (because Al-Rahman
   already has that email). The committee-role gate is what blocks
   cross-mosque reuse, but the email uniqueness check runs first.

## Scenario M — Toggle the original committee to Inactive

1. As admin, click the *Active* pill for `committee@emasjid.pk` to
   deactivate them.
2. Verify they appear as *Inactive* and their old JWT is rejected.
3. Re-activate them for the rest of the suite.