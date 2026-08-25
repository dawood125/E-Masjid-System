# E-Masjid Fund Request Flow — Single Manual Testing Guide

This is the **single document you need** to manually test the entire
Fund Request feature end-to-end. It covers:

- **Phase 13** — Committee voting + admin finalize (`13_Committee_Module/`)
- **Phase 14** — Community submission + My Requests view (`14_Fund_Requests_Module/`)
- **Phase 15** — Admin committee account management + deactivate-mid-vote (`15_Committee_Account_Management_Module/`)

You do **not** need to test the three per-phase guides separately —
this document supersedes them. The per-phase guides are kept for
historical reference and per-phase bug ledger.

---

## 0. Prerequisites

### 0.1 Services running

| Service | URL / Port | Verify |
|---|---|---|
| MongoDB | local instance or `mongod` | terminal: `mongosh` connects |
| Backend (Express) | `http://127.0.0.1:5000` | `curl http://127.0.0.1:5000/api/auth/login -X POST -H "Content-Type: application/json" -d '{"email":"user@emasjid.pk","password":"user1234"}'` returns `{"success":true,"token":"..."}` |
| Frontend (Vite/React) | `http://127.0.0.1:5174` | Browser opens the homepage with the green hero section |

### 0.2 Seed loaded

```bash
cd backend
node utils/seed.js
```

The seed script creates:

- **One super manager**: `manager@emasjid.pk` / `manager123`
- **Four masjids** (all in Sheikhupura):
  - Al-Noor (`admin@emasjid.pk` / `admin1234`)
  - Al-Rahman (`admin.rahman@emasjid.pk` / `admin123`)
  - Al-Falah (`admin.falah@emasjid.pk` / `admin123`)
  - An-Noor (`admin.an@emasjid.pk` / `admin123`)
- **Community users** (Al-Noor):
  - `user@emasjid.pk` / `user1234` (with one legacy approved fund request in the seed)
  - `user2@emasjid.pk` / `user1234` (no requests)
- **Al-Noor committee** (4 members — 1 synthetic + 3 real Gmail accounts):
  - `committee@emasjid.pk` / `committee123`
  - `wb494929@gmail.com` / `committee123`
  - `ara786125@gmail.com` / `committee123`
  - `dawood.ahmed786678@gmail.com` / `committee123`
- **Al-Rahman committee** (1): `committee.rahman@emasjid.pk` / `committee123`

### 0.3 Browsers to keep open

Open **five browser profiles / windows** (regular + 3 incognito for the
Gmail accounts):

| Window | Login as | Used for |
|---|---|---|
| A — Chrome (regular) | `user@emasjid.pk` | Community requester |
| B — Chrome incognito #1 | `user2@emasjid.pk` | Second community user (scoping test) |
| C — Edge or Firefox | `admin@emasjid.pk` | Al-Noor admin |
| D — Chrome incognito #2 | `committee@emasjid.pk` | Committee member 1 |
| E — Chrome incognito #3 | `wb494929@gmail.com` | Committee member 2 (Gmail) |
| F — Chrome incognito #4 | `ara786125@gmail.com` | Committee member 3 (Gmail) |
| G — Chrome incognito #5 | `dawood.ahmed786678@gmail.com` | Committee member 4 (Gmail) |
| H — Edge private | `admin.rahman@emasjid.pk` | Al-Rahman admin (cross-mosque test) |

Sign in to each window once at the start; you'll switch between them
throughout the test.

### 0.4 Pre-flight checklist

Before starting, confirm:

- [ ] All five windows are signed in with the right accounts
- [ ] In Window A, `/my-requests` shows one existing green-approved card
      (the legacy seeded request — used in Scenario 8)
- [ ] In Window D, `/committee` shows the four pending-request cards
      (or empty if none exist yet)
- [ ] In Window C, `/admin/fund-requests` shows the same legacy row
- [ ] In Window C, `/admin/committee` shows 4 rows (the Al-Noor
      committee)

If any of these don't match, re-run `node utils/seed.js` and log in
again.

---

## 1. Happy-path end-to-end (the story)

This is the single test an examiner would watch. Do it once before any
of the detailed scenarios below.

### Step 1.1 — Community submits a request (Window A)

1. In Window A, navigate to `http://127.0.0.1:5174/fund-request`.
2. Fill the form:
   - **Full Name:** `Hassan Umoor Test`
   - **Email:** `hassan.phase14@example.com`
   - **Phone:** `0305-9998877`
   - **Amount:** `12500`
   - **Category:** `Medical`
   - **Reason:** `Father needs urgent heart medication for the next 60 days and insurance is not covering it; please consider.`
   - **I agree to the terms:** ☑
