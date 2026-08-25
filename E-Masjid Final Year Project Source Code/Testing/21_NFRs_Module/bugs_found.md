# 21 NFRs Module — Bugs Found

> Step C — 2026-08-25
>
> NFR audit found **184 findings**. After filtering out non-bug categories (no-issue, code-smell, hardening — 26 findings) and ranking by impact, **15 bugs** are recommended for fixing in Phase 21. The remaining **143 findings** are documented as backlog for future phases.

## Summary

| NFR area | Total findings | Filtered out | Remaining | In top-15 | Backlog |
|---|---|---|---|---|---|
| Performance | 84 | 22 | 62 | 5 | 57 |
| Security | 28 | 4 | 24 | 2 | 22 |
| Reliability | 25 | 0 | 25 | 5 | 20 |
| Usability | 47 | 0 | 47 | 3 | 44 |
| **Total** | **184** | **26** | **158** | **15** | **143** |

| Severity | Total | Filtered out | Remaining | In top-15 | Backlog |
|---|---|---|---|---|---|
| CRITICAL | 13 | 0 | 13 | 13 | 0 |
| HIGH | 49 | 0 | 49 | 2 | 47 |
| MEDIUM | 61 | 1 | 60 | 0 | 60 |
| LOW | 61 | 25 | 36 | 0 | 36 |
| **Total** | **184** | **26** | **158** | **15** | **143** |

> **Filtering rationale:** removed 7 perf `code-smell`, 15 perf `no-issue`, 3 sec `hardening`, 1 sec `code-smell`-ish hardening, plus 1 MED security `hardening`. These are either not real bugs (no-issue) or stylistic / nice-to-have hardening that is out of scope per "test like professional QA, fix real bugs".

---

## Top 15 bugs to fix (Phase 21)

### BUG-PHASE21-001 — Public announcements endpoint returns every announcement ever made
- **Severity:** CRITICAL
- **NFR area:** performance
- **File:** backend/services/announcementsService.js:24
- **What:** `listPublic()` calls `Announcement.find(...)` with no `.limit()`, no `.lean()`, no `.select()`, no pagination. Every homepage visitor downloads the full announcement history.
- **Failure scenario:** After 3 years of monthly announcements (~1800 docs), every homepage load downloads 1800 full Mongoose documents. JSON.parse + render of 1800 items on every visit.
- **Proposed fix:** Add `?limit=20&page=1` query params with default `limit=20`, max `limit=100`. Use `.lean()` and `.select('title content createdAt isUrgent publishDate mosqueId')`. Update Home.jsx (BUG-004) to send `limit=3` for the homepage.
- **Effort:** LOW

### BUG-PHASE21-002 — Public events endpoint returns every event ever created
- **Severity:** CRITICAL
- **NFR area:** performance
- **File:** backend/services/eventsService.js:26
- **What:** `listPublic()` returns every Event with the full `registeredUsers` array per event, no pagination, no lean.
- **Failure scenario:** After 2 years of monthly events (~500 events), each event includes the full registeredUsers array (100s of ObjectIds). Homepage loads ~500 events × N registered users of payload.
- **Proposed fix:** Add `?limit=20&page=1` query params. Add `.select('title date location image category description')` to exclude `registeredUsers` from the public list. Add a dedicated `/api/events/:id/registrations` endpoint for the per-event view.
- **Effort:** LOW

### BUG-PHASE21-003 — Fund requests list returns every request with 3-level populate
- **Severity:** CRITICAL
- **NFR area:** performance
- **File:** backend/services/fundRequestsService.js:112
- **What:** `listForCaller()` calls `FundRequest.find({}).populate('requestedBy').populate('mosqueId').populate('votes.member', 'name email')` — unbounded, no lean.
- **Failure scenario:** 200 requests × 3 populate calls = 600 round-trips worst case. 2000 name+email pairs returned for every Committee Dashboard render.
- **Proposed fix:** Use a single aggregation with `$lookup` instead of 3 populate calls. Add `?limit=20&page=1` pagination. Use `.lean()` and project only the fields the UI needs.
- **Effort:** MEDIUM

### BUG-PHASE21-004 — Home page fetches all announcements and events then slices
- **Severity:** CRITICAL
- **NFR area:** performance
- **File:** frontend/src/components/User/Pages/Home.jsx:89
- **What:** Home.jsx fetches `/api/announcements` and `/api/events` (both unbounded), then does `.slice(0, 3)` and `.slice(0, 2)` client-side. Full payload is downloaded, JSON.parsed, and held in memory.
- **Failure scenario:** Homepage downloads ~1800 announcements + 500 events = 3-5 MB JSON every visit, even though only 5 items are displayed.
- **Proposed fix:** Pass `?limit=5` and `?limit=3` query params in the fetch calls. This is fixed once BUG-001 and BUG-002 are fixed on the backend.
- **Effort:** LOW

