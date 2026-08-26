# 99 Final E2E Tests — manual testing guide

> Single end-to-end checklist for the FYP defense. Each scenario covers
> multiple modules and verifies a cross-cutting user journey.

## Pre-flight

1. `cd backend && npm run seed && npm run dev` (port 5000)
2. `cd frontend && npm run dev` (port 5173)
3. Open four browser profiles (chrome regular + 2 incognito + edge private)
   so different roles can be active simultaneously
4. Verify the seeded accounts exist (`manager@emasjid.pk`, `admin@emasjid.pk`,
   `admin.rahman@emasjid.pk`, `user@emasjid.pk`, `user2@emasjid.pk`,
   `committee@emasjid.pk` + 3 Gmail committee accounts)

## Journey A — Community submits, committee reviews, admin finalizes

Touches: Fund Requests (Phase 13) + Committee (Phase 13) + Email (Phase 18) +
Admin Dashboard (Phase 19).

1. Window A (community) — submit a fund request at `/fund-request`.
2. Window D (committee) — open `/committee`, verify the card appears, cast 3 votes.
3. Window A — verify live tally on `/my-requests`.
4. Window C (admin) — finalize from `/admin/fund-requests`.
5. Window A — verify green "Final Decision" card + office-visit hint.
6. Gmail for the requester — verify exactly ONE email ("Fund Request Approved").

**PASS criterion:** every step in the chain works, only one email, tally
correctly updates.

## Journey B — Stripe online donation

Touches: Stripe (Phase 17) + Email (Phase 18) + Admin Dashboard (Phase 19) +
Transparency (Phase 10).

1. Logged out, open `/donate` for Al-Noor.
2. Enter PKR 500, Sadaqah, your real email.
3. Click Donate → redirect to Stripe Checkout → use test card
   `4242 4242 4242 4242` → success.
4. Redirected back to `/donate?success=1&session_id=cs_test_…`.
5. **Expected:** "Confirming your donation" spinner, then "JazakAllah Khair!"
   within ~3s.
6. Log in as Al-Noor admin → `/admin/donations` → verify PKR 500 row visible.
7. Transparency page `/transparency` → verify total increased by 500.
8. Admin Dashboard `/admin/dashboard` → verify "Total Donations" updated.

**PASS criterion:** donation lands in admin table, transparency total
reflects it, dashboard reflects it, no double row from a replayed webhook.

## Journey C — Multi-tenant isolation

Touches: Auth (Phase 1) + Navbar (Phase 3) + Announcements (Phase 6) +
Events (Phase 7) + Donations (Phase 9) + Transparency (Phase 10) +
Fund Requests (Phase 13/14) + Manager Multi-Mosque (Phase 16) +
Admin Dashboard (Phase 19).

For each pair (Al-Noor vs Al-Rahman), verify:

1. Log in as Al-Noor admin → every `/admin/*` page shows ONLY Al-Noor rows.
2. Log in as Al-Rahman admin → every `/admin/*` page shows ONLY Al-Rahman rows.
3. DevTools console probe:
   `fetch('/api/donations/admin?mosqueId=<other-masjid-id>', {headers: {Authorization: 'Bearer ' + localStorage.authToken}}).then(r => r.status)`
   → expect 403.
4. Repeat probe for expenses, events, announcements, fund-requests,
   committee — all return 403.

**PASS criterion:** no admin can read or write another masjid's data via UI
or API.

## Journey D — Inactive masjid lifecycle

Touches: Auth (Phase 1) + Manager Multi-Mosque (Phase 16).

1. As manager, deactivate Al-Noor.
2. Attempt to log in as `admin@emasjid.pk` → expect 403 with
   "Your masjid is currently deactivated".
3. Re-activate Al-Noor → log in again → expect 200.
4. Deactivate again → reuse an old JWT (from a previously-logged-in
   browser) → expect 403 on the next request.
5. While Al-Noor is inactive, as Al-Rahman admin → verify Al-Noor
   disappears from the public homepage and navbar dropdown.
6. Reactivate → Al-Noor reappears everywhere.

**PASS criterion:** lifecycle is fully enforced — no zombie sessions, no
public-facing ghost masjid.

## Journey E — Committee member deactivation mid-flow

Touches: Committee (Phase 13/15) + Email (Phase 18).

1. Open `wb494929@gmail.com` as Window E, navigate to `/committee`.
2. As Al-Noor admin (Window C), deactivate `wb494929@gmail.com`.
3. In Window E, refresh `/committee` → expect redirect to `/login` with
   "Your account is deactivated".
4. Reactivate in Window C → Window E can log back in.
5. Submit a new fund request as community → verify `wb494929@gmail.com`
   does NOT receive the committee email.
6. Verify the other 3 committee members DO receive it.

**PASS criterion:** deactivated member cannot vote, does not receive
email, the other 3 still work.

## Journey F — Webhook retry path

Touches: Stripe (Phase 17) + NFRs (Phase 21 BUG-011).

1. Open the Stripe dashboard test event tool.
2. Send `checkout.session.completed` with `metadata.amount='0'` to the
   webhook endpoint.
3. **Expected:** Stripe receives 500 → automatically retries the event
   (verify in Stripe dashboard).
4. Once Stripe retries with valid metadata → verify donation row appears
   in admin table.
5. The Donate success page should poll for the donation and show
   "JazakAllah Khair!" once Stripe finishes.

**PASS criterion:** malformed events trigger Stripe retry, never silently
lost.

## Journey G — Public homepage scope

Touches: Navbar (Phase 3) + Marketing (Phase 4.5) + Manager Multi-Mosque
(Phase 16).

1. Public homepage → switch dropdown to Al-Rahman → verify prayer times,
   events, announcements, hero slides, marketing stats ALL update to
   Al-Rahman's numbers.
2. Switch to a new manager-created masjid → verify all the above show that
   masjid's (empty) state, NOT Al-Noor's.

**PASS criterion:** every public page section is reactive to mosque
selection, no stale Al-Noor content bleeding through.

## Journey H — Responsive

Touches: Responsive (Phase 20).

At 320px, 768px, 1024px, 1280px, 1440px viewports:

1. Homepage hero, navbar, footer all fit.
2. Login form is reachable and usable at 320px.
3. Admin Donations table scrolls horizontally inside its container, not
   the page.
4. Modal edit dialogs (events, announcements, donations) are within
   viewport bounds.

**PASS criterion:** no horizontal page scroll, every interactive element
reachable.

## Result checklist

| Journey | Modules covered | Result |
|---|---|---|
| A — Fund request lifecycle | 13 + 14 + 15 + 18 + 19 | _____ |
| B — Stripe donation | 17 + 18 + 19 + 10 | _____ |
| C — Multi-tenant isolation | 1 + 3 + 6 + 7 + 9 + 10 + 13 + 14 + 16 + 19 | _____ |
| D — Masjid lifecycle | 1 + 16 | _____ |
| E — Committee deactivation | 13 + 15 + 18 | _____ |
| F — Stripe webhook retry | 17 + 21 | _____ |
| G — Public homepage scope | 3 + 4.5 + 16 | _____ |
| H — Responsive | 20 | _____ |
