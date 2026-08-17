# Phase 7 — Questions Asked During Testing

None this phase. The scope fix followed the same pattern as Phase 6
(BUG-ANN-012) and the BUG-EVENT-002 destructuring mistake was a 5-second
fix once the 500 stack trace showed the line.

## Recurring question from earlier phases (re-confirmed)

**Q:** Should managers be able to act on a masjid they don't manage
(e.g., a customer-service override)?

**A:** No. The super admin's authority is over the masjids in their
`managerId` list only. If a masjid is managed by a different manager,
they're fully invisible to this one. That's the standard multi-tenant
SaaS pattern (WordPress Multisite, Shopify Plus, Microsoft 365 GCC).

## Surfaced during Phase 6 (still applies)

**Q:** What happens if a manager account loses all their managed masjids
(e.g., they churn and we reassign the masjids)?

**A:** `GET /api/events/admin` returns 400 ("You do not manage any
mosques."). They can't post or edit either. They can still log in and
see their own user record. This is correct — a manager with no
managed masjids is effectively an admin-in-waiting.