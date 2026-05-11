# E-Masjid manual verification checklist

Use this after automated checks (`backend`: `npm test`; `frontend`: `npm run lint`, `npm run build`). Run API from [`backend`](backend) with a valid [`backend/.env`](backend/.env.example) and the UI from [`frontend`](frontend) (`npm run dev`).

## Environment

- [ ] `MONGODB_URI` reaches the intended database (Atlas or local).
- [ ] `JWT_SECRET`, `CLIENT_URL`, and `PORT` match your setup.
- [ ] Stripe: test keys and `STRIPE_WEBHOOK_SECRET` for the environment you use (see Webhooks below).
- [ ] Mailtrap (or other SMTP): `EMAIL_*` variables set; inbox available for committee/requester messages when emails are not mocked.

## Auth and session

- [ ] Register a new community user; login and logout.
- [ ] Session restore after refresh when `authToken` is present.
- [ ] JWT expiry (`JWT_EXPIRE`) behaves as expected (re-login after expiry).

## Roles (spot-check each role you use in production)

- [ ] **Community:** home/prayer/events (as implemented), donate (cash + online if Stripe enabled), transparency, fund request submit, “my requests” if present.
- [ ] **Committee:** fund request list scoped to mosque; approve/reject with review note; requester email in Mailtrap (if not using test mocks).
- [ ] **Admin:** admin login; donations; fund requests; other admin modules you rely on.
- [ ] **Manager:** mosque list/create/edit from API; module toggles if used.
- [ ] **Scholar:** scholar dashboard routes you use.

## Mosque selector

- [ ] Public mosque list loads in the navbar.
- [ ] Changing mosque updates pages that use `activeMosqueId` (donations, transparency, prayer times, etc.).
- [ ] After login, users with `mosqueId` see storage aligned with that mosque (see `AuthContext` + navbar).

## Stripe (test mode)

1. Start backend on the same `PORT` as in `.env`.
2. In a separate terminal, forward webhooks (install [Stripe CLI](https://stripe.com/docs/stripe-cli)):

   ```bash
   stripe listen --forward-to http://localhost:5000/api/donations/webhook
   ```

   Use the signing secret the CLI prints as `STRIPE_WEBHOOK_SECRET` while testing locally, **or** register the endpoint in the Stripe Dashboard and use that secret.

- [ ] Start an online donation from the UI; complete Checkout with a [test card](https://stripe.com/docs/testing).
- [ ] Webhook runs without signature errors; donation appears in the database / admin views as paid (per your implementation).

## Regression notes

Record date, tester, and any failure (steps, expected vs actual). Fix in code and re-run automated tests before release.

## Secrets

If `.env` or keys were copied into chat, tickets, or a shared repo, **rotate** database passwords, Stripe keys, webhook secrets, and SMTP credentials.
