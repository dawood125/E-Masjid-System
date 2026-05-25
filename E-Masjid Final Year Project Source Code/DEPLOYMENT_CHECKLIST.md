# Deployment Checklist (Final Demo / Production)

## 1) Environment Setup

- [ ] Copy `backend/.env.example` into secure deployment secret store.
- [ ] Set `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRE`, `CLIENT_URL`, and `PORT`.
- [ ] Set Stripe keys: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.
- [ ] Set SMTP keys (`MAIL_*` preferred or `EMAIL_*` legacy).

## 2) Build and Test Gate

- [ ] `backend`: `npm test`
- [ ] `frontend`: `npm run lint`
- [ ] `frontend`: `npm run build`

## 3) Data and Seed

- [ ] Run seed in non-production demo environments only: `npm run seed`
- [ ] Confirm admin, committee, scholar, and community demo accounts exist.

## 4) Stripe Verification

- [ ] Configure webhook endpoint: `/api/donations/webhook`.
- [ ] Run one live test-mode donation checkout.
- [ ] Record results in `STRIPE_E2E_PROOF.md`.

## 5) Smoke Test After Deploy

- [ ] Login (admin/community/scholar/committee) works.
- [ ] Core modules load with mosque scoping:
  - [ ] Prayer times
  - [ ] Events
  - [ ] Announcements
  - [ ] Donations and expenses
  - [ ] Fund request workflow
  - [ ] Nikah booking workflow

## 6) Rollback Plan

- [ ] Keep previous backend release artifact/version available.
- [ ] Keep previous frontend build available.
- [ ] If failure appears, rollback and re-run smoke tests.
