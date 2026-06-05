# EMasjid FYP — Manual Testing Guide
## Version 1.0 | Final Submission

---

## HOW TO SET UP FOR TESTING

### Prerequisites
- Node.js 18+ and npm installed
- MongoDB Atlas URI or local MongoDB running
- Stripe account with test keys
- Stripe CLI installed for local webhook forwarding
- Backend `.env` configured from `backend/.env.example`
- Frontend `.env` (if used) with correct `VITE_API_URL`

### Starting the System
Step 1: `cd backend && npm install && npm run dev`  
Step 2: `cd frontend && npm install && npm run dev`  
Step 3: Open `http://localhost:5173`

### Test Accounts
| Role      | Email                  | Password    |
|-----------|------------------------|-------------|
| Manager   | manager@emasjid.pk     | manager123  |
| Admin     | admin@emasjid.pk       | admin123    |
| Scholar   | scholar@emasjid.pk     | scholar123  |
| Committee | committee@emasjid.pk   | committee123|
| User      | user@emasjid.pk        | user123     |

> Run `cd backend && node utils/seed.js` to reset the database with these accounts if needed.

---

## TESTING BY ROLE

### ROLE 1 — ADMIN

#### Feature: Admin Login
- **URL:** `/admin/login`
- **How to access:** Open admin login page and submit admin credentials.
- **What to test:** Valid login, invalid password, inactive account.
- **Expected result:** Valid admin is redirected to admin dashboard; invalid login shows error toast.
- **Test edge cases:**
  * Wrong password 5+ times → Expected: login denied and eventually rate-limited response.
  * Login with community account on admin page → Expected: unauthorized role message.
- **Pass criteria:** Only admin role can access admin panel routes.

#### Feature: Manage Donations & Expenses
- **URL:** `/admin/donations`
- **How to access:** Login as admin and open Donations & Expenses from sidebar.
- **What to test:** Add donation, add expense, list records, delete expense.
- **Expected result:** Records persist and totals update correctly.
- **Test edge cases:**
  * Amount `0` or negative → Expected: validation error.
  * Invalid category value via API tampering → Expected: 400 validation error.
- **Pass criteria:** CRUD actions work and validation blocks bad data.

#### Feature: Manage Prayer Times
- **URL:** `/admin/prayer-times`
- **How to access:** Login as admin and open Prayer Times page.
- **What to test:** Update daily times and confirm public page reflects update.
- **Expected result:** Save succeeds and public prayer times show updated values.
- **Test edge cases:**
  * Missing required prayer field → Expected: 400 validation error.
  * Invalid date format → Expected: 400 validation error.
- **Pass criteria:** Prayer times update safely and display to users.

#### Feature: Manage Events
- **URL:** `/admin/events`
- **How to access:** Login as admin and open Events page.
- **What to test:** Create event, edit event, upload image, toggle registration required, set max participants, view list, delete event.
- **Expected result:** Event appears on user events page and can be removed.
- **Test edge cases:**
  * Past date event creation → Expected: blocked with validation message.
  * Invalid event id in URL/API → Expected: 400 invalid id or 404 not found.
- **Pass criteria:** Event lifecycle works with date and id protections.

#### Feature: Manage Announcements
- **URL:** `/admin/announcements`
- **How to access:** Login as admin and open Announcements page.
- **What to test:** Create urgent/non-urgent announcement, delete announcement.
- **Expected result:** Announcement appears for users and can be removed.
- **Test edge cases:**
  * Empty content submission → Expected: validation error.
  * Oversized announcement content → Expected: validation error.
- **Pass criteria:** Announcement CRUD works with proper validation.

#### Feature: Manage Scholar Accounts
- **URL:** `/admin/scholars`
- **How to access:** Login as admin and open Scholars page.
- **What to test:** Create scholar account, mark scholar inactive.
- **Expected result:** Scholar list updates and scholar can login if active.
- **Test edge cases:**
  * Duplicate scholar email → Expected: 400 duplicate email error.
  * Invalid scholar id update → Expected: 400 invalid id.
