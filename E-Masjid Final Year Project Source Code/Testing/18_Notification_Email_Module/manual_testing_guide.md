# 18 Notification Email Module — Manual Testing Guide

> **For the project partner / FYP examiner.** No technical knowledge required. All tests run in the browser and check real Gmail inboxes. Estimated time: ~15 minutes.

**Test environment setup:**
- Backend running on `http://localhost:5000`
- Frontend running on `http://localhost:5174`
- 4 Gmail inboxes open in browser tabs for Al-Noor committee:
  - `jackcanada333@gmail.com`
  - `jackcanada111@gmail.com`
  - `motivation4@gmail.com`
  - `haseeb102323@gmail.com`
- Your personal Gmail (`dawood.bhatti8812@gmail.com`) for receiving requester notifications and password resets

**What we're testing:** All 3 places the system sends email:
1. **Forgot-password** — when you click "Forgot Password" on the login page
2. **Committee notification** — when a community user submits a fund request, all active committee members of that masjid get an email
3. **Requester status update** — when committee approves/rejects a fund request, the requester gets an email

---

## Test 1 — Forgot Password email (3 min)

**What we're testing:** Clicking "Forgot Password" sends a real email with a working reset link.

### Steps

1. Open `http://localhost:5174/login` in your browser.
2. Click the **"Forgot Password?"** link below the login button.
3. Enter `jackcanada333@gmail.com` in the email field.
4. Click **"Send Reset Link"**.
5. You should see a green toast: **"If the email exists, a reset link has been sent"**.

### Verification

6. Open `https://mail.google.com` in a new tab and sign in as `jackcanada333@gmail.com`.
7. Look for an email with subject **"E-Masjid Password Reset"** (should arrive within ~10 seconds).
8. Open the email. It should contain a button **"Reset Password"** that links to `http://localhost:5174/reset-password/<long-token>`.
9. Click the link. You should land on the Reset Password page.

✅ **Pass:** Email arrives within ~10 seconds + link works.

❌ **Fail:** No email arrives after 1 minute → check `EMAIL_USER` / `EMAIL_PASS` env vars are set in `backend/.env`.

### Edge case — unknown email

