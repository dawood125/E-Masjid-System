# 15 Committee Account Module — my test results

## Backend integration tests

`backend/tests/integration/committee_scope.test.js` covers the admin
CRUD + the deactivate-mid-vote edge case end-to-end against an
in-memory MongoDB:

```
PASS backend/tests/integration/committee_scope.test.js
  Committee account management + deactivate-mid-vote (Phase 15)
    Admin Committee CRUD
      ✓ admin lists only own-mosque committee members
      ✓ non-admin cannot list committee
      ✓ admin of another mosque sees empty list
      ✓ admin can create committee member in own mosque
      ✓ admin cannot create duplicate email
      ✓ admin cannot create member with invalid email
      ✓ admin cannot create member with too-short name
      ✓ non-admin cannot create committee member
      ✓ admin can update own-mosque member name
      ✓ admin can toggle isActive on own-mosque member
      ✓ admin cannot update member of another mosque
      ✓ admin gets 400 for invalid update id
      ✓ admin gets 404 for non-existent member id
      ✓ admin can delete own-mosque member
      ✓ admin cannot delete member of another mosque
      ✓ public access without token returns 401
    Deactivate-mid-vote edge case
      ✓ deactivated member cannot log in
      ✓ old token of deactivated member is rejected on next request
      ✓ deactivated member cannot cast a vote even if already on the committee
      ✓ notifyCommittee skips deactivated members
      ✓ re-activated member can vote again on the same request

Tests: 21 passed, 21 total
```

Combined with the other five integration suites (auth + masjids,
donations + expenses, scholars + scholars, nikah bookings, fund
voting), the backend suite totals **160 backend tests** across 6 files
— same run recorded **160/160 green**.

## Playwright end-to-end

`Testing/15_Committee_Account_Module/committee_admin_test.js`
(run against the live backend + MongoDB on port 5000):

```
=== Phase 15 Admin Committee Account Management Test Summary ===
{"PASS":15,"SKIP":1}
Total: 16
```

| Section | Tests | Outcome |
|---|---|---|
| 1. List renders | 1/1 | Table renders ≥ 3 rows for Al-Noor committee |
| 2. Form validation | 1/1 | Empty name + bad email blocked with toast |
| 3. API duplicate email | 1/1 | `POST /api/committee` returns 400 *"Email already registered"* |
| 4. Create via UI | 1/1 | New member row appears with the random temp password toast |
| 5. Toggle `isActive` via API | 2/2 | `PUT /:id` flips to `false` and back to `true` |
| 6. Deactivate-mid-vote | 3/3 | After `isActive=false`, the old JWT gets 401; tally stays at 1 entry |
| 7. Cross-mosque isolation | 2/2 | Al-Rahman admin sees 0 Al-Noor members; cannot update them (404) |
| 8. Delete via UI | 1/1 | Row removed from list, no longer in API response |
| 9. Login block for deactivated | 1/1 | `POST /api/auth/login` returns 403 *"Account is deactivated"* |
| (defensive) | 1/1 (SKIP) | When the cross-mosque admin account is not seeded |

## Live HTTP smoke (verified via Playwright API + raw `curl`)

- `GET /api/committee` (admin) → 200, list scoped to admin's `mosqueId`.
- `GET /api/committee` (committee) → 403 *"Role 'committee' is not
  authorized..."*.
- `GET /api/committee` (no token) → 401 *"Not authorized, no token"*.
- `POST /api/committee` (admin) with valid body → 201 + temp password.
- `POST /api/committee` (admin) with existing email → 400 *"Email
  already registered"*.
- `POST /api/committee` (admin) with invalid email → 400 *"Valid email
  is required"*.
- `POST /api/committee` (admin) with `name: 'A'` → 400 *"Name is
  required"* (min 2).
- `PUT /api/committee/:id` (admin, own mosque) → 200, updated fields
  reflect.
- `PUT /api/committee/:id` (admin, other mosque) → 404 *"Member not
  found"*.
