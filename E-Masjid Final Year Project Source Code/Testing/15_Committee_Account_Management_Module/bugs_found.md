# 15 Committee Account Module — bugs found

| ID | What | How fixed |
|---|---|---|
| **B15-1** | `backend/middleware/auth.js#protect` did not check `req.user.isActive`, so a deactivated committee member's existing JWT kept working — they could keep voting on a still-pending request, even after the admin had clicked the *Inactive* pill | Added `if (req.user.isActive === false) return 401 "Account is deactivated..."`. The check runs on every protected route (not just `/api/committee`), so the committee dashboard, fund vote endpoint, and finalize endpoint all reject the token. Covered by Section 6 + backend test `old token of deactivated member is rejected on next request`. |
| **B15-2** | `backend/services/authService.js#login` did not check `user.isActive` before issuing a JWT — a deactivated account could log in, get a new token, and re-cast a vote they should not have been able to | Added `if (!user.isActive) throw httpError(403, 'Account is deactivated')` after the password match. Covered by backend test `deactivated member cannot log in`. |
| **B15-3** | `notifyCommittee` did not filter `isActive: true` — a deactivated committee member still received the "New Fund Request" email, even though they could no longer log in to vote | Added `isActive: true` to the `User.find` query in `fundRequestsService.js#notifyCommittee`. Covered by backend test `notifyCommittee skips deactivated members`. |
| **B15-4** | `frontend/src/components/Admin/Pages/Committee.jsx` did not scope `getCommitteeMembers()` to the admin's own mosque client-side; the displayed mosque name was the hard-coded string `"Current Mosque"` — the admin never knew which masjid a committee member belonged to in the multi-tenant setup | The backend already scopes the list to `user.mosqueId`, and the column renders the backend's `mosqueName` if present (with `"Current Mosque"` as a fallback for the seeded data). Verified that no cross-mosque leak is possible. |
| **B15-5** | `castVote` had no deactivation check — a committee member whose `isActive` flipped mid-flow could still change their vote because the controller only checked `user.role === 'committee'`, not `user.isActive` | Now handled by the B15-1 middleware fix: the deactivated token is rejected with 401 before the controller runs. No controller-side change required. |
| **B15-6** | Re-voting after re-activation could have caused two `votes[]` entries (one from before deactivation, one from after) because the replace-by-member logic assumed the member was continuously active | The atomic guard `{ _id, status: 'pending' }` in `castVote` already re-finds by `_id` and replaces the slot keyed on `member`. The vote object itself is replaced (matched by `member._id`) regardless of when it was created. Verified by `re-activated member can vote again on the same request` — `votes.length` stays at 1. |
| **B15-7** | `frontend/src/components/Admin/Pages/Committee.jsx#deleteMember` did not ask for confirmation — clicking the trash button permanently deleted the user with no undo | Added a `window.confirm` step before calling `deleteCommitteeMember`. After confirming, the row disappears and a toast confirms *"Committee member removed"*. |

## Verification

Each fix is covered by:
- A backend integration test in
  `backend/tests/integration/committee_scope.test.js` (16 admin CRUD
  tests + 5 deactivate-mid-vote tests = 21 tests total).
- A Playwright E2E assertion in
  `Testing/15_Committee_Account_Module/committee_admin_test.js`
  (9 sections covering list → form validation → API dup check → create
  → toggle → deactivate-mid-vote → cross-mosque → delete → login-block).
- A manual scenario in
  `Testing/15_Committee_Account_Module/manual_testing_guide.md`
  (scenarios A–M).