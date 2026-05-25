# NFR Verification Notes (Viva Readiness)

This document tracks non-functional requirement checks for the final demo build.

## Security

- Passwords are hashed via user model middleware (bcrypt).
- JWT auth enabled with configurable expiry (`JWT_EXPIRE`).
- Mosque-scoped access checks added on admin CRUD routes (events, announcements, expenses, nikah bookings).
- Secret handling: `.env` ignored in git; rotate leaked secrets immediately.

## Reliability

- Backend integration tests run with `mongodb-memory-server` only (never production DB).
- Email sending is mocked in tests to avoid external side effects.
- Seed script supports consistent demo data for multi-role scenarios.

## Performance (Baseline)

- Frontend production build generated successfully (`vite build`).
- API responses for core routes validated in integration tests (auth, donations, fund requests, committee, nikah).
- Recommendation: run Lighthouse for final screenshot evidence before viva.

## Availability / Recovery

- Weekly backup guidance documented in `README.md`.
- Stripe webhook flow documented in `MANUAL_TEST_CHECKLIST.md` and `STRIPE_E2E_PROOF.md`.

## Validation Commands

```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm run lint
npm run build
```