3. Click *Submit Request*.
4. **Expected:** A green success page with heading *"Request Submitted"*
   and a reference ID formatted `FR-YYYYMMDD-XXXX`. **Write this ID
   down** — you will reference it as **`REQ-A`** below.

### Step 1.2 — Community sees the pending card (Window A)

1. In Window A, navigate to `/my-requests`.
2. Find the new card matching the reason text *"urgent heart medication"*.
3. **Expected:**
   - Amber status pill *"Pending Review"*
   - Amount *PKR 12,500* on the right
   - Amber banner: *"Committee has not started voting yet. We will email
     you once a final decision is made."*
   - **No** Final Decision card yet.

### Step 1.3 — Committee member 1 approves (Window D)

1. In Window D, navigate to `/committee`.
2. Find the card matching the requester name *"Hassan Umoor Test"*.
3. Click *Approve*. Optionally type a note: *"Verified by phone call"*.
4. Click *Submit Vote*.
5. **Expected:**
   - Toast: *"Vote recorded"*
   - The card flips to show *"Your vote: APPROVE"* badge
   - Tally shows *1 approve · 0 reject*

### Step 1.4 — Committee member 2 rejects (Window E)

1. In Window E, navigate to `/committee`.
2. Find the same Hassan card (you may need to refresh).
3. Click *Reject*. Optionally add a note: *"Documents incomplete"*.
4. Click *Submit Vote*.
5. **Expected:**
   - The same Hassan card now shows *1 approve · 1 reject*
   - Window D still shows the *"Your vote: APPROVE"* badge

### Step 1.5 — Committee member 3 approves (Window F)

1. In Window F, navigate to `/committee`.
2. Find the Hassan card.
3. Click *Approve*. Click *Submit Vote*.
4. **Expected:**
   - The tally now reads *2 approve · 1 reject*

### Step 1.6 — Requester sees live tally (Window A)

1. In Window A, navigate to `/my-requests` (refresh).
2. Find the Hassan card.
3. **Expected:**
   - The amber *"no votes yet"* banner is **gone**.
   - In its place: *"Committee is reviewing — 2 thumb_up · 1 thumb_down of 3 vote(s)"*

### Step 1.7 — Admin finalizes (Window C)

1. In Window C, navigate to `/admin/fund-requests`.
2. Find the row matching `REQ-A`. The row's *Votes* column shows `2✓ · 1✗`.
3. Click *Finalize*.
5. **Expected:**
   - Modal opens with heading *"Finalize Fund Request"*
   - Tally shows `2 approve · 1 reject`
   - Auto-outcome section reads *"Approved (majority approve)"*
   - Textarea for *Final Note* is empty
6. Type in the Final Note:
   ```
   Verified home visit confirmed medication need; please collect at office.
   ```
7. Click *Confirm Finalize*.
8. **Expected:**
   - Modal closes
   - The row in the admin table flips to a green *Approved* pill
   - Toast: *"Fund request finalized"*

### Step 1.8 — Requester sees Final Decision (Window A)

