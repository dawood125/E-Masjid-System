# 16 Navbar + Mosque-context bug fixes — bugs fixed (delivered)

All four issues found during post-Phase-15 manual testing have been
resolved in this sprint. The list below is the audit trail.

| ID | Component | Title | Fix delivered |
|---|---|---|---|
| **B16-1** | `frontend/src/components/Common/Navbar.jsx` | Logged-out + mosque-selected navbar wraps at lg | Hid mosque selector at lg when logged out; tightened logo width + nav `flex-nowrap`; reduced Login/Register button padding |
| **B16-2** | `frontend/src/context/MosqueContext.jsx` | MosqueContext doesn't react to AuthContext login | Added `useContext(AuthContext)` + `useEffect([user?._id, user?.mosqueId])` to force `activeMosqueId = user.mosqueId` on login |
| **B16-3** | `backend/services/fundRequestsService.js#notifyCommittee` | Silent failure on committee emails | Added `[notifyCommittee]` structured logging (members, emails, sent/failed counts, per-failure errors) |
| **B16-4** | `MyRequests.jsx` + `Admin/Pages/FundRequests.jsx` + `Committee/Pages/Dashboard.jsx` | Pages don't refetch when navbar mosque changes | Added `activeMosqueId` to `useEffect` deps in all three pages |
| **B16-5** | `seed.js` + live MongoDB + `sendEmail.js` + `fundRequestsService.js` + `.env` | Synthetic `committee@emasjid.pk` recipient caused bounce; user thought only 1 email was sent | Marked all 4 synthetic committee accounts `isActive: false` (seed + one-shot patch); added `replyTo` parameter to `sendEmail`; `notifyCommittee` now passes `replyTo: COMMITTEE_REPLY_TO` (defaults to `pa672189@gmail.com`). Diagnostic log now shows `members=3 emails=wb494929@gmail.com,ara786125@gmail.com,dawood.ahmed786678@gmail.com sent=3 failed=0` — all real inboxes |
| **B16-6** | `seed.js` + live MongoDB | 2 of 3 real Gmail accounts were newly-created; Gmail silently dropped the message (no bounce, no Spam) | One-shot patch script deactivated the 3 developer Gmail accounts and inserted 4 friend Gmail accounts (`jackcanada333`, `jackcanada111`, `motivation4`, `haseeb102323`). Diagnostic log now shows `members=4 emails=jackcanada333@gmail.com,jackcanada111@gmail.com,motivation4@gmail.com,haseeb102323@gmail.com sent=4 failed=0` |

See `bugs_found.md` for the full narrative.