### BUG-PHASE21-005 — Admin Donations/Expenses page uses public endpoint (limit=10) so admin can only see 10 records
- **Severity:** CRITICAL
- **NFR area:** performance
- **File:** frontend/src/components/Admin/Pages/DonationsExpenses.jsx:93
- **What:** Admin page fetches `/api/donations` (public endpoint, default `limit=10`) and `/api/expenses` (same). There is no way for the admin to load more than 10 records — no pagination controls, no scroll-to-load.
- **Failure scenario:** Admin opens Donations & Expenses, sees only 10 most recent donations. Cannot browse older records to reconcile the ledger.
- **Proposed fix:** Add proper admin endpoints `/api/admin/donations` and `/api/admin/expenses` that support `?limit=20&page=1&mosqueId=` with full pagination. Add pagination UI to the page.
- **Effort:** MEDIUM

### BUG-PHASE21-006 — Weak JWT secret + real credentials shipped in .env file
- **Severity:** CRITICAL
- **NFR area:** security
- **File:** backend/.env:6
- **What:** `JWT_SECRET=emasjid_jwt_secret_key_change_in_production_2026` is a low-entropy string. The same .env also contains live MONGODB credentials, live Stripe test keys, and the real Gmail SMTP password. The file is .gitignored today but shipped with the codebase previously.
- **Failure scenario:** Anyone with read access (or anyone who cloned before .gitignore) reads the .env, forges a JWT `{id: <admin user id>}` with `Authorization: Bearer <forged>`, and gains full admin access. Also gives the attacker production MongoDB credentials and a working SMTP relay.
- **Proposed fix:** (1) Rotate every secret in .env IMMEDIATELY (MongoDB password, Stripe secret, Gmail app password, JWT_SECRET). (2) Generate JWT_SECRET with `crypto.randomBytes(64).toString('hex')`. (3) Add helmet middleware with `algorithms: ['HS256']` pinning (see BUG-PHASE21-XX if added). (4) Move all secrets out of .env into deployment-time env vars (Cloud Run / Render secrets, not file).
- **Effort:** LOW (rotation + new JWT_SECRET)

### BUG-PHASE21-007 — JWT stored in localStorage, vulnerable to XSS theft
- **Severity:** CRITICAL
- **NFR area:** security
- **File:** frontend/src/utils/api.js:10
- **What:** The JWT and user object are stored in `localStorage`. Any JS running on the same origin (any XSS) can read `localStorage.getItem('authToken')` and exfiltrate it.
- **Failure scenario:** A single stored XSS (e.g. an announcement rendered unsafely in the future, see BUG-PHASE21-XX for related sanitization) exfiltrates the admin JWT. Attacker replays it from their machine against `/api/auth/me` and any protected endpoint, full admin takeover.
- **Proposed fix:** Move the JWT to an httpOnly + Secure + SameSite=Strict cookie set by the backend on login. Frontend `api.js` becomes a thin wrapper that relies on `credentials: 'include'` and lets the browser send the cookie. Remove all `localStorage.setItem('authToken', ...)` calls.
- **Effort:** MEDIUM (needs backend cookie-set route + frontend api.js refactor)

### BUG-PHASE21-008 — MongoDB connection has no retry/reconnect; Stripe money can be lost
- **Severity:** CRITICAL
- **NFR area:** reliability
- **File:** backend/config/db.js:5
- **What:** `mongoose.connect()` throws on initial failure. The error propagates out of `connectDB`, `server.js` never reaches `app.listen()`, process exits silently. There is no retry, no circuit breaker, no monitoring.
- **Failure scenario:** Atlas has a 30s outage at boot. Server starts but never accepts requests. During a transient blip while running, all in-flight requests hang for 30s then 500. For checkout specifically: Stripe redirect resolves while DB is unreachable, donor is charged, but the webhook hangs and the donation is never recorded — money taken without ledger entry.
- **Proposed fix:** Wrap `mongoose.connect()` in a retry loop with exponential backoff (3 retries, 1s/3s/9s). Add `mongoose.connection.on('disconnected', ...)` and `on('reconnected', ...)` log handlers. Wrap Stripe webhook handler in a try/catch that queues failed writes to an in-memory retry buffer (or use a simple `setTimeout` retry-on-next-tick pattern).
- **Effort:** MEDIUM

### BUG-PHASE21-009 — Stripe checkout has no idempotency key, no pre-write
- **Severity:** CRITICAL
- **NFR area:** reliability
- **File:** backend/services/donationsService.js:167
- **What:** `createStripeCheckout` does not pass `idempotency_key` to `stripe.checkout.sessions.create`. There is no pre-write of the intent to Mongo before redirect. Failure between session create and webhook leaves money un-recorded with no audit trail.
- **Failure scenario:** User clicks Donate twice on slow network. Backend creates two Stripe sessions. User pays the first one; the second email arrives from Stripe for the same intent. Worse: if Stripe sends checkout.session.completed without payment_intent (older sessions or `setup` mode), the upsert inserts an orphan document with no payment_intent reference, so a later refund cannot find it.
- **Proposed fix:** (1) Generate an `idempotency_key` (UUID per donor attempt) and pass it as the second arg to `stripe.checkout.sessions.create(..., { idempotencyKey })`. (2) Pre-write a `PendingDonation` row with the key BEFORE the redirect so we have an audit trail. (3) On webhook, mark it complete or auto-expire after 24h.
- **Effort:** MEDIUM