1. In Window A, refresh `/my-requests`.
2. Find the Hassan card.
3. **Expected:**
   - Green status pill *"Approved"*
   - Green Final Decision card with:
     - *"Final Decision by Abdullah Manager"*
     - Timestamp (today's date)
     - Your note: *"Verified home visit confirmed medication need; please collect at office."*
     - Green hint: *"Please visit the mosque office during working hours to collect your assistance."*

### Step 1.9 — Requester received the email (Gmail)

1. Open `hassan.phase14@example.com` (or whichever inbox you used) in
   a separate tab.
2. **Expected:** A single email from the E-Masjid system with subject
   *"Fund Request Approved - E-Masjid"*, body containing the amount,
   category, final note, and the office-visit hint.
3. **Verify:** Only **one** email was sent — no per-vote notifications.

If every step above passed, the core flow works. Move to Section 2
for the edge cases.

---

## 2. Form validation (community submit)

Repeat from Window A, navigating to `/fund-request` each time.

| # | Action | Expected error / outcome |
|---|---|---|
| 2.1 | Leave **Full Name** empty, fill the rest, click Submit | Inline red error *"Full name is required"* |
| 2.2 | Empty **Email**, rest filled | Inline red error *"Valid email is required"* |
| 2.3 | **Email** = `not-an-email` | Inline red error *"Valid email is required"* |
| 2.4 | **Phone** = `123` | Inline red error *"Invalid phone"* |
| 2.5 | **Amount** = `0` | Inline red error *"Valid amount is required"* |
| 2.6 | **Amount** = `-100` | Inline red error *"Valid amount is required"* |
| 2.7 | **Category** left at default / blank | Inline red error *"Category is required"* |
| 2.8 | **Reason** = `too short` | Inline red error *"Reason must be at least 30 characters"* |
| 2.9 | **Reason** exactly 29 chars | Inline red error (still rejected) |
| 2.10 | **Reason** exactly 30 chars | Form submits successfully |
| 2.11 | **I agree to the terms** unchecked, rest valid | Inline red error *"You must agree to the terms before submitting"* |
| 2.12 | Valid form | Success page with reference ID |

---

## 3. Cross-mosque isolation

| # | Action | Expected |
|---|---|---|
| 3.1 | In Window C (Al-Noor admin), `/admin/fund-requests` shows only Al-Noor rows. | No Al-Rahman / Al-Falah / An-Noor rows visible |
| 3.2 | In Window H (Al-Rahman admin), `/admin/fund-requests` shows zero Al-Noor rows | Empty table |
| 3.3 | In Window H, `/admin/committee` shows zero Al-Noor rows | Empty table |
| 3.4 | In Window H, in DevTools console, run `fetch('/api/fund-requests', {headers: {Authorization: 'Bearer ' + localStorage.authToken}}).then(r => r.json()).then(d => console.log(d.data.length))` | Prints `0` (or only Al-Rahman rows) — no Al-Noor rows |
| 3.5 | In Window A, open DevTools console, run the same command | Prints the count of own requests only (no other Al-Noor user) |
| 3.6 | In Window B (user2), `/my-requests` shows zero Hassan / Bilal rows | Only user2's own requests (likely empty) |

---

## 4. Cross-mosque `mosqueId` body bypass attempt

In Window A, in DevTools console, run:

```js
fetch('/api/fund-requests', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + localStorage.authToken },
  body: JSON.stringify({
    requesterName: 'Sneaky Sneaker',
    requesterEmail: 'sneaky@example.com',
    requesterPhone: '0301-0000000',
    amount: 9999,
    category: 'Other',
    reason: 'I am trying to create a request for another masjid to test if it is blocked.',
    mosqueId: 'ANY_OTHER_MASQUE_ID_HERE',
  }),
}).then(r => r.json()).then(d => console.log(d))
```

**Expected:** Response is `{"success": false, "message": "Cannot create a request for another mosque"}` with HTTP 400. The request is **not** created.

---

## 5. Tied votes → admin must override

### 5.1 Create a request that will tie

1. In Window A, navigate to `/fund-request` and submit a fresh request:
   - Name: `Tied Test Requester`
   - Amount: `5000`
   - Reason: `Phase 15 E2E — children need school books and uniforms for the new term starting next week.`
2. **Write down the new reference ID as `REQ-B`.**

### 5.2 Cast exactly 1 approve + 1 reject

1. In Window D (`committee@emasjid.pk`), find `REQ-B`, click *Approve*.
2. In Window E (`wb494929@gmail.com`), find `REQ-B`, click *Reject*.

### 5.3 Admin opens Finalize — modal forces a choice

1. In Window C, navigate to `/admin/fund-requests`, find `REQ-B`.
2. The row's Votes column shows `1✓ · 1✗` with a yellow **TIED** indicator.
3. Click *Finalize*.
4. **Expected:**
   - Modal opens
   - A prominent warning reads *"Votes are tied — please pick an outcome"*
   - A dropdown appears with options `Approved` / `Rejected` (no
     auto-selected default)
   - A Final Note textarea is shown

### 5.4 Admin picks Rejected

1. In the dropdown, select `Rejected`.
2. Type: `Verified home visit did not show urgent need at this time.`
3. Click *Confirm Finalize*.
4. **Expected:**
   - Modal closes
   - Row flips to red *Rejected* pill
   - Toast: *"Fund request finalized"*

### 5.5 Requester sees the rejection

1. In Window A, refresh `/my-requests`, find the tied request card.
2. **Expected:** Red Final Decision card with the rejection note. **No**
   green office-visit hint (because rejected).

### 5.6 Tied override to Approved

1. Submit a fresh request in Window A — name it `Tied Approved Test`.
2. Cast 1 approve (Window D) + 1 reject (Window E).
3. In Window C, click *Finalize*, select `Approved`, type a note, click
   *Confirm Finalize*.
4. Verify in Window A that the Final Decision card is **green** with the
   office-visit hint.

---

## 6. Late vote on finalized request

1. Create a fresh request in Window A — name it `Late Vote Test`.
2. Cast 3 approves (Windows D, E, F).
3. Admin finalizes (Window C) → status approved.
4. Now open Window G (`dawood.ahmed786678@gmail.com`), navigate to
   `/committee`, find the same card.
5. **Expected:** The card does **not** appear in the committee list at
   all (only pending requests are shown).
6. **If it does appear** (because you refreshed too late), try to click
   *Approve* or *Reject*.
7. **Expected:** API returns 409 *"Request is already finalized; cannot
   vote"*, UI shows a red toast.

---

## 7. Re-vote replaces previous

1. Create a fresh request in Window A — name it `Re-vote Test`.
2. In Window D, vote *Approve*.
3. In Window D, vote *Reject* on the same card.
4. **Expected:**
   - The *"Your vote"* badge flips to *REJECT*
   - Tally still shows *0 approve · 1 reject* (the previous approve is
     replaced, not added)
   - `votes.length` in the DB is `1` (one entry per member)

---

## 8. Legacy seed data fallback

1. In Window A, navigate to `/my-requests`.
2. Find the **legacy** green-approved card that was created by the seed
   (it uses `reviewedBy.name` + `reviewNote` instead of the new
   `finalizedBy` + `finalNote`).
3. **Expected:**
   - Green pill *Approved*
   - Final Decision card showing the **legacy** values: *"by Abdullah
     Manager"* and the legacy review note text *"Verified by committee
     with local reference and documents."*
   - Green office-visit hint

This proves the Phase 14 fallback (B14-1) works — old data still
renders correctly.

---

## 9. Admin Committee account CRUD (Phase 15)

All steps here are in Window C.

### 9.1 List renders

1. Navigate to `/admin/committee`.
2. **Expected:** 4 rows for the Al-Noor committee (1 synthetic + 3
   Gmail accounts).

### 9.2 Create member

1. Click *Add Member*.
2. Fill:
   - Name: `Phase 15 Manual Tester`
   - Email: `phase15.manual@example.com`
   - Phone: `0301-5556677`
3. Click *Create Member*.
4. **Expected:**
   - New row appears
   - Toast: `Member created. Temp password: <random>` (write down the
     temp password — you'll use it in 9.5)

### 9.3 Duplicate email rejected

1. Click *Add Member* again.
2. Fill email = `committee@emasjid.pk` (an existing email).
3. Click *Create Member*.
4. **Expected:** Toast: *"Email already registered"* (HTTP 400).

### 9.4 Toggle Active → Inactive via the status pill

1. Find the row for `Phase 15 Manual Tester`.
2. Click the green *Active* pill.
3. **Expected:** Pill flips to gray *Inactive*, toast *"Status updated"*.
4. Refresh the page — the pill stays *Inactive*.

### 9.5 Login blocked for the deactivated member

1. Open a **new** browser window (Window I).
2. Navigate to `/login`.
3. Email: `phase15.manual@example.com`, Password: the temp password from
   9.2.
4. Click *Login*.
5. **Expected:** Red error: *"Account is deactivated"* (HTTP 403).
6. Close Window I.

### 9.6 Old token of deactivated member is rejected

1. In Window C, find `committee@emasjid.pk` (the original synthetic
   committee member) in the table.
2. Click the green *Active* pill → flips to *Inactive*.
3. Open DevTools in **Window D** (the one already signed in as
   `committee@emasjid.pk`). In the Network tab, trigger any request
   (e.g., navigate to `/committee` again).
4. **Expected:** The page redirects to `/login` with a toast *"Your
   account is deactivated"*.

### 9.7 Reactivate restores access

1. In Window C, click the gray *Inactive* pill for `committee@emasjid.pk`
   → flips back to *Active*.
2. In Window D, log in again with `committee@emasjid.pk` / `committee123`.
3. **Expected:** Login succeeds, committee dashboard loads.

### 9.8 Delete member

1. In Window C, find the row for `Phase 15 Manual Tester`.
2. Click the red trash button.
3. **Expected:** A browser `window.confirm` dialog appears with text
   like *"Remove this committee member? This cannot be undone."*
4. Click *OK*.
5. **Expected:** Row disappears, toast *"Committee member removed"*.

### 9.9 Cross-mosque delete blocked

1. In Window H (Al-Rahman admin), navigate to `/admin/committee`.
2. Confirm the list is empty (or only shows Al-Rahman members).
3. In DevTools console, try:
   ```js
   fetch('/api/committee/<al-noor-committee-id>', {
     method: 'DELETE',
     headers: { Authorization: 'Bearer ' + localStorage.authToken },
   }).then(r => r.status)
   ```
4. **Expected:** Returns `404`.

---

## 10. Deactivate-mid-vote (the edge case)

This is the scenario the Phase 15 backend suite specifically covers.

### 10.1 Cast a vote, then deactivate, then try to change

1. Create a fresh request in Window A — name it `Mid-vote Test`.
2. In Window D (`committee@emasjid.pk`), find the card, click *Approve*.
3. **Write down** the vote tally — it's now `1 approve`.
4. In Window C, find `committee@emasjid.pk` in the admin Committee
   table and click the *Active* pill → flips to *Inactive*.
5. In Window D (which still has the page open), try to click *Reject*
   on the same card.
6. **Expected:**
   - The click either (a) redirects to `/login` because the auth
     middleware rejected the old token, OR (b) the API call returns
     HTTP 401 *"Account is deactivated"* and the UI shows a red toast.
   - In either case, the tally on the request **stays at** `1 approve`
     (the previous approve is preserved, not modified).

### 10.2 Reactivate and re-vote

1. In Window C, click the gray *Inactive* pill for
   `committee@emasjid.pk` → back to *Active*.
2. Log in Window D again as `committee@emasjid.pk`.
3. Find the `Mid-vote Test` card in `/committee`.
4. Click *Reject*.
5. **Expected:**
   - Vote succeeds (HTTP 200)
   - The card's *"Your vote"* badge flips to *REJECT*
   - Tally reads `0 approve · 1 reject` (the previous approve was
     replaced, not added)

### 10.3 Deactivated members don't receive emails

1. Create a fresh request in Window A — name it `Email Skip Test`.
2. In Window C, deactivate `wb494929@gmail.com` (Window E) — click the
   *Active* pill to make *Inactive*.
3. Submit another fresh request — name it `Email Skip Test 2`.
4. Log into Gmail for `wb494929@gmail.com` in a private window.
5. **Expected:**
   - The `Email Skip Test 2` email is **not** in the inbox.
   - The `Email Skip Test` email **may** be in the inbox (the request
     was created before deactivation — `notifyCommittee` had already
     fired).

### 10.4 Cleanup

1. In Window C, reactivate any members you deactivated during this
   section.

---

## 11. Race condition — two simultaneous finalizes

This is hard to reproduce manually. The Playwright suite covers it
automatically (Section 9 of `Testing/13_Committee_Module/committee_voting_test.js`).
If you want to try:

1. Create a fresh request with 3 approves (Windows D, E, F all vote).
2. In Window C, open two browser tabs of `/admin/fund-requests`.
3. In tab #1, click *Finalize* → confirm → quickly switch to tab #2,
   click *Finalize* → confirm.
4. **Expected:** Only one of the two finalizes succeeds. The other
   shows a red toast *"Request is already finalized"*. The DB ends in
   a single `finalizedBy` + `finalizedAt`.

---

## 12. What to check in the email (Gmail)

Open each of the 4 Gmail inboxes used by the Al-Noor committee
(`wb494929@gmail.com`, `ara786125@gmail.com`,
`dawood.ahmed786678@gmail.com`) in private windows and verify:

- For each `New Fund Request` you submitted, **all active** committee
  members received the same email at the same time.
- The requester received **one** `Fund Request Approved` (or
  `Rejected`) email **only after** the admin clicked *Finalize* —
  not before, not per vote.

---

## 13. Cleanup at the end

After all tests pass:

1. In Window C, restore all committee members to `isActive: true`.
2. The Phase 13 / 14 / 15 test data (Hassan, Mid-vote Test, etc.) can
   remain in the DB — they're harmless and useful for demos.

---

## 14. Result checklist (what to mark in `my_test_results.md`)

When you finish, in **each** of the per-phase `my_test_results.md`
files, fill in the "Outcome" section:

| Phase | Folder | File |
|---|---|---|
| 13 | `13_Committee_Module/` | `my_test_results.md` |
| 14 | `14_Fund_Requests_Module/` | `my_test_results.md` |
| 15 | `15_Committee_Account_Management_Module/` | `my_test_results.md` |
| 16 | `16A_Navbar_Mosque_BugFixes/` | `my_test_results.md` (bug fixes from manual testing) |

For each, write something like:

```markdown
## Manual run — 2026-08-24

Followed `FUND_REQUEST_FLOW_MANUAL_TEST.md`. Sections tested:

- 1 (Happy path): all 9 steps PASS
- 2 (Form validation): all 12 cases PASS
- 3 (Cross-mosque): all 6 cases PASS
- 4 (Bypass attempt): blocked with 400 PASS
- 5 (Tied vote): both 5.4 and 5.6 PASS
- 6 (Late vote): PASS
- 7 (Re-vote): PASS
- 8 (Legacy fallback): PASS
- 9 (Committee CRUD): all 9 sub-scenarios PASS
- 10 (Deactivate-mid-vote): all 4 sub-scenarios PASS
- 11 (Race): N/A (covered by Playwright)
- 12 (Gmail): 4 of 4 inboxes received the right emails
- 13 (Phase 16 navbar fixes): scenarios A-I from `16A_Navbar_Mosque_BugFixes/manual_testing_guide.md` PASS

No new bugs found.
```

---

## 15. Post-Phase-15 navbar + mosque-context fixes (Phase 16)

Four bugs were found during manual testing of the Fund Request flow and
fixed in a separate sprint. The scenarios for them live in
`Testing/16A_Navbar_Mosque_BugFixes/manual_testing_guide.md`. Summary:

| # | Bug | Symptom | Fix |
|---|---|---|---|
| 16-A | Logged-out navbar wraps at lg | "More" dropdown misaligned when a mosque is selected while logged out | Hide mosque selector at lg when logged out; tighten nav layout |
| 16-B | Login doesn't auto-select home masjid | Navbar keeps showing the previously-picked masjid after login | `MosqueContext` listens to `AuthContext.user.mosqueId` |
| 16-C | notifyCommittee silent on failure | No way to tell whether emails were dispatched or how many failed | Added structured `[notifyCommittee]` console logging |
| 16-D | Mosque switch doesn't refetch pages | `/my-requests`, `/admin/fund-requests`, `/committee` don't update | `activeMosqueId` added to `useEffect` deps |

**To run the Phase 16 verification:**

```bash
node Testing/16A_Navbar_Mosque_BugFixes/navbar_mosque_test.js
```

**To watch the Issue-3 email logging live:**

1. Start the backend and watch the stdout.
2. Submit a new fund request.
3. You should see exactly one line per request:
   ```
   [notifyCommittee] request=<id> mosqueId=<id> members=4 emails=committee@emasjid.pk,wb494929@gmail.com,ara786125@gmail.com,dawood.ahmed786678@gmail.com
   [notifyCommittee] sent=N failed=0
   ```
   where `members=4` confirms all 4 Al-Noor committee members were
   fetched and `sent=4` confirms all 4 emails went through.

If `members=1`, your local DB is stale — re-run
`node backend/utils/seed.js` and try again.

---

## Quick-reference: where the data lives

| Concern | File / endpoint |
|---|---|
| Submit a request (UI) | `/fund-request` |
| My Requests (UI) | `/my-requests` |
| Committee dashboard (UI) | `/committee` |
| Admin fund requests (UI) | `/admin/fund-requests` |
| Admin committee (UI) | `/admin/committee` |
| Login (UI) | `/login` |
| Public read endpoint | `GET /api/fund-requests/:id` |
| Submit API | `POST /api/fund-requests` |
| Vote API | `POST /api/fund-requests/:id/vote` |
| Finalize API | `POST /api/fund-requests/:id/finalize` |
| List committee API | `GET /api/committee` |
| Create committee API | `POST /api/committee` |
| Update committee API | `PUT /api/committee/:id` |
| Delete committee API | `DELETE /api/committee/:id` |

---

## What to do if you find a bug

If any step in this guide produces an unexpected result:

1. **Stop** and note the exact step number (e.g., "10.1 step 5 — vote
   was not blocked").
2. Capture a screenshot (Windows logo + PrtScn).
4. Open an entry in `bugs_found.md` for the relevant phase with:
   - The ID (B13-N+1, B14-N+1, B15-N+1)
   - The step that failed
   - Expected vs actual behavior
   - The screenshot reference
3. **Do not apply a fix yourself** — per the master plan workflow,
   propose the fix in `bugs_found.md`, wait for client approval, then
   apply it.

---

That's the entire manual test in one place. Total expected time for a
thorough run: ~90 minutes.