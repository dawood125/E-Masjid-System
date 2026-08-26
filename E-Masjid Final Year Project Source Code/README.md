# E-Masjid — Multi-Tenant Mosque Management Platform

A production-grade MERN-stack platform for managing multiple mosques under a single
super-admin (manager). Built as a Final Year Project covering authentication,
multi-tenant data scoping, committee voting, online donations via Stripe, and
real-time notifications via Gmail SMTP.

The system is currently seeded with **4 masjids in Sheikhupura, Pakistan** — all
managed by one platform operator (`manager@emasjid.pk`) — and serves four roles:
super-admin (manager), masjid admin, scholar, committee member, and community
user.

---

## Table of contents

1. [What is E-Masjid](#what-is-e-masjid)
2. [Roles & access](#roles--access)
3. [Tech stack](#tech-stack)
4. [Architecture](#architecture)
5. [Folder layout](#folder-layout)
6. [Local development](#local-development)
7. [Test accounts (seeded)](#test-accounts-seeded)
8. [Email / Gmail setup](#email--gmail-setup)
9. [Stripe setup](#stripe-setup)
10. [Multi-tenant scope rules](#multi-tenant-scope-rules)
11. [Testing](#testing)
12. [Deployment](#deployment)
13. [Operational notes](#operational-notes)
14. [Documentation map](#documentation-map)

---

## What is E-Masjid

E-Masjid is a single deployable platform that lets a single platform operator
(`manager`) administer multiple masjids in parallel, while each masjid still has
its own admin who sees only their own masjid's data. The community experience
is per-mosque: the public homepage, prayer times, announcements, events,
campaigns, transparency reports, and online donations are all scoped to the
masjid the visitor currently has selected in the navbar.

Core feature surface:

- **Public area** (no login): homepage, prayer times, announcements, events,
  featured campaign, transparency reports, donation form, fund-request form,
  nikah booking request, scholar directory, mosque search.
- **Community account**: submit fund requests, donate via Stripe, book nikah,
  select home masjid.
- **Committee account**: vote on fund requests from the masjid they serve.
- **Scholar account**: manage nikah bookings and prayer times.
- **Admin (per masjid)**: CRUD announcements, events, donations, expenses,
  scholars, committee members, prayer times, finalize fund requests.
- **Manager (super admin)**: full visibility across all masjids under their
  control — create/disable masjids, manage admin accounts, oversee donations,
  expenses, marketing content, and the platform's committee assignments.

---

## Roles & access

| Role | Scope | Key capabilities |
|---|---|---|
| **manager** (super admin) | All masjids where `managerId === user._id` | Create masjids, toggle `isActive`, manage admin accounts, view cross-mosque stats |
| **admin** | `user.mosqueId` only | CRUD for announcements / events / donations / expenses / scholars / committee / prayer times; finalize fund requests |
| **scholar** | `user.mosqueId` only | Manage nikah bookings, edit prayer times |
| **committee** | `user.mosqueId` only | Review and vote on fund requests; receive email notifications |
| **community** | `user.mosqueId` (if set) or global | Submit fund requests, donate online, book nikah, browse the public area |

The middleware at `backend/middleware/auth.js#protect` enforces role gating on
every request. Cross-mosque access is rejected with HTTP 403 even if a valid JWT
is presented for a different masjid.

---

## Tech stack

**Backend** — Node.js + Express, MongoDB (Mongoose), JWT (httpOnly cookie),
Stripe SDK, Nodemailer, Helmet, express-rate-limit, express-mongo-sanitize.

**Frontend** — React 18 + Vite, Tailwind CSS, Material Icons, React Router,
custom auth + mosque context, Axios-style fetch wrapper with credentials.

**Tooling** — Jest + Supertest (integration tests), ESLint, Prettier,
concurrently for dev orchestration, mongodb-memory-server for CI.

**Infra (dev)** — Single Node process on port 5000, Vite on 5173, local
MongoDB. Stripe CLI forwards webhooks to the local backend in development.

---

## Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                          Browser (React)                       │
│   Public pages  •  /login  •  /admin/*  •  /manager/*          │
└───────────────────────────────────────────────────────────────┘
                │   httpOnly cookie + Bearer header
                ▼
┌───────────────────────────────────────────────────────────────┐
│                   Express API (Node.js, port 5000)             │
│   routes/*  →  controllers/*  →  services/*  →  models/*       │
│                                                                │
│   middleware: auth (JWT + cookie) • helmet • mongoSanitize     │
│   middleware: errorHandler • validate • httpError              │
│                                                                │
│   Stripe webhook → services/stripeWebhookService               │
│   Email notifier  → utils/sendEmail  (Nodemailer / Gmail SMTP) │
└───────────────────────────────────────────────────────────────┘
                │   Mongoose
                ▼
┌───────────────────────────────────────────────────────────────┐
│                       MongoDB                                  │
│   mosques  •  users  •  announcements  •  events  •  donations │
│   expenses • prayerTimes • nikahBookings • scholars            │
│   fundRequests • committee • marketing: campaigns / testimonials │
│             / heroSlides                                       │
└───────────────────────────────────────────────────────────────┘
                ▲
                │  Webhook events (async)
┌───────────────────────────────────────────────────────────────�
│                            Stripe                              │
│   Checkout session  •  Webhooks:                                │
│     - checkout.session.completed                               │
│     - charge.refunded                                          │
│     - payment_intent.payment_failed                            │
└───────────────────────────────────────────────────────────────┘
```

---

## Folder layout

```
.
├── backend/                    Express + Mongoose API
│   ├── config/                 DB connection with retry + reconnect handlers
│   ├── controllers/            Thin HTTP layer
│   ├── middleware/             auth, errorHandler, validate, upload, httpError
│   ├── models/                 Mongoose schemas
│   ├── routes/                 Express routers
│   ├── services/               Business logic (vote atomicity, scoping, etc.)
│   ├── tests/integration/      Jest + Supertest suites
│   ├── utils/                  seed, generateToken, sendEmail, helpers
│   ├── server.js               Entry point
│   └── jest.config.js          Jest configuration
│
├── frontend/                   React + Vite SPA
│   ├── src/
│   │   ├── components/         Admin / Manager / Scholar / Committee / Common / Auth / Marketing
│   │   ├── context/            AuthContext, MosqueContext, UIContext
│   │   ├── hooks/              useForceLogoutOnMount + others
│   │   ├── pages/              Top-level routes
│   │   ├── utils/              api (fetch wrapper), constants, formatters, validation
│   │   ├── mocks/              Local fixtures used in development
│   │   ├── App.jsx             Router
│   │   └── main.jsx            Entry point
│   ├── public/                 Static assets
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
├── Testing/                    21 phase folders + 99 Final E2E
│   ├── 01_Auth_Module/         5 docs per phase
│   ├── 02_Forgot_Password_Module/
│   ├── 03_Navbar_Masjid_Selection/
│   ├── …
│   ├── 21_NonFunctional_Requirements_Module/
│   ├── 99_Final_E2E_Tests/
│
├── docs/                       Architecture diagrams, API reference
├── .gitignore
├── .env.example
├── README.md
└── package.json                Root workspace scripts (Playwright helpers)
```

---

## Local development

### Prerequisites

- Node.js **18+** (tested on Node 18 LTS)
- npm **9+**
- MongoDB running locally (or Atlas URI)
- A Gmail account with **App Passwords** enabled if you want real emails
- Stripe CLI if you want to forward webhooks locally

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env       # then fill in real values (see below)
npm run seed               # populates 4 masjids + users + donations + events
npm run dev                # http://localhost:5000
```

Required `.env` keys (see `backend/.env.example` for the full template):

```
MONGODB_URI=mongodb://127.0.0.1:27017/emasjid
JWT_SECRET=<64-char base64url random>
JWT_EXPIRE=8h
CLIENT_URL=http://localhost:5173

STRIPE_SECRET_KEY=sk_test_…
STRIPE_WEBHOOK_SECRET=whsec_…
STRIPE_PUBLISHABLE_KEY=pk_test_…

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=youraddress@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=youraddress@gmail.com
COMMITTEE_REPLY_TO=youraddress@gmail.com
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev                # http://localhost:5173
```

### 3. Stripe webhooks (optional, for testing donations)

```bash
stripe listen --forward-to http://localhost:5000/api/donations/webhook
```

Use the webhook signing secret Stripe CLI prints (`whsec_…`) and put it in
`STRIPE_WEBHOOK_SECRET` in `backend/.env`, then restart the backend.

---

## Test accounts (seeded)

After `npm run seed`, the following accounts exist. All passwords are
`pass1234` unless noted.

| Email | Role | Masjid | Notes |
|---|---|---|---|
| `manager@emasjid.pk` | manager | — | Super admin; manages all 4 masjids |
| `admin@emasjid.pk` | admin | Al-Noor | Primary seeded masjid |
| `admin.rahman@emasjid.pk` | admin | Al-Rahman | Sheikhupura #2 |
| `admin.falah@emasjid.pk` | admin | Al-Falah | Sheikhupura #3 |
| `admin.taqwa@emasjid.pk` | admin | Al-Taqwa | Sheikhupura #4 |
| `scholar@emasjid.pk` | scholar | Al-Noor | |
| `committee@emasjid.pk` | committee | Al-Noor | + 3 Gmail committee accounts |
| `user@emasjid.pk` | community | Al-Noor | + `user2@emasjid.pk` |
| `admin@emasjid.pk` / `admin123` | admin | Al-Noor | Quick-login account (no 2FA prompts) |

The 3 Gmail committee accounts (`wb494929@gmail.com`, plus two others from the
Gmail committee inbox set) are seeded so the committee voting flow can be
exercised against real Gmail recipients during manual QA.

---

## Email / Gmail setup

The backend uses Nodemailer with Gmail SMTP. Two configuration modes:

- **Dev / demo (recommended)**: enable **2-Step Verification** on your Google
  account, then generate an **App Password** at
  <https://myaccount.google.com/apppasswords>. Put that 16-character string in
  `EMAIL_PASS`. This is what the seed script's committee accounts rely on.
- **Production**: switch to a transactional provider (SendGrid, Mailgun, AWS
  SES). The interface in `backend/utils/sendEmail.js` already accepts a custom
  transporter via `EMAIL_HOST` / `EMAIL_PORT` / `EMAIL_SECURE`.

`EMAIL_FROM` is what recipients see in the From field.
`COMMITTEE_REPLY_TO` is the address that committee members see when they hit
"Reply" on a fund-request notification.

---

## Stripe setup

- Use **test mode** keys during development (`sk_test_…` / `pk_test_…`).
- For local webhook forwarding, install [Stripe CLI](https://stripe.com/docs/stripe-cli)
  and run `stripe listen --forward-to http://localhost:5000/api/donations/webhook`.
- The webhook handler in `backend/services/stripeWebhookService.js` is
  idempotent and handles three event types:
  - `checkout.session.completed` — creates or completes a Donation row.
  - `charge.refunded` — sets `status: 'refunded'` and records the refund id.
  - `payment_intent.payment_failed` — sets `status: 'failed'`.
- For production, swap to **live keys**, point the dashboard's webhook endpoint
  to `https://<your-domain>/api/donations/webhook`, and copy the production
  signing secret into `STRIPE_WEBHOOK_SECRET`. The handler is the same.

---

## Multi-tenant scope rules

The system enforces tenant isolation at three levels:

1. **JWT payload** carries `user.mosqueId` (admin / scholar / committee /
   community). `protect` middleware rejects requests where the user's masjid
   has been deactivated since the token was issued (returns HTTP 403).
2. **Service-layer scoping** — every service that lists records for a non-
   manager role filters by `user.mosqueId`. Managers can pass `?mosqueId=` but
   only for masjids whose `managerId === user._id`.
3. **Write-side atomicity** — fund-request voting uses an aggregation-pipeline
   update to atomically replace a member's prior vote (Phase 21 BUG-014 fix)
   without losing race-safety against concurrent votes from the same member.

The scope-leak verification scripts in `backend/utils/` are no longer needed
(the cleanup pass removed them) but the same coverage is now in
`backend/tests/integration/` Jest suites.

---

## Testing

### Automated (Jest + Supertest)

```bash
cd backend
npm test
```

6 integration suites cover auth, masjids, donations, scholars, nikah, fund
voting, and committee scope. MongoMemoryServer is used in tests so no live
MongoDB is required.

> **Windows note**: `mongodb-memory-server` downloads its mongod binary on
> first run. If it times out (default 10s), point it at the system mongod by
> passing `binary: { systemBinary: '<path>' }` in the test setup or by
> setting `MONGOMS_SYSTEM_BINARY` in the environment.

### Manual

End-to-end manual test guides live in `Testing/<NN>_<module>/manual_testing_guide.md`
for each phase. The top-level checklist for the FYP defense is the matrix in
`Testing/99_Final_E2E_Tests/manual_testing_guide.md` (Journeys A–H).

---

## Deployment

The codebase is designed to deploy as two services behind a TLS-terminating
proxy (Cloudflare, Caddy, or a managed PaaS).

### Backend

- **Host**: any Node.js-capable PaaS (Render, Railway, DigitalOcean App
  Platform, Fly.io) or a VPS with PM2 + nginx.
- **Process**: `node server.js` (or `npm start`); no build step.
- **Env**: production `.env` must include `JWT_SECRET`, `MONGODB_URI`,
  live `STRIPE_*` keys, and production `EMAIL_*`.
- **Health check**: `GET /api/health` returns 200 + a timestamp.
- **Logging**: stdout (the process emits structured log lines like
  `[mongo] connected to <dbname>`). Pipe to your log aggregator of choice.

### Frontend

- **Build**: `cd frontend && npm run build` outputs `dist/`.
- **Host**: any static host (Vercel, Netlify, Cloudflare Pages, or the same
  nginx serving the backend).
- **Env**: set `VITE_API_URL` to the production backend URL **before**
  building. The fallback in `frontend/src/utils/constants.js` is
  `http://localhost:5000` for development.

### MongoDB

- **Atlas** is the fastest path. Enable the free-tier backup (daily snapshot,
  7-day retention) and add a database user with read/write on `emasjid`.
- For self-hosted, schedule `mongodump` and copy the archive off-box.

### Hardening checklist (post-defense)

These items are tracked in `Testing/21_NonFunctional_Requirements_Module/`
as **non-blocking NFR backlog**. None block an FYP demo, all should be
addressed before any external pilot:

- `express-rate-limit` on `/api/auth/*` and the public read endpoints.
- `compression` middleware on every response.
- bcrypt cost factor 10 → 12 in `models/User.js`.
- `algorithms: ['HS256']` pinning in `utils/generateToken.js#verifyToken`.
- Cache-Control headers on `/uploads/*`.
- Structured request logging (pino / winston) + Sentry or similar.

---

## Operational notes

- **Session timeout** is controlled by `JWT_EXPIRE` in `backend/.env`
  (default `8h`). The frontend `AuthContext` polls `/api/auth/me` on
  mount and clears local state on a 401 so a logged-out user is not
  silently half-authenticated.
- **JWT secret rotation** is supported via `JWT_SECRET_OLD`. To rotate:
  generate a new secret, set `JWT_SECRET=<new>` and `JWT_SECRET_OLD=<previous>`,
  restart the backend. Tokens issued under the old secret keep working until
  they expire. After the last old token expires, drop `JWT_SECRET_OLD`.
- **Backups**: see the Deployment section above. The seed script is
  idempotent — running it on a fresh database produces a known state; running
  it on an existing database wipes and re-seeds.
- **Deactivating a masjid** (manager flow): sets `isActive: false`. All
  logins for that masjid's users are blocked, the public homepage drops the
  masjid from the navbar selector, and any pre-existing sessions are
  invalidated on the next protected request.

---

## Documentation map

| What | Where |
|---|---|
| Phase-by-phase manual QA | `Testing/<NN>_<module>/manual_testing_guide.md` |
| Phase-by-phase bugs found | `Testing/<NN>_<module>/bugs_found.md` |
| Phase-by-phase bugs fixed | `Testing/<NN>_<module>/bugs_fixed.md` |
| Phase-by-phase automated test results | `Testing/<NN>_<module>/test_results.md` |
| Open examiner questions per phase | `Testing/<NN>_<module>/questions_asked.md` |
| Cross-module end-to-end flows | `Testing/99_Final_E2E_Tests/manual_testing_guide.md` |
| Final pass/fail state | `Testing/99_Final_E2E_Tests/test_results.md` |
| NFR coverage (Phase 21) | `Testing/21_NonFunctional_Requirements_Module/` |
| Final Year report (96 pages) | `FinalYearDocumentation.md` |

---

Built as a Final Year Project by Dawood Ahmed, 2026.