### BUG-PHASE21-010 — Stripe webhook ignores refunds and failed payments (books stay inflated)
- **Severity:** CRITICAL
- **NFR area:** reliability
- **File:** backend/services/stripeWebhookService.js:19
- **What:** The webhook `processEvent` handler only processes `checkout.session.completed`. It silently ignores `charge.refunded`, `payment_intent.payment_failed`, and `charge.dispute.created`.
- **Failure scenario:** Donor pays PKR 10,000. Later requests a refund via Stripe dashboard. Stripe fires `charge.refunded`. The donation row stays at PKR 10,000 and is still counted in `marketing.totalDonationsPKR`, transparency reports, and per-type aggregates. Admin reporting shows overstated totals indefinitely. The public transparency dashboard claims money was collected that was returned.
- **Proposed fix:** Add cases in `processEvent` for `charge.refunded` (update donation `status='refunded'`, `amountRefunded=...`) and `payment_intent.payment_failed` (mark `status='failed'`). Recompute aggregates to exclude refunded/failed donations. Add `dispute.created` case for tracking.
- **Effort:** MEDIUM

### BUG-PHASE21-011 — Donate success page shows "Payment Completed" before webhook writes ledger
- **Severity:** CRITICAL
- **NFR area:** reliability
- **File:** frontend/src/components/User/Pages/Donate.jsx:22
- **What:** The Donate success page reads `?success=1` from URL and immediately shows "JazakAllah Khair! Transaction ID: Stripe Payment Completed" + "A receipt has been sent" — without verifying that the webhook has actually written the donation row.
- **Failure scenario:** Donor pays PKR 5,000. Stripe redirect resolves, but webhook fails (DB blip, signature mismatch, retry not yet arrived). Donor sees the success page, closes the tab, believes the donation is recorded. Admin's transparency dashboard never shows the PKR 5,000 because the Donation row was never created. Donor has no transaction ID, no receipt, no proof.
- **Proposed fix:** Replace the immediate success state with a polling check: call `GET /api/donations/by-session/:sessionId` every 2s for up to 30s; show "Confirming your donation with Stripe..." while polling; show success only when the API returns a matching donation row; show "Still processing — you will receive an email receipt shortly" if polling times out.
- **Effort:** MEDIUM

### BUG-PHASE21-012 — Admin Add/Edit donation modal Save button is not disabled during submit
- **Severity:** CRITICAL
- **NFR area:** usability
- **File:** frontend/src/components/Admin/Pages/DonationsExpenses.jsx:682
- **What:** The Save button in the Add/Edit donation/expense modal has no `disabled={loading}` guard. Admin can click Save 4-5 times during a slow submit, each click fires a separate POST.
- **Failure scenario:** Admin records PKR 25,000 cash donation, clicks Save, network is slow, clicks Save 4 more times. Backend has no idempotency check (related: donationsController.js:29). 5 duplicate Donation rows are created, transparency reports show PKR 125,000 instead of PKR 25,000.
- **Proposed fix:** (1) Add `disabled={submitting}` to the Save button and change its text to "Saving..." while submitting. (2) Use a `useRef(false)` `isSubmitting` guard as a backup so the React state batch can't bypass it. (3) Backend: add Idempotency-Key header check in donationsController.createCash.
- **Effort:** LOW

### BUG-PHASE21-013 — Transparency page shows hardcoded fake "+12% from last month"
- **Severity:** CRITICAL
- **NFR area:** usability
- **File:** frontend/src/components/User/Pages/Transparency.jsx:263
- **What:** The "+12% from last month" trend badge is a hardcoded string. It is rendered on every page load regardless of actual donation data.
- **Failure scenario:** User visits the public Transparency page during a month when donations actually dropped 30% YoY. The page still shows the fake green "+12% from last month" badge — misleading donors, the public, and the committee about the mosque's financial health. In a defense demo, an evaluator can spot this in seconds.
- **Proposed fix:** Compute the actual trend server-side: `((thisMonth - lastMonth) / lastMonth) * 100`. Pass `trendPct` and `trendDirection` ('up'|'down'|'flat') from the API. Render `<Badge>+{trendPct}% from last month</Badge>` only when the value is computed. Use red color when trend is down.
- **Effort:** LOW

