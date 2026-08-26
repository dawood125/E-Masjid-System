# 99 Final E2E Tests — questions asked

> Open questions for the supervisor before production deployment. These are
> not bugs — they are decisions that affect deployment configuration,
> monitoring, and ongoing ops.

## Q1 — HTTPS / domain

The local dev stack uses HTTP only (Express on 5000 + Vite on 5173). For a
public deployment:

- The JWT is in an httpOnly cookie (Phase 21 BUG-007) with `SameSite=Lax`
  in dev and `SameSite=Strict` in production.
- Stripe webhook signature verification requires HTTPS in production.
- Background API calls (cron, monitoring) won't work against plain HTTP.

**My recommendation:** deploy behind a TLS-terminating proxy (Cloudflare,
Caddy, or a managed PaaS). Confirm the intended domain (e.g. `emasjid.pk`
or a Vercel/Netlify subdomain).

## Q2 — Real Stripe keys

The current `.env` uses Stripe **test mode** keys (`sk_test_…`,
`pk_test_…`, `whsec_…`). For real donations:

- Switch to live keys in `.env`: `STRIPE_SECRET_KEY=sk_live_…`,
  `STRIPE_WEBHOOK_SECRET=whsec_…`.
- Update `CLIENT_URL` to the production domain.
- Register the production webhook endpoint in the Stripe dashboard pointing
  to `https://<domain>/api/donations/webhook`.
- Update the publishable key in the frontend.

**My recommendation:** leave the test keys in `.env` for FYP defense;
switch to live only after the demo.

## Q3 — Real Gmail / SMTP credentials

Phase 18 confirmed the 4 Gmail accounts work for committee notifications.
For production:

- The 4 personal Gmail accounts used in dev are **not appropriate** for
  production committee notifications — committee members should have
  `@emasjid.pk` or their own organizational addresses.
- The current `EMAIL_FROM` and Reply-To header are personal accounts —
  should be `noreply@emasjid.pk` or similar.
- Gmail's free SMTP has a 500-email/day limit; for any real volume, swap
  to SendGrid / Mailgun / AWS SES.

**My recommendation:** for FYP defense, keep the current Gmail setup. For
production, decide on a proper transactional email provider.

## Q4 — Monitoring

Currently the backend logs to stdout (no persistent log aggregation). For
production:

- Error tracking: Sentry or Rollbar (both have free tiers).
- Uptime monitoring: UptimeRobot (free) pinging `/api/health` every 5 min.
- Log aggregation: simple `pm2 logs` for now; better with Datadog/Logtail.

**My recommendation:** add Sentry (free) before any external launch. The
`/api/health` endpoint already returns 200 — wire UptimeRobot to it.

## Q5 — Backups

For this project:

- Self-hosted dev: a simple cron job + `mongodump` to a local backup
  folder is sufficient.
- Atlas: enable the free tier backup (daily snapshot, 7-day retention).
- Test data: the seed script can be re-run at any time, but the demo
  should keep a clean DB. Export a snapshot after the seed runs and store
  it in `backups/`.

**My recommendation:** Atlas free tier + a one-time snapshot after seed
runs for the demo.

## Q6 — Rate limiting (in `package.json`, not yet wired)

`express-rate-limit` is in `backend/package.json` but not yet registered
in `server.js`. This is NFR-PHASE21 backlog item #4. For production:

- 5 login attempts per 15 min per IP.
- 30 API requests per min per IP for unauthenticated routes.
- 300 API requests per min per IP for authenticated routes.

**My recommendation:** add in a 1-day hardening pass before any external
pilot. Not a defense blocker.

## Q7 — Compression / etag

Phase 21 NFR backlog: `compression` middleware not registered, `/uploads`
has no cache-control headers. For production:

- `npm i compression`, one line in `server.js`.
- Set `Cache-Control: public, max-age=86400` on `/uploads/*`.
- `etag: true` (already on by default in Express).

**My recommendation:** add with rate limiting — total 1-day hardening sprint.

## Q8 — Single-tenant deployment vs. multi-tenant

Currently the system supports 4 masjids + 1 super manager in one MongoDB.
Two deployment models are possible:

- **Multi-tenant SaaS** (current architecture) — one server, many masjids.
  Manager is the "platform admin".
- **Single-tenant** — one masjid per deployment, no manager role.

For FYP defense: stay multi-tenant. For a real pilot in one masjid: still
multi-tenant, but only seed that masjid.

**My recommendation:** keep multi-tenant. It's the differentiator and
works for one or many.

## Q9 — Stripe webhook signature in production

`STRIPE_WEBHOOK_SECRET` in `.env` must match the endpoint signing secret
shown in the Stripe dashboard after you create the webhook. Phase 17
already verifies the signature in code — just the secret needs to be the
right one.

## Q10 — bcrypt cost factor

Phase 21 NFR backlog item #76: `bcrypt` rounds are currently 10. OWASP
recommends 12. **For the FYP defense**, 10 is fine (login is still ~80ms).
**For production**, bump to 12 — single-line change in `User.js`.

## Q11 — Helmet algorithm pinning

Phase 21 NFR backlog: `jwt.verify` doesn't explicitly allowlist `HS256`.
Adding `algorithms: ['HS256']` to the verify call is a one-line
defense-in-depth fix.

## Q12 — Pre-demo checklist

For the FYP defense:

- [ ] Re-run `node backend/utils/seed.js` 24h before the demo so the DB is
  in a known state.
- [ ] Start backend + frontend and verify `/api/health` returns 200.
- [ ] Log in once as each role and verify the dashboard loads.
- [ ] Submit one fund request, vote on it, finalize it (so the dashboard
  has live data to show).
- [ ] Make one Stripe test donation (so the Transparency page has recent
  activity).
- [ ] Have the 4 Gmail inboxes open in private windows so committee
  notifications are visible.
- [ ] Keep the developer console open — any unhandled rejection should be
  investigated live.

## Q13 — Comment removal in production code

Phase 21 (this cleanup pass) removed every comment from the backend and
frontend source. The reasoning was the FYP defense rule "no comments in
the code, code should look human-written". The trade-off is that any future
maintainer has to read the code rather than skim the comments.

**My recommendation:** keep the no-comment rule. Re-add a comment only if
a specific block genuinely needs an inline explanation that the code alone
cannot convey (very rare).

## Decision log

- 2026-06-05: PKR only, no scope creep on currency, environment = local for
  testing.
- 2026-08-24: Dev Gmails + synthetic emasjid.pk accounts re-seeded (B16-6).
- 2026-08-26: All Phase 99 questions deferred to "post-defense hardening
  sprint" — defense demo runs on local + test Stripe + dev Gmails.
