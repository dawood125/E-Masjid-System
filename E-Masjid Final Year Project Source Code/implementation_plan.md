#Command which i have given to an AI then he generated the below plan

"i’m building a final year project: E-Masjid System, a mosque management web app. I have existing frontend files (HTML, CSS, JS) in the following folders:

/admin/ – Admin dashboard pages.

/user/ – Community member pages.

/scholar/ – Religious scholar pages.

/css/ – All shared CSS files.
I also have a complete 7th-semester documentation PDF that I’ll attach for reference. The system uses MERN stack (React, Node, Express, MongoDB). I now need to:

Convert the entire frontend to React JS pixel-perfectly. Keep the exact same design: colors, fonts, spacing, layout, and every section must match 1:1. Use functional components, React hooks, and React Router for navigation. No UI library (like Bootstrap or Material-UI) unless it exactly matches the existing design. Reuse the existing CSS as much as possible by importing them into React.

Add the following new features requested by the supervisor:

Multi-Mosque Support: Introduce a new actor called "Mosque Manager". A manager can log in, create/manage multiple mosques, and assign which modules (donations, expenses, events, nikah, etc.) each mosque can access. Update the admin dashboard accordingly.

Promotional Section on Homepage: On the main homepage (before login), add a visually appealing section with a carousel or grid showing mosque photos, upcoming event highlights, and a short promotional message to attract community members. Make it premium-looking.

Zakat/Sadaqah Fund Requests: Community members in need can submit a request for financial help (Zakat/Sadaqah). These requests go to a newly created "Committee Members" group. Admin can create multiple committee members per mosque, and requests are emailed to all of them. Committee members can log in, review requests, and mark them as approved/rejected with a reason. The status is visible to the admin and the requester.

Anonymous Donations & Top Donors: When donating, users can tick a checkbox to remain anonymous. In records, show "Anonymous" instead of their name. Also, on the transparency page, display a "Top Donors" section listing the highest non-anonymous donors (with amounts) to motivate others.

Build the complete backend using Node.js, Express, MongoDB, Mongoose. Implement all API routes based on the documentation and new features. Use JWT for authentication with role-based access (admin, mosque manager, scholar, committee, community). Integrate Stripe for online donations (test mode). Send real emails for password reset and committee requests (using a test email service like Ethereal or Mailtrap for development). Implement all business rules from the documentation.

Ensure the system is fully functional and tested. Write unit tests for critical backend logic, integration tests for API endpoints, and test the frontend flow end-to-end. The final delivery must be a single runnable project with clear instructions. Ensure the system meets the non-functional requirements: fast load times (<3s), mobile responsive, encrypted passwords, 1-hour session timeout, and automatic weekly backups (MongoDB Atlas script).

Follow the 8th-semester documentation structure as I will later update the SRS/SDS to include these new features. Use the existing document’s terminology and naming conventions.
Hey i am making my final year project. Firstly i have the frontend in html , css , js and you can see this frontend in the admin , user  and relegiuous scholar and css folder  and then i have given this frontend files to an ai and told to him convert this frontend into react and please convert same to same frontend in react like every pixel and same to same section because i have really made a beatiful design frontend so i want the same to same.  Now i have submitted the seven semester docuementation and i have given you the documentation in finalyeardocumentation.md  and i have passed the viva.  sir told me some suggestion to add features in the project and then he will again come in eight semester and take our full fyp viva with documentation and code. First he told us that please add the multi mosque support like he told there can mosque manage actor who can give access to different mosques and also decide which modules to give different mosques. Second feature he told me to add that a promotional page or section on home page whatever you think is best where we show Photos of masjid and events and promotional content so commountiy people attract. third feature he told me to add that features that we have money of zakat and sadqa and people who need money can request through the website and the request goes to the commite members which admin create of diffrenet commite member for a masjd and requests goes to all commite member email and they review the request and verifies and decide whether to give the money or not. fourth features he told that if some user donate and he dont want to show his name then Anonymous should be add in the records and also one other things he told that we can show the top donors so please see this people is giving more donation and motivate to donate more. These are the features he told me to add . So we have add the frontend pages for these features also and also do the backend later. So first please analyze the whole codebase carefully and each and every file carefully and ready fyp documentation carefully and make the frontend beatiful , premium and look impressive and the pages we earlier build in html , css ,js  should be built same to same in react and add any additional enhanment you think look best and make web app more beatiful and when we complete the frontend and each and every page acoridng to documentation and sir told features then start the backend and built the complete backend. please analyze everything carefully and we built all the frontend and backend and testing of each and every feature carefully and also please ensure the system fulfill the non functional requirements fully. please use all the tools you have avaible for testing and for everything and let built a great , impressive and full functional scalblabe solid system. Also we built all the system in one go  so  let built all system together and test end to end. 

