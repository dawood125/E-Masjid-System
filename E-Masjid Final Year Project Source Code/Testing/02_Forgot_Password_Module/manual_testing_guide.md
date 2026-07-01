# Forgot Password — Manual Testing Guide
## For: My Partner (Non-Technical)

This guide walks you through the full "Forgot Password" and "Reset Password" flow. It uses the same seeded test accounts that were set up in the Auth Module guide. Please run the tests in order, mark each one PASS or FAIL, and send the results back at the end.

---

## How To Start Testing

**Step 1:** Open a terminal, go to the backend folder, and seed the database (this clears old test data and recreates the 5 test accounts):
```
cd backend
node utils/seed.js
```
(Wait for "Database seeded successfully".)

**Step 2:** In the same terminal, start the backend:
```
cd backend
npm run dev
```

**Step 3:** Open a second terminal and start the frontend:
```
cd frontend
npm run dev
```

**Step 4:** Open your browser to `http://localhost:5173`

**Step 5:** You will need to see the password-reset emails. The app now uses **SendGrid** (real Gmail delivery, no sandbox). Open your real Gmail inbox in a second browser tab: `https://mail.google.com` and log in as `dawood.bhatti8812@gmail.com`. Every "Send Reset Link" click for any of the test emails (e.g. `user@emasjid.pk`) should arrive there within 5-10 seconds. Sender: `E-Masjid System`. Subject: `E-Masjid Password Reset`.

> If you ever want to test without sending real email, set `EMAIL_PROVIDER=smtp` in `backend/.env` and the app will fall back to Mailtrap (sandbox). Default is SendGrid.

---

## Test Accounts (use these exact details)

| Role | Login Page URL | Email | Password |
|------|----------------|-------|----------|
| Community User | `/login` | `user@emasjid.pk` | `user1234` |
| Religious Scholar | `/login` (select Scholar) | `scholar@emasjid.pk` | `scholar123` |
| Admin | `/admin/login` | `admin@emasjid.pk` | `admin123` |
| Manager | `/manager/login` | `manager@emasjid.pk` | `manager123` |
| Committee | `/committee/login` | `committee@emasjid.pk` | `committee123` |

---

## Test 1: Request a reset link (community user)

### What You're Testing
That a real community user can request a password-reset link, and the website shows a friendly "Check Your Email" screen.

### Steps to Follow
1. Go to `http://localhost:5173/forgot-password`
2. Type `user@emasjid.pk` in the Email field
3. Click **Send Reset Link**

