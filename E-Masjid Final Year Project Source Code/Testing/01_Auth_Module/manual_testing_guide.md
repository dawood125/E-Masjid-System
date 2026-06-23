# Authentication — Manual Testing Guide
## For: My Partner (Non-Technical)

---

## How To Start Testing

**Step 1:** Open terminal, go to project folder, run:
```
cd backend
node utils/seed.js
```
(Wait for "Database seeded successfully")

**Step 2:** Start backend:
```
cd backend
npm run dev
```

**Step 3:** Start frontend (new terminal):
```
cd frontend
npm run dev
```

**Step 4:** Open browser → `http://localhost:5173`

---

## Test Accounts (use these exact details)

| Role | Login Page URL | Email | Password |
|------|----------------|-------|----------|
| User / Scholar | `/login` | user@emasjid.pk | user1234 |
| Scholar only | `/login` (select Scholar role) | scholar@emasjid.pk | scholar123 |
| Admin | `/admin/login` | admin@emasjid.pk | admin123 |
| Manager | `/manager/login` | manager@emasjid.pk | manager123 |
| Committee | `/committee/login` | committee@emasjid.pk | committee123 |

---

## Test 1: User Login (Community)

### What You're Testing
A normal community member can log in and reach the homepage.

### Steps to Follow
1. Go to `http://localhost:5173/login`
2. Enter Email: `user@emasjid.pk`
3. Enter Password: `user1234`
4. Make sure role is set to **Community Member**
5. Click **Sign In**

### What Should Happen
✅ Green message: "Successfully logged in!"  
✅ You land on the homepage  
✅ Your name appears in the top-right area  

### Mark Result
☐ PASS ☐ FAIL — Notes: _______________

---

## Test 2: Wrong Password (No Lockout)

### What You're Testing
Wrong password shows an error but does NOT block you.

### Steps to Follow
1. Go to `/login`
2. Email: `user@emasjid.pk`
3. Password: `wrongpassword99`
4. Click Sign In
5. Repeat steps 1–4 **five times in a row**
6. Then try correct password: `user1234`

### What Should Happen
✅ Red error each time (says something like "Invalid credentials")  
✅ After 5 wrong tries, correct password **still works**  
❌ You should NEVER see "Too many requests" or "Account locked"

### Mark Result
☐ PASS ☐ FAIL — Notes: _______________

---

## Test 3: Admin Login

### Steps to Follow
1. Go to `http://localhost:5173/admin/login`
2. Email: `admin@emasjid.pk`
3. Password: `admin123`
4. Click Login

### What Should Happen
✅ Admin dashboard opens  
✅ Sidebar shows: Donations, Prayer Times, Events, etc.

### Mark Result
☐ PASS ☐ FAIL — Notes: _______________

---

## Test 4: Scholar Login

### Steps to Follow
1. Go to `http://localhost:5173/login`
2. Email: `scholar@emasjid.pk`
3. Password: `scholar123`
4. Select role: **Religious Scholar**
5. Click Sign In

### What Should Happen
✅ Scholar dashboard opens at `/scholar`

### Mark Result
☐ PASS ☐ FAIL — Notes: _______________

---

## Test 5: Manager Login

### Steps to Follow
1. Go to `http://localhost:5173/manager/login`
2. Email: `manager@emasjid.pk`
3. Password: `manager123`
4. Click Login

### What Should Happen
✅ Manager dashboard opens

### Mark Result
☐ PASS ☐ FAIL — Notes: _______________

---

## Test 6: Committee Login

### Steps to Follow
1. Go to `http://localhost:5173/committee/login`
2. Email: `committee@emasjid.pk`
3. Password: `committee123`
4. Click Login

### What Should Happen
✅ Committee dashboard opens

### Mark Result
☐ PASS ☐ FAIL — Notes: _______________

---

## Test 7: New User Registration

### Steps to Follow
1. Go to `http://localhost:5173/register`
2. Fill in:
   - Name: `Test User`
   - Email: `testuser@example.com`
   - Phone: `03001234567`
   - Password: `Test1234`
   - Confirm Password: `Test1234`
3. Check the terms checkbox
4. Click **Create Account**

### What Should Happen
✅ Green success message  
✅ Redirected to homepage  
✅ You are logged in  

### Mark Result
☐ PASS ☐ FAIL — Notes: _______________

---

## Test 8: Logout

### Steps to Follow
1. While logged in as User, find **Logout** in the menu
2. Click Logout

### What Should Happen
✅ You return to login page or homepage  
✅ You cannot access `/admin` without logging in again  

### Mark Result
☐ PASS ☐ FAIL — Notes: _______________

---

## Test 9: Admin Sidebar — All Navigation Links Visible & Scrollable

### What You're Testing
The admin sidebar must show all 8 navigation links and they should all be reachable. Footer should stay pinned to the bottom.

### Steps to Follow
1. Login as Admin (Test 3)
2. Look at the left sidebar — you should see, in order: Dashboard, Donations & Expenses, Prayer Times, Events, Announcements, Manage Scholars, Committee Members, Fund Requests
3. If all 8 don't fit at once, the middle section of the sidebar should scroll
4. Header "E-Masjid / Admin Panel" should stay at the top
5. Footer "Haji Ahmad — Administrator" should stay pinned at the bottom

### What Should Happen
✅ All 8 navigation links are visible OR reachable by scrolling the sidebar middle area  
✅ Header stays anchored at the top  
✅ Footer stays anchored at the bottom  
✅ Clicking any link navigates to the correct page

### Mark Result
☐ PASS ☐ FAIL — Notes: _______________

---

## Test 10: Cross-Role Login (Force Logout Previous Session)

### What You're Testing
If you are logged in as one role and visit another role's login page, the system should automatically sign you out of the previous role and show a toast.

### Steps to Follow
1. Login as Admin (Test 3) — you should be on `/admin`
2. Without clicking Logout, open `/manager/login` (same browser tab or new tab)
3. A blue info toast should appear: "Signed out from your previous Admin session. Please sign in below."
4. The Manager login form should be visible and empty
5. Login as Manager (`manager@emasjid.pk / manager123`)
6. You should land on `/manager` dashboard
7. (Optional) Try any other pair: Manager → `/admin/login`, Committee → `/login`, etc.

### What Should Happen
✅ Info toast appears on every cross-role login attempt (bottom-right of screen)  
✅ Previous session is fully cleared (no leftover Logout button)  
✅ New login form is ready to use immediately  
✅ After logging in as the new role, only that role's dashboard is accessible

### Mark Result
☐ PASS ☐ FAIL — Notes: _______________

---

## Final Checklist
☐ All 10 tests passed  
☐ No "Too many requests" errors  
☐ Login felt fast (not stuck loading)  
☐ Logout worked for all 5 roles (User, Admin, Manager, Committee, Scholar)  
☐ All 8 admin sidebar links are visible/scrollable  
☐ Cross-role login shows toast and clears previous session

## What To Send Back
1. List of tests that PASSED
2. List of tests that FAILED with exact error text
3. Screenshots of any failures
