# 16 Navbar + Mosque-context bug fixes — manual testing guide

Run this after re-loading the seed (`node backend/utils/seed.js`) and
restarting both the backend and frontend.

Window setup (Chrome + 3 incognito):
- **Window A** (regular): logged-out, just browsing
- **Window B** (incognito): log in as `user@emasjid.pk` / `user1234`
- **Window C** (incognito): log in as `admin@emasjid.pk` / `admin1234`
- **Window D** (incognito): log in as `committee@emasjid.pk` / `committee123`

Test at viewport widths **1280px** and **1100px** (use DevTools
responsive mode) — both are within the lg (1024-1279px) breakpoint
where the original bug showed up.

---

## Scenario A — Logged-out navbar with a mosque selected (Issue 1)

1. Open Window A. Resize the browser to **1280px** wide.
2. Navigate to `http://127.0.0.1:5174/`.
3. Open DevTools and inspect the `<header>` element. Note the height.
4. Click the **Mosque** selector in the navbar. Search for / pick
   **Masjid Al-Noor**.
5. **Expected:**
   - The navbar stays **a single row** (height ≤ 64px).
   - All four primary links (Home, Prayer Times, Events, Donate) +
     the Services and More dropdowns are visible.
   - The Login + Register buttons are visible at the right.
   - The mosque selector is **hidden** at this width when logged out
     (it only shows at xl+ ≥ 1280px).

6. Resize the browser to **1100px** wide. Note the navbar height again.
7. **Expected:** Still a single row, height ≤ 80px.

8. Resize to **1024px**. Same expectation.

## Scenario B — Logged-in navbar (regression check)

1. Open Window B. Log in as `user@emasjid.pk`.
2. Navigate to `/`. Resize between 1024px and 1366px.
3. **Expected:** Mosque selector **is** visible at lg (because the
   user avatar is small). All other navbar elements stay on one row.

## Scenario C — Login auto-selects user.mosqueId (Issue 2)

1. Open Window A. Resize to 1366px.
2. Pick **Masjid Al-Rahman** from the mosque selector.
3. **Expected:** Logo says *"Masjid Al-Rahman"*, the city says
   *"Sheikhupura"*.
4. Navigate to `/login`. Log in as `user@emasjid.pk` / `user1234`.
5. **Expected:** After login, the navbar's logo **automatically
   switches** to *"Masjid Al-Noor"* — your user's home masjid. The
   Al-Rahman selection is **overridden**.
6. Refresh the page (Ctrl+R). **Expected:** Stays on Al-Noor.

## Scenario D — Logout clears the override (regression check)

1. From Window B, click the user avatar → **Logout**.
2. **Expected:** Logo says *"E-Masjid — Select a mosque"* again
   (or whichever masjid is the auto-pick default — Al-Noor by default).

## Scenario E — MyRequests refetches on mosque switch (Issue 4)

1. In Window B (logged in as `user@emasjid.pk`), navigate to
   `/my-requests`. Open DevTools Network tab. Filter by
   `fund-requests`.
2. **Expected:** 1 GET `/api/fund-requests` on page load.
3. Open the mosque selector, pick **Masjid Al-Rahman**.
4. **Expected:** A new GET `/api/fund-requests` fires. The page
   visually refetches. The data may be identical (community is
   scoped to userId) but the request is made.

## Scenario F — Admin fund requests refetch on mosque switch (Issue 4)

1. In Window C (logged in as `admin@emasjid.pk`), navigate to
   `/admin/fund-requests`. Note the count of GET `/api/fund-requests`
   in Network.
2. Switch the mosque to **Masjid Al-Rahman** in the navbar.
3. **Expected:** A new GET fires. The admin's own fund requests
   are scoped to **user.mosqueId** (Al-Noor) — so the page still
   shows the same rows. **The API does not honor the navbar
   selection** (security). The refetch happens; the data is unchanged.

## Scenario G — Committee dashboard refetches on mosque switch (Issue 4)

1. In Window D (logged in as `committee@emasjid.pk`), navigate to
   `/committee`. Count the GET.
2. Switch the mosque in the navbar.
3. **Expected:** A new GET fires. Data is unchanged (committee is
   scoped to user.mosqueId).

## Scenario H — notifyCommittee emails all 4 Al-Noor committee members (Issue 3)

**Critical pre-step:** Re-run `node backend/utils/seed.js` before
this test. If you have an old DB without the 3 Gmail accounts, this
test will only confirm 1 email was attempted.

1. Start the backend (`npm start` in `backend/`). Watch the console.
2. In Window B, navigate to `/fund-request`. Submit a new request:
   - Name: `Phase 16 Email Tester`
   - Email: `phase16.email@example.com`
   - Amount: 3000
   - Reason: `Phase 16 E2E — verifying all committee members receive new-request notification.`
3. **Expected:** In the **backend console**, you see:
   ```
   [notifyCommittee] request=<id> mosqueId=<id> members=4 emails=committee@emasjid.pk,wb494929@gmail.com,ara786125@gmail.com,dawood.ahmed786678@gmail.com
   [notifyCommittee] sent=N failed=0
   ```
   where `members=4` confirms all 4 Al-Noor committee members were
   fetched. `sent=N` should be `4` if all SMTP sends succeeded.
4. Open the **4 Gmail inboxes** for the 3 real accounts plus your
   SMTP-sending account's sent folder. Confirm each received the
   *"New Fund Request - Medical"* email.
5. If `members=1` instead of `4`, your DB is stale. Re-run
   `node utils/seed.js`.

## Scenario I — Failed SMTP send is logged (Issue 3 followup)

1. Temporarily set `EMAIL_HOST` in `backend/.env` to an invalid host
   (e.g., `smtp.invalid.example`).
2. Restart the backend.
3. Submit a fresh request as in Scenario H.
4. **Expected:** Backend console shows:
   ```
   [notifyCommittee] sent=0 failed=4
   [notifyCommittee] #1 send failed: <error message>
   [notifyCommittee] #2 send failed: <error message>
   [notifyCommittee] #3 send failed: <error message>
   [notifyCommittee] #4 send failed: <error message>
   ```
   This proves the diagnostic logging works even when all sends fail.
5. Restore the correct `EMAIL_HOST`. Restart.

---

## Cleanup

After all tests pass:

1. No DB changes are needed.
2. Restore `.env` if you changed it in Scenario I.
3. Mark all 5 docs in this folder as complete.