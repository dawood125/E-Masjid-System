# Phase 8 — Expenses Module: bugs found

## Bug list

### B1 — Filter on Transparency page didn't work for expenses

**Phase:** 8 — manual testing
**Reported by:** User + partner
**Severity:** Medium (workaround: change masjid via navbar)

**Description:** The Transparency page (`/transparency`) had a Month
filter and a Type filter that only applied to donations. The Expenses
section had no filter UI at all, so users couldn't narrow the
expense list by category or month.

**Repro:**
1. Open `/transparency` while logged out.
2. Note the Donations list filters by month.
3. Scroll to Expense History — no filter dropdown or chips.

**Expected:** Expenses tab has the same controls as donations
(month + category).

**Status:** Fixed (commit pending).

---

### B2 — "View All" button showed a toast, did nothing

**Phase:** 8 — manual testing
**Reported by:** User + partner
**Severity:** Low (cosmetic stub)

**Description:** The "View All" button on both Donation History and
Expense History sections just showed a toast saying "Loading full
records...". It was never wired to anything.

**Repro:**
1. Open `/transparency`.
2. Click "View All" on either section.
3. Toast appears, list does not change.

**Expected:** View All loads up to 100 recent rows.

**Status:** Fixed (commit pending).

---

### B3 — "Download Report" button showed a toast, did nothing

**Phase:** 8 — manual testing
**Reported by:** User + partner
**Severity:** Low (cosmetic stub)

**Description:** Same as B2 — the Download Report button showed a
toast and did not generate a file. The code comment said
"Export will be added in next iteration".

**Repro:**
1. Open `/transparency`.
2. Click "Download Report".
3. Toast appears, no file downloads.

**Expected:** A CSV file containing donations summary, expenses
summary, top donors, and recent records is downloaded.

**Status:** Fixed (commit pending).

---

### B4 — Forgot password returned success but no email arrived

**Phase:** 8 — manual testing (also Phase 2)
**Reported by:** User + partner
**Severity:** High (blocked the forgot-password demo path)

**Description:** The `/api/auth/forgot-password` endpoint returned
200 with the neutral success message, but the password reset email
was never delivered. SendGrid's free tier had flagged the sender.

**Repro:**
1. Visit `/forgot-password`.
2. Enter a registered email.
3. Toast says "If the email exists, a reset link has been sent".
4. Check inbox — nothing arrives.

**Expected:** Reset email arrives in inbox (not spam).

**Root cause:** SendGrid account on the free tier stopped delivering
for the configured sender.

**Fix:** Switched SMTP from SendGrid to Gmail SMTP (port 587, app
password). Removed `@sendgrid/mail` dependency. End-to-end verified:
reset email delivered to `dawood.bhatti8812@gmail.com`.

**Status:** Fixed (commit pending).

---

### B5 — City filter in masjid selection was exact match

**Phase:** 8 — manual testing (also Phase 3)
**Reported by:** User + partner
**Severity:** Medium (most users will type partial city names)

**Description:** The masjid search modal's city filter only matched
exact city strings. Typing "sheikh" returned zero results even
though all 4 masjids are in "Sheikhupura".

**Repro:**
1. Open the masjid selection modal (login navbar selector).
2. Type "sheikh" in the City field.
3. Result: "No mosques match your search."

**Expected:** "sheikh" matches "Sheikhupura" (substring + case
insensitive).

**Root cause:** `mosquesService.js` built the regex with `^...$`
anchors, forcing exact match.

**Status:** Fixed (commit pending).

---

## Late-discovered (not yet retested)

These were found in the same session but the user hasn't run a
full retest of scenarios C–G. They may surface more bugs:

- C: Admin CRUD — needs retest after the .env cleanup
- D: Cross-mosque authorization — needs retest
- E: Super admin scope — needs retest
- F: Form validation — needs retest
- G: skipped (no anonymity for expenses)