Tell me did you understand what i am trying to say and do you have questions i think  i have explained everything carefully and let start the work."




# E-Masjid System — Master Implementation Plan

## Project Analysis Summary

### Current State
| Component | Status | Details |
|-----------|--------|---------|
| **HTML/CSS/JS Frontend** | ✅ Complete | 18 HTML pages across admin (6), user (11), scholar (1) |
| **React Frontend** | 🟡 Partial | Converted with Tailwind CSS, needs pixel-perfect CSS match |
| **Original CSS** | ✅ Complete | `style.css` (129KB), `admin.css` (57KB), scholar `style.css` (16KB) |
| **Backend** | ❌ Not Started | Needs full MERN backend |
| **New Features** | ❌ Not Started | 4 supervisor-requested features |
| **Testing** | ❌ Not Started | Unit, integration, E2E needed |

### Key Architecture Decisions
1. **Keep Tailwind CSS** — The existing React already uses Tailwind extensively with a well-configured `tailwind.config.js` that maps the original color scheme. The conversion is already close to the original design.
2. **Import original CSS** for any sections where Tailwind doesn't match pixel-perfectly
3. **Monorepo structure** — `/client` (React) + `/server` (Express/Node)
4. **Use Vite** — Already configured, fast dev experience

---

## Phase 1: Frontend Enhancement & Pixel-Perfect Matching
> **Goal**: Ensure React components match the original HTML/CSS design 1:1, import original CSS where needed

### Tasks
- [ ] 1.1 Import original `css/style.css` and `css/admin.css` into React project
- [ ] 1.2 Verify each User page matches the HTML original:
  - Home, Login, Register, ForgotPassword, PrayerTimes, Events, Donate, NikahBooking, MyBookings, Announcements, Transparency
- [ ] 1.3 Verify Admin pages match the HTML original:
  - Dashboard, DonationsExpenses, PrayerTimes, Events, Announcements, Scholars, AdminLogin
- [ ] 1.4 Verify Scholar Dashboard matches original
- [ ] 1.5 Ensure Navbar matches original HTML navbar (with scroll behavior, mobile menu)
- [ ] 1.6 Ensure Footer matches original HTML footer
- [ ] 1.7 Ensure admin Sidebar matches original HTML sidebar

---

## Phase 2: New Feature Frontend Pages