- **Pass criteria:** Scholar management is restricted to same mosque and validates input.

#### Feature: Manage Committee Members
- **URL:** `/admin/committee`
- **How to access:** Login as admin and open Committee page.
- **What to test:** Create member, toggle active state, remove member.
- **Expected result:** Member lifecycle updates persist.
- **Test edge cases:**
  * Duplicate committee email → Expected: 400 duplicate email.
  * Delete member from another mosque id → Expected: 404/forbidden behavior.
- **Pass criteria:** Committee operations are admin-only and mosque-scoped.

#### Feature: Review Fund Requests
- **URL:** `/admin/fund-requests`
- **How to access:** Login as admin and open Fund Requests page.
- **What to test:** Approve/reject request with note.
- **Expected result:** Status changes and requester notification flow completes.
- **Test edge cases:**
  * Missing review note → Expected: 400 validation error.
  * Invalid request id → Expected: 400 invalid id.
- **Pass criteria:** Fund request review flow works safely and status is persisted.

### ROLE 2 — USER

#### Feature: Register & Login
- **URL:** `/register`, `/login`
- **How to access:** Open user registration/login pages from navbar.
- **What to test:** Registration, login, logout, session restore on refresh.
- **Expected result:** Auth state persists and role-specific access is enforced.
- **Test edge cases:**
  * Existing email registration → Expected: duplicate email error.
  * Invalid email format → Expected: validation error.
- **Pass criteria:** Authentication and session flow works reliably.

#### Feature: Forgot/Reset Password
- **URL:** `/forgot-password`, `/reset-password/:token`
- **How to access:** Click forgot password on login page and follow email reset link.
- **What to test:** Reset email request and password change.
- **Expected result:** Reset succeeds for valid token, fails for expired/invalid token.
- **Test edge cases:**
  * Unknown email → Expected: generic success response (no account enumeration).
  * Weak new password → Expected: validation error.
- **Pass criteria:** Password recovery follows secure behavior.

#### Feature: View Prayer Times
- **URL:** `/prayer-times`
- **How to access:** Open Prayer Times page from navbar.
- **What to test:** Today and weekly prayer times rendering.
- **Expected result:** Times load from API; fallback/default shown if unavailable.
- **Test edge cases:**
  * Missing mosque context → Expected: graceful default/load behavior.
  * API failure → Expected: friendly error toast and no crash.
- **Pass criteria:** Prayer times are always visible and stable.

#### Feature: View Events & Register
- **URL:** `/events`
- **How to access:** Open Events page and submit event registration.
- **What to test:** Event list filtering/search and registration.
- **Expected result:** Registration success message and updated registration state.
- **Test edge cases:**
  * Register twice for same event → Expected: “Already registered”.
  * Event full → Expected: “Event is full”.
- **Pass criteria:** Registration rules are enforced server-side.

#### Feature: View Announcements
- **URL:** `/announcements`
- **How to access:** Open Announcements page from navbar.
- **What to test:** Listing, filtering, search, empty state.
- **Expected result:** Announcements render correctly with urgent markers.
- **Test edge cases:**
  * No announcements data → Expected: “No announcements found”.
  * Network failure → Expected: error toast.
- **Pass criteria:** Announcement UX has loading/error/empty states.

#### Feature: Make Donation (Cash/Online)
- **URL:** `/donate`
- **How to access:** Open Donate page and select donation type/method.
- **What to test:** Cash donation form and Stripe checkout flow.
- **Expected result:** Successful donations recorded and visible in transparency/admin views.
- **Test edge cases:**
  * Amount below minimum online donation → Expected: 400 minimum amount error.
  * Invalid donation type tampered from client → Expected: 400 validation error.
- **Pass criteria:** Donations are validated server-side and persisted correctly.

#### Feature: View Transparency
- **URL:** `/transparency`
- **How to access:** Open Transparency page from navbar.
- **What to test:** Donation totals, expense totals, top donors.
- **Expected result:** Public financial data loads with mosque filtering.
- **Test edge cases:**
  * Invalid mosqueId query tampering → Expected: 400 validation error.
  * No records → Expected: friendly empty state.