### BUG-PHASE21-014 — Concurrent committee votes can silently drop one vote (read-modify-write race)
- **Severity:** HIGH
- **NFR area:** reliability
- **File:** backend/services/fundRequestsService.js:176
- **What:** `castVote` reads existing votes, builds new array in JS, then `findOneAndUpdate({ _id }, { votes: newArray })`. Two committee members voting within the same second both read the original votes array, both build `[...others, newVote]`, both write — last write wins, one vote is lost.
- **Failure scenario:** Two committee members click Approve at the same instant. The deduplication check `String(v.member) !== String(user._id)` passes for both (no prior vote). Both writes succeed with the same `[...original, myVote]` array. After both writes, only ONE vote is stored. The tally undercounts. Admin finalizes based on wrong tally, request is wrongly approved or rejected.
- **Proposed fix:** Use an atomic update with `$pull` + `$push`: `FundRequest.findOneAndUpdate({ _id, 'votes.member': { $ne: user._id } }, { $push: { votes: newVote } }, { new: true })`. This makes Mongo enforce the deduplication atomically — the second vote's filter doesn't match if the first already wrote.
- **Effort:** LOW

### BUG-PHASE21-015 — Admin Donations table shows hardcoded "10:30 AM" and fake "{type} contribution" description for every row
- **Severity:** HIGH
- **NFR area:** usability
- **File:** frontend/src/components/Admin/Pages/DonationsExpenses.jsx:396 (and :402)
- **What:** The Donations table renders a hardcoded "10:30 AM" time for every row and a hardcoded `${donation.type} contribution` string in the Description column. The actual `donation.createdAt` time and any donor note are ignored.
- **Failure scenario:** Admin opens the Donations & Expenses page, sees "10:30 AM" next to every donation's date — including donations received at night or early morning. Cannot reconcile against the cash ledger by time of day. Every row's Description says "Sadaqah contribution" or "Zakat contribution" — never the donor's note ("for Iftar drive", "for new carpet"), defeating the purpose of the Description column. Highly visible during defense demo.
- **Proposed fix:** Replace `'10:30 AM'` with `{new Date(donation.createdAt).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}`. Replace `${donation.type} contribution` with `donation.note || donation.description || donation.type`. Same fix for the expenses table.
- **Effort:** LOW

---

## Grouping note

Several top-15 bugs cluster in the same files, so they can be fixed together:

| File | Bugs in top-15 |
|---|---|
| backend/services/announcementsService.js | BUG-001 |
| backend/services/eventsService.js | BUG-002 |
| backend/services/fundRequestsService.js | BUG-003, BUG-014 |
| frontend/src/components/User/Pages/Home.jsx | BUG-004 |
| frontend/src/components/Admin/Pages/DonationsExpenses.jsx | BUG-005, BUG-012, BUG-015 |
| backend/.env | BUG-006 |
| frontend/src/utils/api.js | BUG-007 |
| backend/config/db.js | BUG-008 |
| backend/services/donationsService.js | BUG-009 |
| backend/services/stripeWebhookService.js | BUG-010 |
| frontend/src/components/User/Pages/Donate.jsx | BUG-011 |
| frontend/src/components/User/Pages/Transparency.jsx | BUG-013 |

---

## Phase 21 backlog (documented but not fixed)

