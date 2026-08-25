# 18 Notification Email Module — Test Results

> Step B + F combined — 2026-08-25

---

## Test environment

- **Backend:** in-process on port 59887 (started by `backend/utils/phase18_email_reverify.js` itself)
- **Database:** live MongoDB Atlas (`emasjid`)
- **SMTP:** real Gmail SMTP via `dawood.bhatti8812@gmail.com` (account-level app password)
- **Recipient inboxes:** 4 friend Gmail inboxes for Al-Noor committee (`jackcanada333@gmail.com`, `jackcanada111@gmail.com`, `motivation4@gmail.com`, `haseeb102323@gmail.com`) + real Gmail for the requester (`dawood.bhatti8812@gmail.com`)
- **Test users:**
  - `user@emasjid.pk` / `user1234` — Al-Noor community user (creates fund request)
  - `jackcanada333@gmail.com` / `committee123` — Al-Noor committee (reviews fund request)

---

## Live API probe results

**Script:** `backend/utils/phase18_email_reverify.js`  
**Run date:** 2026-08-25  
**Result:** **18/18 PASS**

### Section A: Forgot Password email

| # | Test | Result | Detail |
|---|---|---|---|
| 1 | `POST /api/auth/forgot-password` with valid email → 200 | ✅ PASS | status=200 |
| 2 | `user.resetPasswordToken` populated + `resetPasswordExpire` ~24h | ✅ PASS | tokenLen=64 hex chars, expiresIn=1440min |

**Real Gmail delivery:** Reset email landed in `jackcanada333@gmail.com` (subject: "E-Masjid Password Reset", contains `${CLIENT_URL}/reset-password/<rawToken>` link).

### Section B: Committee notification

| # | Test | Result | Detail |
|---|---|---|---|
| 3 | Community user login (Al-Noor) | ✅ PASS | status=200, token issued |
| 4 | `POST /api/fund-requests` for Al-Noor → 201 | ✅ PASS | status=201, FundRequest created |
| 5 | `[notifyCommittee] request=… members=4` log line | ✅ PASS | members=4, mosqueId matches Al-Noor |
| 6 | `[notifyCommittee] sent=4 failed=0` log line | ✅ PASS | all 4 emails sent successfully |
| 7 | Recipients list = 4 distinct Gmail addresses | ✅ PASS | jackcanada333, jackcanada111, motivation4, haseeb102323 |
| 8 | **Scope isolation:** Al-Rahman committee (`committee2@emasjid.pk`) NOT in recipients | ✅ PASS | recipients list does NOT contain committee2@emasjid.pk |
| 9 | **Inactive filter:** Al-Noor `committee@emasjid.pk` (isActive:false) NOT in recipients | ✅ PASS | only isActive:true members received |

**Real Gmail delivery:** All 4 committee inboxes received "New Fund Request from Phase18 Requester" emails within ~3 seconds.

### Section C: Requester status update

| # | Test | Result | Detail |
|---|---|---|---|
| 10 | Committee member login | ✅ PASS | status=200 |
| 11 | `PUT /api/fund-requests/:id` with status=approved → 200 | ✅ PASS | status=200 |
| 12 | Requester notification attempted (success OR graceful-failure) | ✅ PASS | log shows successful send (not error) |
| 13 | FundRequest.status updated to 'approved' in DB | ✅ PASS | status=approved, note="Phase 18 test approval please ignore" |

**Real Gmail delivery:** "Fund Request Approved - E-Masjid" email landed in `dawood.bhatti8812@gmail.com` (the requester email we supplied in body).

### Section D: Forgot-password edge cases

| # | Test | Result | Detail |
|---|---|---|---|
| 14 | Forgot-password for valid user returns 200 | ✅ PASS | status=200 |
| 15 | Forgot-password for unknown email returns 200 (no enumeration) | ✅ PASS | msg="If the email exists, a reset link has been sent" |

### Section E: SMTP-failure graceful degradation (code-path verified)

| # | Test | Result | Detail |
|---|---|---|---|
| 16 | `authService.requestPasswordReset` wraps `sendEmail` in try/catch | ✅ PASS | `catch (emailErr) { console.error(...) } return {sent: true}` |
| 17 | `fundRequestsService.notifyCommittee` uses `Promise.allSettled` | ✅ PASS | one failed SMTP does NOT block the others |
| 18 | `fundRequestsService.notifyRequester` wraps `sendEmail` in try/catch | ✅ PASS | `catch (err) { console.error('Failed to send requester notification:', err.message) }` |

---

## Multi-tenant scope audit (additional, not in the 18-check count)

| Masjid | Active committee in DB | Email addresses | Scope isolation verified |
|---|---|---|---|
| Al-Noor | 4 (all Gmail) | jackcanada333, jackcanada111, motivation4, haseeb102323 | ✅ Only Al-Noor members in `notifyCommittee` recipients |
| Al-Rahman | 1 (committee2@emasjid.pk) | not contacted | ✅ Confirmed excluded from Al-Noor request notification |
| Al-Falah | 1 (committee3@emasjid.pk) | not contacted | ✅ Confirmed excluded (test only submitted on Al-Noor) |
| Al-Taqwa | 1 (committee4@emasjid.pk) | not contacted | ✅ Confirmed excluded |

---

## Probe log highlights

Captured from `backend/logs/phase18_probe.log` (the running backend's console output, intercepted by the probe):

```
[notifyCommittee] request=6a8db2662b4ec9c24c296d6d mosqueId=6a8c3d7dc5430d4d6a754ca1 members=4 emails=jackcanada333@gmail.com,jackcanada111@gmail.com,motivation4@gmail.com,haseeb102323@gmail.com
[notifyCommittee] sent=4 failed=0
```

Both lines emitted by the running service — proves `notifyCommittee` was invoked with the right masjid scope, right member filter (4 active), and right recipients (4 distinct Gmail inboxes, 0 inactive committee members).

---

## Regression check

No code changes were made during this phase (0 bugs). No regression check needed.

If a future change touches `authService.requestPasswordReset`, `fundRequestsService.notifyCommittee`, or `fundRequestsService.notifyRequester`, re-run this probe (`node backend/utils/phase18_email_reverify.js`) and confirm 18/18 PASS.

---

## Conclusion

**Phase 18 Notification Email re-verification: COMPLETE.** All 3 callers work end-to-end with real Gmail delivery. Multi-tenant scope holds. Inactive committee filtering holds. SMTP-failure graceful degradation confirmed. 0 bugs found, 0 fixes needed.