- **Pass criteria:** Transparency reports are accurate and robust.

#### Feature: Book Nikah Services
- **URL:** `/nikah-booking`
- **How to access:** Open Nikah Booking page and submit form.
- **What to test:** Create booking with date/time/contact details.
- **Expected result:** Request saved as pending and success message shown.
- **Test edge cases:**
  * Past date booking → Expected: blocked with validation error.
  * Slot already accepted by another booking → Expected: 409 slot taken.
- **Pass criteria:** Booking creation enforces business constraints.

#### Feature: View Booking Status
- **URL:** `/my-bookings`
- **How to access:** Open My Bookings page after creating request.
- **What to test:** Pending/accepted/rejected status updates.
- **Expected result:** User sees only own bookings and updated statuses.
- **Test edge cases:**
  * Manual request for another user’s bookings → Expected: blocked by API scope.
  * No bookings → Expected: “No Booking Records”.
- **Pass criteria:** Booking status visibility is user-scoped and accurate.

### ROLE 3 — SCHOLAR

#### Feature: Check Nikah Requests
- **URL:** `/scholar`
- **How to access:** Login with scholar account and open scholar dashboard.
- **What to test:** View pending requests, accept/reject requests, view confirmed list.
- **Expected result:** Status updates persist and assigned scholar is stored.
- **Test edge cases:**
  * Accept already accepted booking → Expected: 409 conflict.
  * Accept booking with conflicting slot → Expected: 409 slot taken.
- **Pass criteria:** Scholar actions are authorized, conflict-safe, and persisted.

---

## API TESTING (Using Postman/Thunder Client)

### Setup
- Base URL: http://localhost:5000/api
- Auth: Bearer token in Authorization header

### [POST] /auth/login
- **Purpose:** Authenticate user and issue JWT.
- **Auth required:** No | Role: Public
- **Request body:**
  ```json
  { "email": "admin@emasjid.pk", "password": "admin123" }
  ```
- **Expected response (success):**
  ```json
  { "success": true, "data": {} }
  ```
- **Expected response (error):**
  ```json
  { "success": false, "message": "error" }
  ```
- **Edge cases to test:**
  - Send empty body → Expected: 400 validation error
  - Send invalid token → Expected: 401 unauthorized
  - Send wrong role token → Expected: 403 forbidden

### [POST] /auth/register
- **Purpose:** Register community user.
- **Auth required:** No | Role: Public
- **Request body:**
  ```json
  { "name": "User", "email": "user@emasjid.pk", "phone": "03001234567", "password": "user123" }
  ```
- **Expected response (success):**
  ```json
  { "success": true, "data": {} }
  ```
- **Expected response (error):**
  ```json
  { "success": false, "message": "error" }
  ```
- **Edge cases to test:**
  - Send empty body → Expected: 400 validation error
  - Send invalid token → Expected: 401 unauthorized
  - Send wrong role token → Expected: 403 forbidden

### [POST] /donations
- **Purpose:** Create cash donation by admin.
- **Auth required:** Yes | Role: Admin
- **Request body:**
  ```json
  { "donorName": "Ali", "amount": 5000, "type": "Zakat", "paymentMethod": "Cash" }
  ```
- **Expected response (success):**
  ```json
  { "success": true, "data": {} }
  ```
- **Expected response (error):**
  ```json
  { "success": false, "message": "error" }
  ```
- **Edge cases to test:**
  - Send empty body → Expected: 400 validation error
  - Send invalid token → Expected: 401 unauthorized
  - Send wrong role token → Expected: 403 forbidden

### [POST] /donations/online
- **Purpose:** Initiate Stripe online donation checkout.
- **Auth required:** No | Role: Public
- **Request body:**
  ```json
  { "donorName": "Ali", "email": "ali@test.com", "amount": 1000, "type": "Sadaqah", "mosqueId": "VALID_OBJECT_ID" }
  ```
