# 12 Nikah Booking Module — questions asked

## Q1. How should community cancellation be persisted?

The `NikahBooking.status` enum is
`pending / accepted / rejected / completed`. There is no
"cancelled" value.

**Options:**
1. Add a new `cancelled` status to the enum.
2. Reuse `rejected` with the rejection reason
   `"Cancelled by applicant"`.

**Decision:** option 2. Zero schema change, the
`MyBookings` UI already shows a red Rejected pill when
`status === 'rejected'` and surfaces `rejectionReason`,
and applicants cannot confuse it for a scholar's
rejection because the reason text is unique to their
action. Confirmed by user.

## Q2. Are the dead View Details / Edit / Download buttons in MyBookings necessary for the FYP demo?

User said: "if these are things are neccarrry for the
project then built it and the things which are not
neccarry then remove them".

**Decision:** All three removed. None are needed for
the core booking flow:
- View Details — card already shows status, dates,
  couple, contact, rejection reason.
- Edit — pending corrections are out of scope; the
  original flow is submit → wait for review.
- Download — no PDF generation in the codebase, and
  adding jsPDF / html2canvas would be scope creep.

## Q3. Should the admin "Pending Nikah Assignments" section become a real feature or stay mock?

User feedback from prior phases: "they should work
perfectly and we have to test them will all types of
testing like a professional QA".

**Decision:** wire it to real data. Add a new
`PUT /api/nikah-bookings/:id/assign` (admin-only)
endpoint that sets `scholarId` on a pending booking.
The dropdown now triggers a real backend call and the
row is removed from the list once the assignment
succeeds. The hardcoded `ASSIGNMENT_MOCKS` constant is
deleted.

## Q4. Why does the admin Dashboard "Pending Nikah" card show stale data?

It imported `mockNikahBookings` from
`frontend/src/mocks/index.js`. That mock had 3 hardcoded
bookings unrelated to the actual database.

**Decision:** replace the import with a real
`api.getNikahBookings()` call. Filter to
`status === 'pending'` on the client. The count is now
scoped to the logged-in admin's masjid (because the
backend `listForCaller` filters by `mosqueId` for the
admin role).

## Q5. The hardcoded greeting "Muhammad Ahmed" on MyBookings — fix it?

**Decision:** yes — read from `useAuth().user.name`.
Same pattern as the Scholar dashboard greeting. If
`user` is somehow unavailable, fall back to "there"
rather than a hardcoded name.

## Q6. Should the MyBookings stats card include a Rejected count?

**Decision:** yes. The status guide below it already
lists Rejected, and now that the community can cancel
their own pending booking, that flips to Rejected and
should be visible. Added a 4th stat card.

## Q7. Why does the booking success modal show a "Booking ID" but the ID is just `Date.now()` fallback?

The community form's `handleSubmit` had a fallback
`const id = res.data?._id || res.data?.id || ${Date.now()}`
— that fallback is a code smell. After Phase 12 the
backend's `createBooking` returns the saved document
with `_id`, so the fallback is unreachable in practice.
Left as-is for defensive coding.

## Q8. Does scholar's `listForCaller` scope correctly exclude other mosques?

Yes. `backend/services/nikahService.js` line 23:
```js
if (user.role === 'scholar') {
  query = {
    mosqueId: user.mosqueId,
    $or: [{ scholarId: user._id }, { status: 'pending' }],
  };
}
```
A scholar at Al-Rahman sees only their own masjid's
bookings (pending ones unassigned plus ones already
assigned to them). Verified via backend integration
test "Al-Rahman admin does NOT see Al-Noor E2E Groom
booking".