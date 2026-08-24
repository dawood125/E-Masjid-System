# 14 User Fund Request Module — questions asked

These are the design questions that came up while verifying the community
side of the Fund Request flow end-to-end (form → submit → see pending
status → see live tally → see final decision).

| # | Question | Decision |
|---|---|---|
| **Q1** | Should the user be able to see *who* voted what before the admin finalizes? | **No.** The tally on `MyRequests` only shows `2✓ · 1✗` style counts, not the names. Committee members are protected from social pressure — same reason per-vote emails are not sent. The names only surface in the admin's finalize modal. |
| **Q2** | Should the form allow selecting a category like "Other" or is the enum fixed? | **Fixed enum.** `Medical / Education / Food / Shelter / Utilities / Other` only. The schema validator (`fundRequestCreate` in `backend/services/fundRequestsService.js`) rejects anything outside that enum with 400. |
| **Q3** | What if the community user submits with a `mosqueId` for a different masjid in the body? | **Rejected with 400** *"Cannot create a request for another mosque"*. The service layer always forces `user.mosqueId` from the JWT — the body field is ignored. Covered by the Phase 13 backend suite (`fund_voting.test.js > community cannot submit for another mosque`). |
| **Q4** | Can a community user re-submit a request to "bump" it? | **No.** The form has no `id` and always creates a new request. There is no edit endpoint exposed to the community role. A request that is rejected stays rejected; the user can submit a fresh request if circumstances change. |
| **Q5** | Does the requester get an email when the *first* vote is cast? | **No.** `notifyRequester` fires **only after `finalize`** (admin-only). Per-vote notification was deliberately removed in Phase 13 (bug **B13-4**) so the requester can't infer who voted which way. |
| **Q6** | After admin finalize, what does the requester see? | A `Final Decision` card with the admin's name + timestamp, the `finalNote`, and (if approved) a green hint *"Please visit the mosque office during working hours to collect your assistance."* If the request was finalized under the legacy single-reviewer flow, the `reviewedBy.name` / `reviewNote` fall back so old requests still render. |
| **Q7** | Can a community user from Al-Noor see a community user's request from Al-Rahman? | **No.** `MyRequests` calls `GET /api/fund-requests` which is filtered by `user._id`. The requester list is always self-scoped. Verified in section 8 of the Playwright test. |
| **Q8** | What if the community user logs in before any requests exist? | **Empty state.** The page renders an `inbox` icon card *"No Requests Yet — You haven't submitted any fund requests."* with a CTA button back to the form. |
| **Q9** | Is the form accessible to anonymous (logged-out) users? | **No.** The form lives at `/fund-request` which is behind the community role gate. Anonymous navigation redirects to `/login`. |
| **Q10** | How long does the "amber no votes yet" banner stay? | Until at least one committee member votes. As soon as a vote lands, the banner is replaced by the *"Committee is reviewing"* tally card. Both states are gated by `req.status === 'pending'`. |

All ten decisions are reflected in the live UI / backend code; none of
them required new features or scope expansion.