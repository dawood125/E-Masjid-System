# E-Masjid System

This is our Final Year Project for BS Information Technology at the University of the Punjab, Lahore. We built it at Govt Graduate College Civil Lines, Sheikhupura during the 2022-2025 session.

E-Masjid is a website that helps local mosques run their daily work. Right now it covers things like donations, prayer times, events, nikah bookings, announcements, and a workflow where community members can ask the mosque committee for financial help and the committee votes on it.

The application source code is inside the [E-Masjid Final Year Project Source Code/](./E-Masjid%20Final%20Year%20Project%20Source%20Code/) folder. All the academic paperwork (proposal, SRS, SDS, final submission, presentation slides) lives in the other folders.

## Team

| Name | Roll No | Worked On |
| --- | --- | --- |
| Dawood Ahmed | 2022-KS-158 | Backend |
| Haris Ehsan | 2022-KS-190 | Frontend |

Supervisor: Mr. Muhammad Kamran
College: Govt Graduate College Civil Lines, Sheikhupura

## What it does

- One super-admin (manager) oversees two masjids. Each masjid has its own admin.
- An admin of one masjid cannot see or change another masjid's data. This was important to us and we enforced it everywhere.
- Community members can register, log in, donate, see prayer times, register for events, book nikah, and submit fund requests.
- Admins manage their masjid's announcements, events, expenses, donations, nikah bookings, fund requests, and their committee members.
- Committee members log in separately and vote on incoming fund requests. Voting and finalizing both send email notifications.
- Managers create new masjids and new admins or committee accounts for those masjids.
- Email verification is required when a community user registers (a 6 digit code is sent to their email).
- Online donations use Stripe in test mode.

## Tech used

- Frontend: React, Vite, Tailwind CSS, Axios
- Backend: Node.js, Express
- Database: MongoDB with Mongoose
- Auth: JWT in an httpOnly cookie, bcrypt for passwords
- Payments: Stripe (test mode)
- Email: SMTP through Resend
- Process manager on the server: pm2
- Reverse proxy: Caddy

## Running it locally

Open a terminal, go to the project folder, then:

```bash
# backend
cd backend
npm install
cp .env.example .env
# fill in JWT_SECRET, MONGO_URI, STRIPE keys, RESEND_API_KEY in the .env file
npm run seed
npm run dev
# backend will run on http://localhost:5000
```

Open a second terminal for the frontend:

```bash
cd frontend
npm install
npm run dev
# frontend will run on http://localhost:5173
```

The seed script creates the default two masjids (Masjid Al-Noor in Civil Lines and Masjid Al-Rahman in Model Town), one manager, both admins, one scholar per masjid, one committee per masjid, and one community user per masjid. Real email accounts used for testing the forgot password flow are also included.

## Testing

We tested the system manually, both on our local machines and on the production server, by going through every page and every role. We also did API testing using Postman.

## Repository layout

```
.
├── E-Masjid Final Year Project Source Code/   application code (backend + frontend)
├── Proposal/                                   FYP proposal
├── SRS/                                        Software Requirements Specification
├── SDS/                                        Software Design Specification
├── Comprehensive Documentation/                combined project documentation
├── 8 semester final documentation/             final-semester submission archive
└── Presenatation/                              defense presentation slides
```

## Other documents

- [Project README](./E-Masjid%20Final%20Year%20Project%20Source%20Code/README.md) - full technical documentation for the application
- [Proposal](./Proposal/) - FYP proposal
- [SRS](./SRS/) - Software Requirements Specification
- [SDS](./SDS/) - Software Design Specification
- [Comprehensive Documentation](./Comprehensive%20Documentation/) - combined project documentation
- [Final semester documentation](./8%20semester%20final%20documentation/) - final-semester submission archive
- [Defense presentation](./Presenatation/) - slides used in the FYP defense

## Note

This is an educational project for our final year. All rights belong to the project authors.