### What Should Happen
- The page changes to a "Check Your Email" screen with a green envelope icon
- It shows the email address you entered
- A green toast appears briefly: "Reset link sent to your email!"
- The same email arrives in your **real Gmail inbox** (https://mail.google.com) within 5-10 seconds — sender is `E-Masjid System <dawood.bhatti8812@gmail.com>`, subject is `E-Masjid Password Reset`
- The email has a green "Reset Password" button
- The email text says the link is valid for **24 hours**

### Mark Result
☐ PASS  ☐ FAIL — Notes: _______Pass________

---

## Test 2: Request a reset link (non-existent email)

### What You're Testing
That the website does NOT tell a stranger whether an email is registered. (This is a privacy / security feature.)

### Steps to Follow
1. Go to `http://localhost:5173/forgot-password` (refresh if you are still on the success screen)
2. Type `nobody-here@emasjid.pk` (an email that is NOT in the database)
3. Click **Send Reset Link**

### What Should Happen
- The screen still shows the same "Check Your Email" message as Test 1
- A green toast still appears: "Reset link sent to your email!"
- The wording does NOT change to "Email not found" or "No such user"
- No email is actually sent (you can confirm by checking Mailtrap — there should be no new message)

### Mark Result
☐ PASS  ☐ FAIL — Notes: _______Pass________

---

## Test 3: Open the reset link from the email

### What You're Testing
That the reset link in the email actually opens the Reset Password form, and the form looks normal.

### Steps to Follow
1. Go back to your **Gmail inbox** (https://mail.google.com)
2. Open the email from Test 1 (the one sent to `user@emasjid.pk` by `E-Masjid System`)
3. Click the green **Reset Password** button (or copy the link and paste it into your browser)
4. A new page opens at `http://localhost:5173/reset-password/<long-random-string>`

### What Should Happen
- The page shows "Reset Password" as the title
- A short description says "Set a new password for your account."
- There are two password fields: "New Password" and "Confirm Password"
- There is a "Back to Login" link at the top
- A "Reset Password" button is at the bottom
- An eye icon lets you show/hide the password you type

### Mark Result
☐ PASS  ☐ FAIL — Notes: _______pass________

---

## Test 4: Set a new password (success)

### What You're Testing
That a strong new password is accepted and the user is sent back to the login page.

### Steps to Follow
1. You are on the reset-password page from Test 3
2. In "New Password", type: `NewPass2024`
3. In "Confirm Password", type: `NewPass2024` (the same value)
4. Click **Reset Password**

### What Should Happen
- A green success box appears: "Password updated successfully. Redirecting to login..."
- A green toast appears: "Password reset successful. Please login."
- Within about 1-2 seconds, the browser lands on `/login`
- No red error toast appears

### Mark Result
☐ PASS  ☐ FAIL — Notes: _______Pass________

---

## Test 5: Set a new password (too weak)

### What You're Testing
That a weak password is rejected by the website before any email/save happens.

### Steps to Follow
1. Re-do Test 1 (request a fresh reset link for `user@emasjid.pk`)
2. Open the new link in Mailtrap → land on the reset form
3. In "New Password", type: `abc` (3 letters, no numbers)
4. In "Confirm Password", type: `abc`
5. Click **Reset Password**

### What Should Happen
- A yellow warning toast appears: "Password must be at least 8 characters and include at least one letter and one number."
- The form does NOT submit; you are still on the reset page
- The password is NOT changed (you can verify by trying the OLD password `user1234` in Test 9 — it should still work)

### Mark Result
☐ PASS  ☐ FAIL — Notes: _______Pass________

---

## Test 6: Set a new password (mismatch)

### What You're Testing
That two different passwords in the two fields are rejected before any save.

### Steps to Follow
1. Re-do Test 1 (request a fresh reset link for `user@emasjid.pk`)
2. Open the new link in Mailtrap → land on the reset form
3. In "New Password", type: `Strong2024`
4. In "Confirm Password", type: `Different2024`
5. Click **Reset Password**

### What Should Happen
- A yellow warning toast appears: "Passwords do not match."
- The form does NOT submit; you are still on the reset page
- The password is NOT changed

### Mark Result
☐ PASS  ☐ FAIL — Notes: _______Pass________

---

## Test 7: Use the same reset link twice (one-time use)

### What You're Testing
That a reset link can only be used one time. Clicking it again should not let you change the password again.

### Steps to Follow
1. Re-do Test 1 (request a fresh reset link for `user@emasjid.pk`)
2. Open the new link in Mailtrap → land on the reset form
3. Set a new strong password (e.g. `FirstReset1`) and confirm → wait for the success message
4. (Do NOT close the email tab — keep the link)
5. Re-open the same reset link in a new tab
6. Set ANOTHER strong password (e.g. `SecondReset2`) and confirm
7. Click **Reset Password**

### What Should Happen
- The page does NOT redirect to login
- A red error toast appears: "Invalid or expired reset token"
- The password is unchanged — it is still `FirstReset1` from step 3
- The first password `FirstReset1` should still let you log in (Test 8 will confirm)

### Mark Result
☐ PASS  ☐ FAIL — Notes: ______pass_________

---

## Test 8: Login with the new password (success)

### What You're Testing
That the new password set in Test 4 (or Test 7's `FirstReset1`) actually works for login.

### Steps to Follow
1. Go to `http://localhost:5173/login`
2. Email: `user@emasjid.pk`
3. Password: `NewPass2024` (the value from Test 4)
4. Make sure role is set to **Community Member**
5. Click **Sign In**

### What Should Happen
- A green toast appears: "Successfully logged in!"
- You land on the homepage (`/`)
- Your name "Abdullah Ahmed" appears in the top-right area

### Mark Result
☐ PASS  ☐ FAIL — Notes: ____________pass___

---

## Test 9: Login with the OLD password (should fail)

### What You're Testing
That the OLD password no longer works after a successful reset.

### Steps to Follow
1. First, click the Logout button (top-right) to log out
2. Go back to `/login`
3. Email: `user@emasjid.pk`
4. Password: `user1234` (the old seeded password)
5. Click **Sign In**

### What Should Happen
- A red error toast appears: "Invalid credentials"
- You do NOT get logged in
- You stay on the login page

### Mark Result
☐ PASS  ☐ FAIL — Notes: _______pass________

---

## Test 10: Request a new link for the same email (overwrites previous)

### What You're Testing
That requesting a fresh reset link cancels any old link that was never used.

### Steps to Follow
1. Go to `/forgot-password`
2. Email: `user@emasjid.pk` → click **Send Reset Link** (this is LINK A — note its time)
3. Wait 5 seconds
4. Click **Resend** on the "Check Your Email" screen (this is LINK B)
5. Open LINK A from Mailtrap (the older email)
6. Type a new strong password and confirm → click **Reset Password**

### What Should Happen
- The reset with LINK A fails with a red error toast: "Invalid or expired reset token"
- The form does not change the password
- Now open LINK B (the newer email) and try a new strong password
- This second attempt succeeds and you are redirected to `/login`

### Mark Result
☐ PASS  ☐ FAIL — Notes: _____pass__________

---

## Test 11: Resend button while in the "Check Your Email" state

### What You're Testing
That the "Resend" button works without errors and cannot be double-clicked.

### Steps to Follow
1. Go to `/forgot-password`
2. Email: `user@emasjid.pk` → click **Send Reset Link**
3. On the "Check Your Email" screen, find the small **Resend** text below the message
4. Click it ONCE
5. Try to click it 2-3 more times rapidly

### What Should Happen
- On the first click, the text changes to "Sending..." and the button looks greyed out
- A few seconds later, the text returns to "Resend" and a green toast says "Reset link sent again"
- All rapid extra clicks do nothing — the button is disabled while the request is in flight
- A second email appears in Mailtrap

### Mark Result
☐ PASS  ☐ FAIL — Notes: _________pass______

---

## Test 12: Admin / Manager / Committee forgot-password flow

### What You're Testing
That the forgot-password flow works for every role, not just the community user. (Each role has its own login page, but they all use the same `/forgot-password` URL — the website doesn't ask you which role you are at the forgot step.)

### Steps to Follow
Repeat this short block for EACH of the 4 remaining roles:

1. Go to `/forgot-password`
2. Type the role's email (from the table at the top of this guide)
3. Click **Send Reset Link**
4. Open the email in Mailtrap
5. Click **Reset Password** in the email
6. Type a new strong password (e.g. `RolePass2024`) and confirm
7. Click **Reset Password** on the form
8. After success, go to that role's login page and sign in with the new password
9. Then try the OLD password — it should fail

Run this block for:
- [ ] Admin (`admin@emasjid.pk`) — login at `/admin/login`
- [ ] Manager (`manager@emasjid.pk`) — login at `/manager/login`
- [ ] Committee (`committee@emasjid.pk`) — login at `/committee/login`
- [ ] Scholar (`scholar@emasjid.pk`) — login at `/login` (select Scholar)

### What Should Happen (per role)
- The forgot-password request returns the "Check Your Email" screen
- The reset email arrives in Mailtrap and the link works
- The new password `RolePass2024` logs the user in
- The old password no longer works

### Mark Result (one per role)
- Admin:    ☐ PASS  ☐ FAIL — Notes: _______________
- Manager:  ☐ PASS  ☐ FAIL — Notes: _______________
- Committee:☐ PASS  ☐ FAIL — Notes: _______________
- Scholar:  ☐ PASS  ☐ FAIL — Notes: _______________

---

## Final Checklist

☐ All 12 tests passed  
☐ No "Too many requests" errors during any test  
☐ Every "Send Reset Link" click produced exactly one email in Mailtrap (for real users)  
☐ "Resend" button only sent one extra email per click (no double-send)  
☐ The reset link only worked ONCE (Test 7)  
☐ Each role's forgot-password flow worked (Test 12)  
☐ The old password stopped working for every role (Test 9 + Test 12)  

## What To Send Back

1. **List of tests that PASSED**
2. **List of tests that FAILED** with the exact red/yellow toast text you saw
3. **Screenshots of any failures** (especially the red toast on Test 4 if you saw it)
4. **The Mailtrap email text** if any email looked different from what this guide described
5. **Anything else that "felt off"** — slow loading, weird wording, missing buttons, etc.

Send everything back to me in one message and I will go through it. Thanks for testing!
