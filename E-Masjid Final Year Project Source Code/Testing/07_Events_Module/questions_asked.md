# Phase 7 — Questions Asked During Testing

## Q1 — Should we add a custom-address option to the event create modal?

**Loading event location dropdown.** Idea: dropdown of usual mosque
locations (Main Prayer Hall, Community Center, Mosque Courtyard,
Classroom) plus an "Other (specify)" that reveals a text input for
events held outside the mosque (e.g., a park for community Iftar).

**A:** Added. The custom text field overlays the dropdown when "Other"
is picked, and the resolved value is what gets sent to the API as
`location`. No new model field, no migration — the `location` string
already accepts arbitrary text.

**Q2 — Should the super admin dashboard have edit/delete on masjids?**

**A:** Added **Edit** (we need to fix typos in masjid names and
addresses). Skipped **Delete** — instead the API path is to flip
`isActive` to false, which is what the model already supports. Soft
delete is safer for an FYP (no orphan committee/donation/announcement
records pointing at a deleted masjid).

**Q3 — Is the per-masjid module assignment feature even working?**

**A:** Working but not worth shipping. It was a toggle grid that only
controlled a permission flag — nothing in the rest of the codebase
actually checked it. Removing it shaves a manager endpoint, a model
field, dashboard cards, mock list entries, and one whole "Configure
Modules" panel. Net code reduction > net feature value.

**Q4 — Can we do the DevTools `fetch()` tests in Postman instead?**

**A:** Yes. Shipped `postman_collection.json` in this folder. 15
requests, all bearer-token, auto-saves tokens to collection variables.
Run the four setup requests in order, then any scope test in any
order. The Tests tab encodes the expected status code, so a failed
run is obvious in the runner.

## Recurring question from earlier phases (re-confirmed)

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