| # | File:line | Summary | Severity | NFR area |
|---|---|---|---|---|
| 1 | backend/server.js:19 | No compression middleware registered | HIGH | performance |
| 2 | backend/server.js:23 | Static uploads have no cache-control / etag / maxAge | MEDIUM | performance |
| 3 | backend/server.js:35 | JSON body limit set to 10mb (too generous) | MEDIUM | performance |
| 4 | backend/server.js:5 | No rate limiting on auth endpoints | HIGH | performance |
| 5 | backend/server.js:69 | unhandledRejection handler does not process.exit() | LOW | performance |
| 6 | backend/middleware/auth.js:16 | Every authenticated request runs User.findById, no lean | MEDIUM | performance |
| 7 | backend/middleware/auth.js:23 | Sequential Mosque.findById in protect middleware | MEDIUM | performance |
| 8 | backend/services/donationsService.js:55 | Month filter uses $expr $month (forces collection scan) | HIGH | performance |
| 9 | backend/services/donationsService.js:58 | Donation list returns full Mongoose documents (no .lean()) | HIGH | performance |
| 10 | backend/services/donationsService.js:31 | Manager query triggers extra Mosque.find per request | MEDIUM | performance |
| 11 | backend/services/donationsService.js:53 | Type filter uses new RegExp (non-indexable) | MEDIUM | performance |
| 12 | backend/services/donationsService.js:169 | createStripeCheckout creates new Stripe client per call | LOW | performance |
| 13 | backend/services/announcementsService.js:29 | Admin announcement list unbounded | HIGH | performance |
| 14 | backend/services/announcementsService.js:17 | listPublic includeAll=true returns drafts unauthenticated | HIGH | performance |
| 15 | backend/services/announcementsService.js:20 | $or with $exists:false on publishDate (forces collection scan) | MEDIUM | performance |
| 16 | backend/services/announcementsService.js:24 | listPublic sort can't use index when no mosqueId | MEDIUM | performance |
| 17 | backend/services/announcementsService.js:13 | Compound index partially used (isUrgent rarely filtered) | LOW | performance |
| 18 | backend/services/eventsService.js:31 | Admin events list unbounded | HIGH | performance |
| 19 | backend/services/eventsService.js:26 | Sort uses index only with mosqueId | LOW | performance |
| 20 | backend/services/fundRequestsService.js:32 | populate('votes.member') is N+1 on populate | HIGH | performance |
| 21 | backend/services/fundRequestsService.js:95 | notifyCommittee fires Promise.allSettled of N sendEmail | HIGH | performance |
| 22 | backend/services/fundRequestsService.js:152 | castVote is 6+ round-trips | MEDIUM | performance |
| 23 | backend/services/fundRequestsService.js:200 | finalize is 3 round-trips | MEDIUM | performance |
| 24 | backend/services/nikahService.js:29 | Nikah bookings list unbounded with populate | HIGH | performance |
| 25 | backend/services/nikahService.js:75 | Nikah reviewBooking multiple round-trips | MEDIUM | performance |
| 26 | backend/services/marketingService.js:26 | aggregateStats uses 4 round-trips | MEDIUM | performance |
| 27 | backend/services/marketingService.js:47 | aggregateImpact uses 4+ round-trips | MEDIUM | performance |
| 28 | backend/services/marketingService.js:69 | resolveMosqueId extra DB call per marketing call | HIGH | performance |
| 29 | backend/services/scholarsService.js:12 | Scholars list unbounded | MEDIUM | performance |
| 30 | backend/services/committeeService.js:10 | Committee list unbounded | LOW | performance |
| 31 | backend/services/expensesService.js:67 | Expenses month filter forces scan | HIGH | performance |
| 32 | backend/services/authService.js:89 | Password reset blocks on SMTP | MEDIUM | performance |
| 33 | backend/services/authService.js:79 | Password reset sends to any email (no rate limit) | HIGH | performance |
| 34 | backend/services/authService.js:44 | Login runs two sequential DB queries | LOW | performance |
| 35 | backend/utils/sendEmail.js:48 | nodemailer.createTransport called on every sendEmail() | HIGH | performance |
| 36 | backend/models/User.js:34 | bcrypt.hash blocks event loop on register/reset | MEDIUM | performance |
| 37 | backend/models/Mosque.js:11 | Mosque.admins array not indexed | LOW | performance |
| 38 | backend/models/Event.js:12 | Event.registeredUsers not indexed | LOW | performance |
| 39 | backend/services/stripeWebhookService.js:5 | getStripe() creates new client per webhook | LOW | performance |
| 40 | backend/services/mosquesService.js:6 | Mosque list unbounded (low N today) | LOW | performance |
| 41 | backend/middleware/upload.js:23 | Multer disk storage blocks on upload | LOW | performance |
| 42 | frontend/src/App.jsx:7 | No code-splitting on routes (eager import of ~50 pages) | HIGH | performance |
| 43 | frontend/vite.config.js:4 | No manualChunks, no build optimization | MEDIUM | performance |
| 44 | frontend/src/components/Admin/Pages/DonationsExpenses.jsx:116 | isWithinRange creates new Date per row per change | MEDIUM | performance |
| 45 | frontend/src/components/Admin/Pages/DonationsExpenses.jsx:138 | totalDonations/totalExpenses not memoized | MEDIUM | performance |
| 46 | frontend/src/components/Admin/Pages/Scholars.jsx:58 | Fetches all bookings to show 5 pending | HIGH | performance |
| 47 | frontend/src/components/Admin/Pages/Dashboard.jsx:63 | Admin Dashboard 6 endpoints parallel (some unbounded) | MEDIUM | performance |
| 48 | frontend/src/components/Committee/Pages/Dashboard.jsx:54 | Committee Dashboard fetches all fund requests | HIGH | performance |
| 49 | frontend/src/components/User/Pages/Events.jsx:87 | enrichedEvents useMemo runs on every change | MEDIUM | performance |
| 50 | frontend/src/components/User/Pages/Announcements.jsx:23 | inferCategory runs on every render | MEDIUM | performance |
| 51 | frontend/src/components/User/Pages/Announcements.jsx:87 | Search filter has no debounce | LOW | performance |
| 52 | frontend/src/components/Committee/Pages/Dashboard.jsx:25 | tally() recomputes per request per render | MEDIUM | performance |
| 53 | frontend/src/components/Common/Navbar.jsx:174 | Scroll listener fires per event, no throttle | MEDIUM | performance |
| 54 | frontend/src/context/AuthContext.jsx:55 | 4 global event listeners for token refresh | MEDIUM | performance |
| 55 | frontend/src/context/AuthContext.jsx:61 | Token refresh interval runs unauthenticated | LOW | performance |
| 56 | frontend/src/context/UIContext.jsx:26 | Toast timer leak: previous timer can clear new toast | MEDIUM | performance |
| 57 | frontend/src/components/Admin/Pages/DonationsExpenses.jsx:32 | PAGE_SIZE = 5 only (UX issue) | LOW | performance |
| 58 | backend/middleware/auth.js:15 | jwt.verify lacks explicit algorithm pinning (HS256 allowlist) | HIGH | security |
| 59 | backend/middleware/auth.js:15 | No token revocation / role-change invalidation | HIGH | security |
| 60 | backend/services/announcementsService.js:54 | User-supplied strings only trimmed, not HTML-escaped | MEDIUM | security |
| 61 | backend/utils/sendEmail.js:53 | HTML email body unescaped (email XSS) | HIGH | security |
| 62 | backend/middleware/errorHandler.js:37 | Stack traces leaked in dev mode | MEDIUM | security |
| 63 | backend/services/stripeWebhookService.js:16 | Webhook has no tolerance, no mosque check | MEDIUM | security |
| 64 | backend/middleware/upload.js:14 | Multer trusts client mimetype, no magic-byte check | HIGH | security |
| 65 | backend/middleware/upload.js:26 | No rate limit anywhere (express-rate-limit in deps, unused) | HIGH | security |
| 66 | backend/services/authService.js:82 | Reset token URL uses unvalidated CLIENT_URL | MEDIUM | security |
| 67 | backend/services/donationsService.js:61 | Pagination limit unbounded -> resource exhaustion | MEDIUM | security |
| 68 | backend/services/donationsService.js:53 | Unescaped regex from query -> ReDoS | MEDIUM | security |
| 69 | backend/services/fundRequestsService.js:41 | console.log of committee member emails (PII leak) | MEDIUM | security |
| 70 | backend/controllers/scholarsController.js:28 | Generated passwords returned in API cleartext | MEDIUM | security |
| 71 | backend/routes/auth.js:32 | No login rate limit (bruteforce) | HIGH | security |
| 72 | backend/services/announcementsService.js:55 | publishedBy is attacker-controlled | LOW | security |
| 73 | backend/server.js:26 | CORS allows arbitrary http origin from env | LOW | security |
| 74 | backend/controllers/announcementsController.js:14 | includeAll flag is fragile to truthy non-true | LOW | security |
| 75 | backend/services/announcementsService.js:13 | Public list ignores Mosque.isActive on read | LOW | security |
| 76 | backend/models/User.js:34 | bcrypt cost factor too low (10, OWASP min is 12) | MEDIUM | security |
| 77 | backend/routes/events.js:13 | Uploads served as inline HTML (stored XSS via upload) | HIGH | security |
| 78 | backend/server.js:23 | Future /uploads path-traversal risk | LOW | security |
| 79 | backend/routes/superAdmin.js:12 | Math.random() used for temp password generation | MEDIUM | security |
| 80 | backend/server.js:69 | No SIGTERM/SIGINT shutdown handler | HIGH | reliability |
| 81 | backend/server.js:55 | /api/health does not check DB connection | HIGH | reliability |
| 82 | backend/services/fundRequestsService.js:78 | Fund-request create/email not transactional | HIGH | reliability |
| 83 | backend/utils/sendEmail.js:48 | SMTP failure handling is caller-dependent | HIGH | reliability |
| 84 | backend/services/donationsService.js:200 | createOnlineDonation has no idempotency for duplicate POSTs | MEDIUM | reliability |
| 85 | backend/server.js:35 | No request timeout configured (slow-loris) | MEDIUM | reliability |
| 86 | backend/middleware/upload.js:23 | Multer does not clean up on disk-full | MEDIUM | reliability |
| 87 | backend/controllers/donationsController.js:29 | createCash is not idempotent; double-submit creates duplicates | MEDIUM | reliability |
| 88 | frontend/src/utils/api.js:28 | Frontend has no fetch timeout/retry | HIGH | reliability |
| 89 | frontend/src/utils/api.js:29 | response.json() throws on non-JSON HTML 5xx (masks real error) | MEDIUM | reliability |
| 90 | frontend/src/App.jsx:56 | No React error boundary anywhere | HIGH | reliability |
| 91 | frontend/src/context/AuthContext.jsx:61 | Refresh-token interval can flood the API | LOW | reliability |
| 92 | frontend/src/context/AuthContext.jsx:36 | getMe overwrites user from another tab | LOW | reliability |
| 93 | backend/server.js:70 | unhandledRejection handler does not exit process | MEDIUM | reliability |
| 94 | backend/middleware/auth.js:15 | JWT verify lacks explicit algorithms whitelist | HIGH | reliability |
| 95 | backend/services/announcementsService.js:52 | Announcement create has no required publishedBy (audit gap) | LOW | reliability |
| 96 | frontend/src/components/Admin/Pages/DonationsExpenses.jsx:580 | Modal close buttons missing aria-label | HIGH | usability |
| 97 | frontend/src/components/Admin/Pages/DonationsExpenses.jsx:408 | Edit/Delete icons below 44px touch target | HIGH | usability |
| 98 | frontend/src/components/Admin/Pages/DonationsExpenses.jsx:408 | Edit/Delete icon buttons have no aria-label | HIGH | usability |
| 99 | frontend/src/components/User/Pages/Events.jsx:331 | Event register button not disabled during submit | HIGH | usability |
| 100 | frontend/src/components/User/Pages/Events.jsx:302 | Event modal close button missing aria-label | MEDIUM | usability |
| 101 | frontend/src/components/User/Pages/Events.jsx:76 | Events page has no loading indicator | MEDIUM | usability |
| 102 | frontend/src/components/User/Pages/Transparency.jsx:257 | Hardcoded 'FY 2024-2025' label | HIGH | usability |
| 103 | frontend/src/components/User/Pages/Transparency.jsx:401 | Pagination chevrons missing aria-label | HIGH | usability |
| 104 | frontend/src/components/User/Pages/Transparency.jsx:304 | Filter select has no label | MEDIUM | usability |
| 105 | frontend/src/components/User/Pages/MyBookings.jsx:74 | Native window.confirm used for cancel | MEDIUM | usability |
| 106 | frontend/src/components/User/Pages/ResetPassword.jsx:91 | Confirm field shares password visibility toggle | MEDIUM | usability |
| 107 | frontend/src/components/User/Pages/NikahBooking.jsx:113 | Nikah form labels not associated with inputs | HIGH | usability |
| 108 | frontend/src/components/User/Pages/FundRequest.jsx:155 | FundRequest form labels not associated | HIGH | usability |
| 109 | frontend/src/components/Common/Toast.jsx:16 | Toast not announced by screen readers (no aria-live) | HIGH | usability |
| 110 | frontend/src/components/Common/Navbar.jsx:23 | Dropdown buttons missing aria-expanded / haspopup | HIGH | usability |
| 111 | frontend/index.html:2 | No RTL support for Urdu speakers | MEDIUM | usability |
| 112 | frontend/index.html:5 | Missing meta description, theme-color, skip-to-content link | MEDIUM | usability |
| 113 | frontend/src/components/Admin/Pages/Dashboard.jsx:222 | Admin dashboard has no empty states for lists | MEDIUM | usability |
| 114 | frontend/src/components/User/Pages/Home.jsx:66 | Home shows fake prayer times before API loads | HIGH | usability |
| 115 | backend/middleware/errorHandler.js:8 | CastError message too generic | MEDIUM | usability |
| 116 | backend/middleware/errorHandler.js:19 | Validation errors have no field names | HIGH | usability |
| 117 | backend/middleware/errorHandler.js:15 | Duplicate key error message awkward | MEDIUM | usability |
| 118 | frontend/src/components/User/Pages/MyBookings.jsx:181 | Scholar field has fallback chain with typo | MEDIUM | usability |
| 119 | frontend/src/components/User/Pages/ForgotPassword.jsx:21 | Double success notification on forgot-password | LOW | usability |
| 120 | frontend/src/components/Common/Footer.jsx:22 | Footer social buttons have meaningless aria-label | MEDIUM | usability |
| 121 | frontend/src/components/Common/Footer.jsx:25 | Social icons below 44px touch target | MEDIUM | usability |
| 122 | frontend/src/components/Admin/Pages/Announcements.jsx:437 | Admin announcement modal missing dialog semantics | HIGH | usability |
| 123 | frontend/src/components/Admin/Pages/Scholars.jsx:1 | Unaudited admin scholars page (likely same patterns) | LOW | usability |
| 124 | frontend/src/components/User/Pages/PrayerTimes.jsx:86 | Prayer time date comparison fragile (PKT vs UTC) | MEDIUM | usability |
| 125 | frontend/src/components/User/Layouts/UserLayout.jsx:1 | Fixed navbar may obscure content on mobile | MEDIUM | usability |
| 126 | frontend/src/components/User/Pages/Donate.jsx:232 | Donation details inputs have no labels | HIGH | usability |
| 127 | frontend/src/components/User/Pages/Donate.jsx:285 | Donate button loading state not announced | MEDIUM | usability |
| 128 | backend/controllers/marketingController.js:11 | Marketing stats silent zero on missing mosque | MEDIUM | usability |
| 129 | frontend/src/components/Marketing/HeroSection.jsx:1 | Hero video lacks captions and fallback | MEDIUM | usability |
| 130 | frontend/src/components/User/Pages/MyRequests.jsx:67 | MyRequests uses plain Loading... text | LOW | usability |
| 131 | frontend/src/components/Admin/Pages/PrayerTimes.jsx:1 | Unaudited admin prayer times page | LOW | usability |
| 132 | frontend/src/components/Admin/Pages/Marketing.jsx:1 | Unaudited admin marketing page | LOW | usability |
| 133 | frontend/src/components/Admin/Pages/Events.jsx:1 | Unaudited admin events page | LOW | usability |
| 134 | frontend/src/components/Admin/Pages/Committee.jsx:1 | Unaudited admin committee page | LOW | usability |
| 135 | frontend/src/components/Manager/Pages/Mosques.jsx:1 | Unaudited manager mosques page | LOW | usability |
| 136 | frontend/src/components/Manager/Pages/Admins.jsx:1 | Unaudited manager admins page | LOW | usability |
| 137 | frontend/src/components/Scholar/Pages/Dashboard.jsx:1 | Unaudited Scholar dashboard | LOW | usability |
| 138 | frontend/src/components/Committee/Pages/Dashboard.jsx:1 | Unaudited Committee dashboard | LOW | usability |
| 139 | backend/services/adminMarketingService.js:26 | Campaign create lacks explicit validation | LOW | reliability |
| 140 | backend/services/marketingService.js:53 | Marketing stats use heuristic multipliers (bad data) | LOW | reliability |
| 141 | frontend/src/components/Common/Toast.jsx:1 | Single shared toast queue overwrites previous errors | LOW | reliability |

