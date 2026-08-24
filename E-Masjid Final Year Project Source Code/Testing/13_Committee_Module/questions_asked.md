# 13 Committee Voting Module — questions asked

## Q1: How many committee members does each masjid have in production?

**Answer**: Today's seed ships **4 Al-Noor committee members** (1 synthetic
dev account `committee@emasjid.pk` plus 3 real-Gmail accounts the developer
controls — `wb494929@gmail.com`, `ara786125@gmail.com`, and
`dawood.ahmed786678@gmail.com`). The other three masjids have a single
committee account each. Phase 15 lets admins add or remove members in any
masjid from the admin panel, so the number per masjid is unbounded in
practice.

## Q2: How does the admin know which members have voted?

**Answer**: The committee vote panel shows **per-member vote pills** (green
`approve` / red `reject` with the member's name) below the tally. After the
admin opens the finalize modal, the same pill row is repeated inside the modal
so the admin can see *exactly* who voted what before clicking Finalize &
notify.

## Q3: Why doesn't the system email the requester right after every committee
vote?

**Answer**: Per the FYP flow, the requester is informed **once**, at the end —
after the admin finalizes. Emailing after every individual vote would
confuse the requester and could pressure committee members. The committee
emails go to *all* committee members when the request is first created, so
the whole team has visibility from day one.

## Q4: What happens when a committee member deactivates between vote and
finalize?

**Answer**: The vote they cast remains in the tally (no retroactive
deletion), but:
- they can no longer cast a new vote (`401` from the `protect` middleware),
- they cannot call `finalize` (admin-only, `403`),
- the admin can still finalize based on whatever votes are on file.

This was verified in `fund_voting.test.js > Voting then deactivation`.

## Q5: Do tied votes auto-finalize?

**Answer**: No. Tied votes require the admin to explicitly pass
`overrideStatus: 'approved' | 'rejected'` — otherwise `POST /:id/finalize`
returns **409** with message *"Votes are tied; admin must provide
overrideStatus"*. The Playwright Section 9 covers this path end to end.

## Q6: Will the legacy single-reviewer endpoint still work?

**Answer**: Yes, intentionally. `PUT /api/fund-requests/:id` (the old
single-reviewer flow) is unchanged and still works for masjids that don't
yet use multi-member committee voting. The new vote/finalize endpoints are
additive — both code paths coexist on the same `FundRequest` collection
(which still carries the legacy `reviewedBy`/`reviewNote` fields for
backward compatibility).