- **Expected response (success):**
  ```json
  { "success": true, "data": {} }
  ```
- **Expected response (error):**
  ```json
  { "success": false, "message": "error" }
  ```
- **Edge cases to test:**
  - Send empty body → Expected: 400 validation error
  - Send invalid token → Expected: 401 unauthorized
  - Send wrong role token → Expected: 403 forbidden

### [POST] /nikah-bookings
- **Purpose:** Create Nikah booking request.
- **Auth required:** Yes | Role: User
- **Request body:**
  ```json
  { "groomName": "Imran", "brideName": "Aisha", "preferredDate": "2026-06-10", "preferredTime": "16:00", "contact": "03001234567" }
  ```
- **Expected response (success):**
  ```json
  { "success": true, "data": {} }
  ```
- **Expected response (error):**
  ```json
  { "success": false, "message": "error" }
  ```
- **Edge cases to test:**
  - Send empty body → Expected: 400 validation error
  - Send invalid token → Expected: 401 unauthorized
  - Send wrong role token → Expected: 403 forbidden

### [PUT] /nikah-bookings/:id
- **Purpose:** Scholar/admin accept or reject Nikah request.
- **Auth required:** Yes | Role: Scholar/Admin
- **Request body:**
  ```json
  { "status": "accepted", "confirmedDate": "2026-06-10", "confirmedTime": "16:00" }
  ```
- **Expected response (success):**
  ```json
  { "success": true, "data": {} }
  ```
- **Expected response (error):**
  ```json
  { "success": false, "message": "error" }
  ```
- **Edge cases to test:**
  - Send empty body → Expected: 400 validation error
  - Send invalid token → Expected: 401 unauthorized
  - Send wrong role token → Expected: 403 forbidden

### [GET] /fund-requests
- **Purpose:** List fund requests scoped by role.
- **Auth required:** Yes | Role: User/Committee/Admin
- **Request body:**
  ```json
  { "field": "value" }
  ```
- **Expected response (success):**
  ```json
  { "success": true, "data": {} }
  ```
- **Expected response (error):**
  ```json
  { "success": false, "message": "error" }
  ```
- **Edge cases to test:**
  - Send empty body → Expected: 400 validation error
  - Send invalid token → Expected: 401 unauthorized
  - Send wrong role token → Expected: 403 forbidden

### [PUT] /fund-requests/:id
- **Purpose:** Committee/admin review fund request.
- **Auth required:** Yes | Role: Committee/Admin
- **Request body:**
  ```json
  { "status": "approved", "reviewNote": "Verified case" }
  ```
- **Expected response (success):**
  ```json
  { "success": true, "data": {} }
  ```
- **Expected response (error):**
  ```json
  { "success": false, "message": "error" }
  ```
- **Edge cases to test:**
  - Send empty body → Expected: 400 validation error
  - Send invalid token → Expected: 401 unauthorized
  - Send wrong role token → Expected: 403 forbidden

### [POST] /events
- **Purpose:** Create event.
- **Auth required:** Yes | Role: Admin
- **Request body:**
  ```json
  { "title": "Islamic Talk", "date": "2026-06-15", "time": "19:00", "location": "Main Hall" }
  ```
- **Expected response (success):**
  ```json
  { "success": true, "data": {} }
  ```
- **Expected response (error):**
  ```json
  { "success": false, "message": "error" }
  ```
- **Edge cases to test:**
  - Send empty body → Expected: 400 validation error
  - Send invalid token → Expected: 401 unauthorized
  - Send wrong role token → Expected: 403 forbidden

### [POST] /announcements
- **Purpose:** Create announcement.
- **Auth required:** Yes | Role: Admin
- **Request body:**
  ```json
  { "title": "Eid Prayer", "content": "Eid prayer at 7:00 AM", "isUrgent": true }
  ```
- **Expected response (success):**
  ```json
  { "success": true, "data": {} }
  ```
- **Expected response (error):**
  ```json
  { "success": false, "message": "error" }
  ```