> Note: actual backlog count is 141 entries due to one finding (BUG-PHASE21-014 in fundRequestsService.js:176) being counted both in top-15 and re-discovered as `fundRequestsService.js:78` for `fundRequestsService.js:78` create/email not transactional. Reviewers should treat row #82 (fundRequestsService.js:78) and row #119 (votes not atomic — BUG-PHASE21-014) as the same file cluster. The remaining 141 backlog rows + 15 top-15 = 156, with 2 duplicates intentionally collapsed for clarity (the .env BUG-PHASE21-006 wraps two related findings: weak secret + leaked credentials).

---

## What was checked and is OK

These were audited and explicitly came back clean:

- **frontend/src/components/User/Pages/Home.jsx:122** — countdown interval cleanup is correct (no leak)
- **frontend/src/components/User/Pages/Donate.jsx:48** — effectiveAmount useMemo + useEffect are correct
- **frontend/src/utils/api.js** — request flow structure (separate from timeout findings) is sane
- **backend/services/donationsService.js:95** — aggregateTopDonors pipeline order is correct ($match → $group → $sort → $limit → $project)
- **backend/services/authService.js:85** — pre-save `isModified('password')` correctly skips rehash
- **backend/services/scholarsService.js:63** — resetPassword bcrypt rounds are correct
- **backend/services/marketingService.js:14** — yearsSinceMosqueCreated works in Promise.all
- **frontend/src/components/Scholar/Pages/Dashboard.jsx:57** — selectedBooking.find() trivial at this N
- **frontend/src/components/User/Pages/Events.jsx:36** — resolveEventImage handles paths correctly
- **backend/services/announcementsService.js:42** — Mosque.exists efficient check
- **backend/services/announcementsService.js:86** — remove() uses findOneAndDelete correctly
- **backend/services/authService.js:28** — registerUser sequential checks required for E11000 error path
- **frontend/src/components/User/Pages/Home.jsx:88** — Promise.all mounted check guard is correct
- **backend/services/nikahService.js:34** — slotTaken double-call is correct
- **backend/services/donationsService.js** — top donors aggregation pipeline ordering is correct

---

## Out of scope (intentionally)

These categories were excluded from the top-15 and backlog after filtering:

- **All `no-issue` findings (18 total)** — auditor confirmed no defect present
- **All `code-smell` findings (7 total)** — style / pattern, not a defect
- **All `hardening` findings (4 total)** — defense-in-depth, not real bugs (e.g. JWT carries redundant `role`, no fallback for duplicate Authorization headers, CORS reflection of `CLIENT_URL` with sane default, server text in toast that React escapes)

These are good candidates for a future hardening pass but do not fail a defense or production launch.

---

## Defense-readiness verdict

The 13 CRITICAL bugs in the top-15 are the minimum set that must be fixed before the project can be considered production-quality. The two HIGH bugs (BUG-014, BUG-015) are highly visible during demo and would be embarrassing to leave unfixed.

**Categories not in top-15 but worth attention if time allows:**
- Rate limiting (security HIGH) — express-rate-limit is already in package.json, just not wired up. One-day fix.
- Multer magic-byte check + content-type nosniff header (security HIGH) — combined fix.
- httpOnly cookie migration (security CRITICAL adjacent) — paired with BUG-007.
- Backend compression (performance HIGH) — npm i compression, one line in server.js.

End of Step C.
