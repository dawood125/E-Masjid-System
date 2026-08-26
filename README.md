# E-Masjid System

> **Final Year Project** — A multi-tenant web-based mosque management and community services platform built for Pakistani mosques.

[![Status](https://img.shields.io/badge/Status-Completed-success)](#)
[![University](https://img.shields.io/badge/University-University%20of%20the%20Punjab-blue)](#)
[![Session](https://img.shields.io/badge/Session-2022--2025-informational)](#)
[![Stack](https://img.shields.io/badge/Stack-MERN-2ea44f)](#)
[![License](https://img.shields.io/badge/License-Educational-yellow)](#)

## 🕌 About

**E-Masjid System** digitizes the day-to-day operations of a local mosque and exposes them through a clean web interface for community members, scholars, committee members, and mosque administrators.

The platform supports **four masjids under a single super-admin (manager)**, with strict scope isolation so an admin of one masjid cannot read or write another masjid's data. The system covers the full lifecycle of a mosque's public operations — donations, prayer times, events, nikah bookings, announcements, and a committee-driven fund-request workflow.

The application source code lives in [`E-Masjid Final Year Project Source Code/`](./E-Masjid%20Final%20Year%20Project%20Source%20Code/). For the full technical overview — architecture, role matrix, multi-tenant scope rules, local development setup, test accounts, and deployment guide — see the [project README](./E-Masjid%20Final%20Year%20Project%20Source%20Code/README.md).

## 👥 Team

| Member | Role | Roll No |
| --- | --- | --- |
| **Dawood Ahmed** | Backend Development | 2022-KS-158 |
| **Haris Ehsan** | Frontend Development | 2022-KS-190 |

**Supervisor:** Mr. Muhammad Kamran

**Project ID:** 22-KS-BSIT-15

**College:** Govt Graduate College Civil Lines, Sheikhupura

## ✨ Features

- 🏛️ **Multi-tenant scope** — one super-admin (manager) overseeing 4 masjids with strict data isolation
- 💰 **Donation management** — manual entries plus Stripe online donations with webhook idempotency
- 📊 **Transparent reporting** — public monthly donation/expense trends with month-over-month deltas
- 🕐 **Prayer times** — multi-mosque switching with per-masjid schedules
- 📅 **Event management** — admin creates events, community registers, marketing surfaces upcoming items
- 💍 **Online nikah booking** — community requests a slot, scholar is assigned, status tracked end to end
- 📢 **Announcement system** — mosque-scoped announcements surfaced on public + admin views
- 🗳️ **Fund-request workflow** — community submits, committee of 4 votes, admin finalizes, email notifications fire
- 🔐 **Role-based access** — manager / admin / scholar / committee / community with route-level + endpoint-level enforcement
- 📧 **Email notifications** — SMTP-based, supports Gmail direct or transactional relay (Brevo / Resend)

## 🧰 Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React.js, Vite, Tailwind CSS, Axios |
| Backend | Node.js, Express.js |
| Database | MongoDB (Mongoose ODM) |
| Auth | JWT (httpOnly cookie), bcrypt |
| Payments | Stripe (test mode in dev) |
| Email | SMTP via Gmail / Brevo |
| Process | pm2 (production), nodemon (dev) |
| Tests | Jest + Supertest (integration) |

## 🗂️ Repository Structure

This repository holds the complete FYP submission. The application source lives in the `E-Masjid Final Year Project Source Code/` subfolder; the remaining folders contain the academic deliverables required by the university.

```
.
├── E-Masjid Final Year Project Source Code/   # Application code (backend + frontend)
│   ├── backend/                                # Node.js + Express API
│   ├── frontend/                               # React + Vite SPA
│   └── README.md                               # Full technical documentation
├── Proposal/                                   # FYP proposal
├── SRS/                                        # Software Requirements Specification
├── SDS/                                        # Software Design Specification
├── Comprehensive Documentation/                # Combined project documentation
├── 8 semester final documentation/             # Final-semester submission archive
└── Presenatation/                              # Defense presentation slides
```

## 🚀 Quick Start (Development)

For full setup instructions including seed data, test accounts, and Gmail / Stripe configuration, see the [project README](./E-Masjid%20Final%20Year%20Project%20Source%20Code/README.md).

```bash
cd "E-Masjid Final Year Project Source Code"

# Backend
cd backend
npm install
cp .env.example .env       # fill in JWT_SECRET, EMAIL_PASS, STRIPE_* keys
npm run seed               # load demo data (4 masjids + 4 committee Gmail accounts)
npm run dev                # http://localhost:5000

# Frontend (separate terminal)
cd ../frontend
npm install
npm run dev                # http://localhost:5173
```

## 🧪 Test Coverage

The backend ships with **6 integration test suites (160 tests)** covering:

- Multi-tenant scope isolation across all admin endpoints
- Committee voting race + re-vote atomicity
- Stripe webhook signature + idempotency
- Nikah booking lifecycle + slot assignment
- Scholars account management + deactivation
- Forgot-password / reset-password flow

Run with:

```bash
cd backend && npm test
```

## 📚 Documentation

| Document | Description |
| --- | --- |
| [Project README](./E-Masjid%20Final%20Year%20Project%20Source%20Code/README.md) | Technical overview, roles, architecture, local dev, deployment |
| [Proposal](./Proposal/) | FYP proposal |
| [SRS](./SRS/) | Software Requirements Specification |
| [SDS](./SDS/) | Software Design Specification |
| [Comprehensive Documentation](./Comprehensive%20Documentation/) | Combined project documentation |
| [Final semester documentation](./8%20semester%20final%20documentation/) | Final-semester submission archive |
| [Defense presentation](./Presenatation/) | Slides used in the FYP defense |

## 🛡️ Multi-Tenant Scope Rules

A core architectural invariant: **an admin of Masjid A cannot read or write Masjid B's data** — not via the UI, not via direct API calls, not via crafted request bodies. The invariant is enforced at three layers:

1. **Route middleware** — every admin endpoint verifies the caller's `mosqueId` matches the resource's `mosqueId`
2. **Service layer** — every query is scoped by `mosqueId` before reaching the database
3. **UI layer** — admin pages fetch only their own masjid's records

This is exercised by the cross-mosque denial tests in `backend/tests/integration/`.

## 📄 License

This is an educational project developed as a Final Year Project (BS Information Technology) at the **University of the Punjab**, Lahore. All rights reserved by the project authors.

## 🙏 Acknowledgments

- **Mr. Muhammad Kamran** — project supervisor, for guidance and review throughout the project
- **Department of Computer Science**, University of the Punjab, Lahore
- **Govt Graduate College Civil Lines, Sheikhupura**