### 2.1 Multi-Mosque Support
**New Actor**: Mosque Manager
**New Pages**:
- [ ] `/manager/login` — Manager login page
- [ ] `/manager/dashboard` — Manager dashboard
- [ ] `/manager/mosques` — List/Create/Edit mosques
- [ ] `/manager/mosques/:id/modules` — Toggle modules per mosque (donations, expenses, events, nikah, etc.)
- [ ] `/manager/mosques/:id/admins` — Assign admin users to mosques
- [ ] Update Admin Dashboard to show mosque context (which mosque they're managing)
- [ ] Update all admin pages to be mosque-scoped

**New Components**:
- `ManagerLayout.jsx` — Layout with manager sidebar
- `MosqueCard.jsx` — Mosque summary card
- `ModuleToggle.jsx` — Toggle switch for enabling/disabling modules

### 2.2 Promotional Section on Homepage
- [ ] Add a **mosque photo carousel** section below the hero section
- [ ] Add **upcoming events highlights** with countdown
- [ ] Add **promotional message** banner with attractive Islamic design
- [ ] Generate mosque images using image generation tool
- [ ] Add smooth auto-scroll carousel with navigation dots

### 2.3 Zakat/Sadaqah Fund Request System
**New Actor**: Committee Member
**New Pages**:
- [ ] `/fund-request` — Community member submits a fund request (user-facing)
- [ ] `/my-requests` — Community member views their request status
- [ ] `/admin/committee-members` — Admin creates/manages committee members
- [ ] `/admin/fund-requests` — Admin views all fund requests and their statuses
- [ ] `/committee/login` — Committee member login
- [ ] `/committee/dashboard` — Committee member dashboard with pending requests
- [ ] `/committee/requests/:id` — Review a single request (approve/reject with reason)

**New Components**:
- `FundRequestForm.jsx` — Form for submitting financial help request
- `RequestCard.jsx` — Card showing request details and status
- `CommitteeLayout.jsx` — Layout for committee member pages

### 2.4 Anonymous Donations & Top Donors
- [ ] Add **"Donate Anonymously"** checkbox on the Donate page
- [ ] Update Transparency page with **"Top Donors"** section showing leaderboard
- [ ] Show "Anonymous" in donation records when user opts in
- [ ] Add motivational message and ranking badges (Gold, Silver, Bronze)

---

## Phase 3: Backend Development

### 3.1 Project Structure
```
server/
├── config/
│   ├── db.js              # MongoDB connection
│   ├── stripe.js          # Stripe configuration
│   └── email.js           # Email service (Mailtrap)
├── middleware/
│   ├── auth.js            # JWT authentication
│   ├── roleCheck.js       # Role-based access control
│   ├── errorHandler.js    # Global error handler
│   └── validator.js       # Request validation
├── models/
│   ├── User.js
│   ├── Mosque.js          # NEW: Multi-mosque
│   ├── Donation.js
│   ├── Expense.js
│   ├── Event.js
│   ├── Announcement.js
│   ├── PrayerTime.js
│   ├── NikahBooking.js
│   ├── FundRequest.js     # NEW: Zakat/Sadaqah requests
│   └── CommitteeMember.js # NEW: Committee members
├── routes/
│   ├── auth.js
│   ├── users.js
│   ├── mosques.js         # NEW
│   ├── donations.js
│   ├── expenses.js
│   ├── events.js
│   ├── announcements.js
│   ├── prayerTimes.js
│   ├── nikahBookings.js
│   ├── scholars.js
│   ├── fundRequests.js    # NEW
│   └── committee.js       # NEW
├── controllers/
│   └── (matching controllers for each route)
├── utils/
│   ├── sendEmail.js
│   └── generateToken.js
├── tests/
│   ├── unit/
│   └── integration/
├── server.js
├── package.json
└── .env.example
```

### 3.2 Database Models (Updated with New Features)

**User Model** — Extended with new roles:
```
roles: ['community', 'admin', 'scholar', 'manager', 'committee']
+ mosqueId (for admin/scholar — links to their mosque)
```

**Mosque Model** — NEW:
```
name, address, city, phone, email, image
enabledModules: [donations, expenses, events, nikah, announcements, prayerTimes, fundRequests]
managerId (reference to User with role 'manager')
createdAt, updatedAt
```

**Donation Model** — Updated:
```
+ isAnonymous: Boolean (default: false)
+ mosqueId: reference to Mosque
```

**FundRequest Model** — NEW:
```
requesterId, mosqueId, amount, reason, category
supportingDocs, status (pending/approved/rejected)
reviewedBy (committee member), reviewNote
createdAt, updatedAt
```

### 3.3 API Routes

| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| POST | `/api/auth/register` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login user |
| POST | `/api/auth/forgot-password` | Public | Send reset email |
| POST | `/api/auth/reset-password/:token` | Public | Reset password |
| GET | `/api/users/me` | Auth | Get current user |
| GET | `/api/mosques` | Manager | List all mosques |
| POST | `/api/mosques` | Manager | Create mosque |
| PUT | `/api/mosques/:id` | Manager | Update mosque |
| PUT | `/api/mosques/:id/modules` | Manager | Toggle modules |
| GET | `/api/donations` | Auth | Get donations |
| POST | `/api/donations` | Admin | Add cash donation |
| POST | `/api/donations/online` | Auth | Online donation (Stripe) |
| GET | `/api/donations/top-donors` | Public | Top donors list |
| GET | `/api/expenses` | Auth | Get expenses |
| POST | `/api/expenses` | Admin | Add expense |
| GET | `/api/events` | Public | List events |
| POST | `/api/events` | Admin | Create event |
| POST | `/api/events/:id/register` | Auth | Register for event |
| GET | `/api/announcements` | Public | List announcements |
| POST | `/api/announcements` | Admin | Create announcement |
| GET | `/api/prayer-times` | Public | Get prayer times |
| PUT | `/api/prayer-times` | Admin | Update prayer times |
| GET | `/api/nikah-bookings` | Auth | Get bookings |
| POST | `/api/nikah-bookings` | Auth | Create booking |
| PUT | `/api/nikah-bookings/:id` | Scholar | Accept/Reject |
| GET | `/api/scholars` | Admin | List scholars |
| POST | `/api/scholars` | Admin | Create scholar account |
| POST | `/api/fund-requests` | Auth | Submit request |
| GET | `/api/fund-requests` | Committee/Admin | List requests |
| PUT | `/api/fund-requests/:id` | Committee | Approve/Reject |
| GET | `/api/committee` | Admin | List committee members |
| POST | `/api/committee` | Admin | Create committee member |

### 3.4 Authentication & Security
- JWT tokens with 1-hour expiry (matching NFR: session timeout)
- Password hashing with bcrypt (10 salt rounds)
- Role-based middleware for route protection
- CORS configuration for frontend origin
- Rate limiting on auth endpoints
- Input sanitization with express-validator

### 3.5 Stripe Integration (Test Mode)
- Create Stripe checkout session for donations
- Handle webhook for payment confirmation
- Record donation with anonymous flag
- Test card: `4242 4242 4242 4242`

### 3.6 Email Integration
- Use Mailtrap/Ethereal for development
- Password reset emails with tokenized links
- Fund request notification to all committee members
- Email templates with mosque branding

---

## Phase 4: Frontend-Backend Integration
- [ ] Replace all mock data with real API calls
- [ ] Implement `api.js` service layer with axios
- [ ] Connect AuthContext to real JWT auth
- [ ] Connect all CRUD pages to backend
- [ ] Implement Stripe checkout flow
- [ ] Handle loading states and error boundaries
- [ ] Implement real-time next prayer calculation from API data

---

## Phase 5: Testing

### 5.1 Backend Unit Tests (Jest)
- Auth controller tests (register, login, forgot password)
- Donation/Expense CRUD tests
- Role-based access tests
- Validation tests
- Email service tests

### 5.2 API Integration Tests (Supertest)
- Auth flow: register → login → protected route
- Donation flow: login → create donation → verify in list
- Nikah flow: book → scholar review → status update
- Fund request flow: submit → committee review → status

### 5.3 Frontend E2E Flow Tests
- User registration and login flow
- Donation flow (with Stripe test mode)
- Admin dashboard navigation
- Fund request submission
- Event registration

---

## Phase 6: Non-Functional Requirements

| Requirement | Implementation |
|-------------|---------------|
| Fast load times (<3s) | Code splitting, lazy loading, image optimization |
| Mobile responsive | Already responsive, verify all new pages |
| Encrypted passwords | bcrypt hashing in User model |
| 1-hour session timeout | JWT expiry + frontend timer |
| Weekly backups | MongoDB Atlas scheduled backup script |

---

## Execution Order

> [!IMPORTANT]
> We build everything together, phase by phase. Each phase is fully completed and verified before moving to the next.

1. **Phase 1** → Fix any frontend pixel-perfect issues + import original CSS
2. **Phase 2** → Build all new feature frontend pages
3. **Phase 3** → Build complete backend
4. **Phase 4** → Connect frontend to backend
5. **Phase 5** → Write and run all tests
6. **Phase 6** → Verify all non-functional requirements

**Ready to begin Phase 1?**