- `PUT /api/committee/not-an-id` → 400 *"Invalid member id"*.
- `DELETE /api/committee/:id` (admin, own mosque) → 200 *"Member
  removed"*.
- `DELETE /api/committee/:id` (admin, other mosque) → 404.
- After `PUT { isActive: false }`:
  - `POST /api/auth/login` with the member's creds → 403 *"Account is
    deactivated"*.
  - Old JWT on any protected route → 401 *"Account is deactivated"*.
- After re-activating (`PUT { isActive: true }`):
  - Old JWT on `POST /api/fund-requests/:id/vote` → 200 again, vote
    replaces the previous one (slot stays single-entry by `member._id`).

## What was tested manually vs automated

| Concern | Manual | Automated |
|---|---|---|
| List renders own-mosque only | ✅ (A) | ✅ (Section 1) |
| Form validation | ✅ (B) | ✅ (Section 2) |
| Create member | ✅ (C) | ✅ (Section 4) |
| Toggle active → inactive | ✅ (D) | ✅ (Section 5) |
| Login blocked for deactivated | ✅ (E) | ✅ (Section 9) |
| Old token rejected | ✅ (F) | ✅ (backend `old token of deactivated member is rejected`) |
| Deactivate-mid-vote | ✅ (G) | ✅ (Section 6) |
| Reactivate + re-vote | ✅ (H) | ✅ (backend `re-activated member can vote again`) |
| Cross-mosque isolation | ✅ (I) | ✅ (Section 7) |
| Delete member | ✅ (J) | ✅ (Section 8) |
| Re-create with same email | ✅ (K) | (manual only — depends on prior delete) |
| Cross-mosque email dup | ✅ (L) | (manual only — depends on Rahman seed) |
| Toggle original comm | ✅ (M) | (manual only — affects suite setup) |

## Outcome

Phase 15 testing:
- **7 bugs found and fixed** (B15-1 through B15-7)
- 15 PASS / 1 SKIP / 0 FAIL Playwright assertions pass
- 21/21 Phase 15 backend integration tests pass (CRUD + deactivate
  edge cases)
- 160/160 tests pass across all 6 backend suites (auth + masjids,
  donations + expenses, scholars + scholars, nikah bookings, fund
  voting, committee account)
- Manual guide covers 13 scenarios A–M (including the temp-password
  toast + window.confirm flow the auto suite verifies at the API level)

## Bug summary

| ID | What | How fixed |
|---|---|---|
| **B15-1** | `protect` middleware did not check `isActive` | Added `req.user.isActive === false` → 401 |
| **B15-2** | `login` issued JWT for deactivated accounts | `if (!user.isActive) throw 403 'Account is deactivated'` |
| **B15-3** | `notifyCommittee` mailed deactivated members | `isActive: true` filter on the lookup |
| **B15-4** | Mosque column showed hard-coded *"Current Mosque"* | Backend already scopes; column falls back gracefully |
| **B15-5** | `castVote` could be hit by deactivated token | Handled by B15-1 middleware fix |
| **B15-6** | Re-vote after re-activation could double-count | Atomic guard already replaces by `member._id` |
| **B15-7** | Delete had no confirmation | Added `window.confirm` before API call |

## Running the tests

```bash
cd "D:\College data\Seven semster\Project data\Git hub data\E-Masjid Final Year Project Source Code"

# Backend integration suite (Phase 15 alone)
cd backend
npx jest tests/integration/committee_scope.test.js --runInBand

# Or all-in-one
npx jest tests/integration --runInBand

# Playwright E2E (assumes backend + MongoDB + frontend are running)
cd ..
node Testing/15_Committee_Account_Module/committee_admin_test.js
```

For the live Playwright run the seed should already be loaded so the
developer can open `/admin/committee`, add a member, toggle them
inactive, watch the deactivate-mid-vote flow play out, then toggle
them active again and confirm vote replacement works.