10. Repeat Steps 2-4 but enter `nobody-here-12345@example.com`.
11. You should STILL see the same success message (green toast).
12. **No email is sent** to that address (it doesn't exist).

✅ **Pass:** Same success message for unknown email — this is intentional, prevents attackers from enumerating which emails are registered.

---

## Test 2 — Committee notification when a fund request is submitted (5 min)

**What we're testing:** Submitting a fund request on Al-Noor sends an email to ALL 4 active committee members.

### Steps

1. Open `http://localhost:5174` and select **Masjid Al-Noor** from the masjid dropdown at the top.
2. Log in as a community user: `user@emasjid.pk` / `user1234`.
3. Navigate to the fund request form (Community menu → Fund Request).
4. Fill in the form:
   - **Full Name:** `Manual Test Donor`
   - **Email:** `dawood.bhatti8812@gmail.com` (your real Gmail so you can verify requester email later)
   - **Phone:** `03001234567`
   - **Amount:** PKR 5,000
   - **Category:** Medical
   - **Reason:** "Manual test request please ignore"
   - **Mosque:** Masjid Al-Noor (already selected)
5. Click **"Submit Request"**.
6. You should see a success toast.

### Verification

7. Now check **all 4 Gmail inboxes** (sign in to each in a separate browser tab, or use Gmail's "Add another account"):
   - `jackcanada333@gmail.com`
   - `jackcanada111@gmail.com`
   - `motivation4@gmail.com`
   - `haseeb102323@gmail.com`

8. In each inbox, look for an email with subject **"New Fund Request from Manual Test Donor"** (or similar — "New Fund Request" prefix).
9. **All 4 inboxes should receive the email** within ~10 seconds.
10. Open one and confirm it shows: requester name, amount (PKR 5,000), category (Medical), reason, masjid (Al-Noor).

✅ **Pass:** All 4 active Al-Noor committee get the email.

❌ **Fail:** Fewer than 4 emails arrive → check backend console for `[notifyCommittee]` log line.

### Edge case — scope isolation (Al-Rahman committee should NOT receive)

11. Now log in as a committee member from a DIFFERENT masjid to check they did NOT get the email:
    - Log in as `committee2@emasjid.pk` (Al-Rahman) / password from seed file (check `backend/utils/seed.js` line 491-ish)
12. Check the Al-Rahman committee's inbox. **No email should be present.**

✅ **Pass:** Al-Rahman committee gets NO Al-Noor request emails (multi-tenant scope holds).

❌ **Fail:** Al-Rahman committee receives the email → SCOPE LEAK, flag immediately as critical.

---

## Test 3 — Requester status update email (5 min)

**What we're testing:** When committee approves a fund request, the requester (the email you put in Test 2) gets a status email.

### Steps

1. Using the fund request you created in Test 2 (still logged in as community user `user@emasjid.pk`), you should see it in "My Requests" as **"pending"**.
2. **Log out** and log back in as a committee member:
   - `jackcanada333@gmail.com` / `committee123`
3. Navigate to the committee dashboard.
4. Find the fund request from **"Manual Test Donor"** (amount PKR 5,000, Medical, Al-Noor).
5. Click on it. You should see options to **Approve** or **Reject**.
6. Add a review note: "Manual test approval please ignore".
7. Click **"Approve"** (or "Approve Request").
8. You should see a success message.

### Verification

9. Check `dawood.bhatti8812@gmail.com` (the email you supplied in Test 2's requester form).
10. Look for an email with subject **"Fund Request Approved - E-Masjid"** (should arrive within ~10 seconds).
11. Open the email. It should show:
    - Requester name: Manual Test Donor
    - Amount: PKR 5,000
    - Category: Medical
    - Status: ✅ Approved
    - Review note: "Manual test approval please ignore"
    - Instruction: "Please visit the mosque office to collect your assistance."

✅ **Pass:** Requester receives the approved email with correct details.

❌ **Fail:** No email arrives → check backend console for `[notifyRequester]` or "Failed to send requester notification" log.

---

## Test 4 — Multi-masjid scope (committee doesn't get other masjids' emails) (2 min)

**What we're testing:** Cross-masjid isolation. A committee member of Al-Rahman should NOT receive notifications about Al-Noor requests (already partially covered in Test 2).

### Steps

1. Log out, log in as a committee member of **Al-Rahman**:
   - Email: `committee2@emasjid.pk`
   - Password: check `backend/utils/seed.js` line 491 (printed at seed time, also shown in seed console output)
2. Check the Al-Rahman committee member's inbox (the email tied to that account).
3. **No "New Fund Request" emails about Al-Noor should be present.**

✅ **Pass:** Al-Rahman committee gets NO Al-Noor emails (scope isolation holds).

❌ **Fail:** Al-Rahman committee receives Al-Noor emails → critical scope leak.

---

## What to look out for

| Symptom | Likely cause | What to do |
|---|---|---|
| No email arrives after 1 minute | SMTP not configured / wrong credentials | Check `backend/.env` has `EMAIL_USER=dawood.bhatti8812@gmail.com` and a valid `EMAIL_PASS` (Gmail app password) |
| Some committee get email, others don't | One committee member's email is `isActive:false` in DB | Expected behavior — inactive members don't get emails. Check `Email/console: [notifyCommittee] sent=3 failed=0` |
| Requester email contains wrong masjid | Scope leak | Critical — flag immediately |
| Forgot-password email contains wrong reset link | Wrong `CLIENT_URL` env var | Check `backend/.env` `CLIENT_URL=http://localhost:5174` |
| Toast says "Reset link sent" but no email | SMTP failure but error swallowed (intentional) | Check backend console for "Failed to send password reset email" log line — this is informational, not a bug |

---

## Reporting

When you've run the tests, report back:

- ✅ All passed → move on to next phase
- ❌ One or more failed → describe what you saw (screenshot if possible), which test number, which masjid, and any toast messages / error text

The developer will investigate any failures.