- **Edge cases to test:**
  - Send empty body → Expected: 400 validation error
  - Send invalid token → Expected: 401 unauthorized
  - Send wrong role token → Expected: 403 forbidden

## SECURITY TESTING CHECKLIST
- [ ] Try accessing /admin routes without logging in  
Expected: Redirect to login or 401 error

- [ ] Try accessing /admin routes logged in as User role  
Expected: 403 forbidden

- [ ] Try SQL/NoSQL injection in login form  
Input: { "email": {"$gt": ""}, "password": "" }  
Expected: 400 error or login failure

- [ ] Try accessing another user's booking by changing ID in URL  
Expected: 403 forbidden

- [ ] Try submitting a payment with modified amount  
Expected: Server uses server-side amount, ignores client amount

- [ ] Try uploading a .exe file where image is expected  
Expected: File type rejected with error

- [ ] Try brute force login (10 rapid attempts)  
Expected: Rate limit response after threshold

## STRIPE PAYMENT TESTING
### Test Cards
| Scenario | Card Number | Result |
|---|---|---|
| Success | 4242 4242 4242 4242 | Payment succeeds |
| Declined | 4000 0000 0000 0002 | Payment fails |
| Requires auth | 4000 0025 0000 3155 | 3DS prompt |

### Payment Flow Test
Step 1: Open `/donate`, choose online donation, enter amount and donor details.  
Step 2: Submit and enter Stripe test card details in Checkout.  
Step 3: Confirm expected success/failure behavior in UI.  
Step 4: Verify event in Stripe dashboard or Stripe CLI logs.  
Step 5: Verify donation record appears in app database/admin/transparency views.

## COMPLETE USER JOURNEY TESTS
### Journey 1 — New User Registration to Nikah Booking
Step 1: Register new user → Expected: account created and auto-login  
Step 2: Open Nikah Booking page → Expected: booking form loads  
Step 3: Submit valid booking → Expected: pending booking created  
Step 4: Open My Bookings → Expected: status shown as pending

### Journey 2 — Admin Creates Event, User Sees It
Step 1: Admin logs in and creates event → Expected: event saved  
Step 2: User opens Events page → Expected: new event visible  
Step 3: User registers for event → Expected: registration success

### Journey 3 — Scholar Accepts Nikah Request
Step 1: User submits Nikah booking → Expected: pending status  
Step 2: Scholar logs in and opens dashboard → Expected: request visible  
Step 3: Scholar accepts request → Expected: booking status accepted  
Step 4: User opens My Bookings → Expected: accepted status with confirmation data

### Journey 4 — Admin Manages Donations/Expenses
Step 1: Admin adds donation → Expected: donation persisted  
Step 2: Admin adds expense → Expected: expense persisted  
Step 3: Admin deletes expense → Expected: expense removed and totals refreshed

## PERFORMANCE TESTING
- [ ] Load events page with 100+ events  
Expected: Page loads in under 3 seconds

- [ ] Submit form with maximum allowed input length  
Expected: Accepts and saves correctly

- [ ] Open multiple browser tabs simultaneously  
Expected: No session conflicts

## KNOWN LIMITATIONS
- No file upload module is implemented for this project scope.
- No refresh token flow; access relies on JWT expiry and re-login.
- Stripe proof requires external Stripe account and CLI setup.
- Optional front-end draft/scheduling workflows for events/announcements are not fully implemented as backend entities.

## TESTING SIGN-OFF CHECKLIST
### Frontend
- [ ] All pages load without console errors
- [ ] All forms submit and show feedback
- [ ] All role-based menus show correct items
- [ ] Mobile responsive layout works
- [ ] Loading states show during API calls
- [ ] Error states show on API failures

### Backend
- [ ] All endpoints return correct status codes
- [ ] All protected routes reject unauthorized access
- [ ] All validation rules enforced
- [ ] No unhandled promise rejections in server logs
- [ ] npm test passes 100%

### Integration
- [ ] Frontend and backend communicate correctly
- [ ] Authentication flow works end to end
- [ ] Stripe webhooks received and processed
- [ ] All CRUD operations persist to database
