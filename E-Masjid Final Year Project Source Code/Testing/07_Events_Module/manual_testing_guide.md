# Phase 7 — Manual Testing Guide

This module added the same auth scoping that Phase 6 introduced for
announcements. The Events module now refuses to leak across masjids
regardless of which token calls it.

## Prerequisites

- Backend running on `http://127.0.0.1:5000`
- Frontend running on `http://127.0.0.1:5174`
- Seeded with `npm run seed` (creates 4 masjids + manager account).

## Credentials

| Role | Email | Password | Scope |
|---|---|---|---|
| Super admin (manager) | `manager@emasjid.pk` | `manager123` | All 4 masjids |
| Admin Al-Noor | `admin@emasjid.pk` | `admin123` | Al-Noor only |
| Admin Al-Rahman | `admin2@emasjid.pk` | `admin123` | Al-Rahman only |
| Admin Al-Falah | `admin3@emasjid.pk` | `admin123` | Al-Falah only |
| Admin Al-Taqwa | `admin4@emasjid.pk` | `admin123` | Al-Taqwa only |
| Community | `user@emasjid.pk` | `user1234` | — |

## Test scenarios

### A. Public Events page

1. Visit `http://127.0.0.1:5174/events`.
2. Confirm the page shows the seeded Al-Noor events (today +7 / +14
   days, plus any you created earlier).
3. Use the navbar masjid selector to switch to **Masjid Al-Rahman**.
4. Confirm the list now shows Al-Rahman events ("Youth Quran
   Competition", "Friday Night Lecture").

### B. Admin CRUD

1. Log in as `admin@emasjid.pk` and go to `http://127.0.0.1:5174/admin/events`.
2. Click **Add New Event**.
3. Fill in title, description, future date, start time, and location.
4. Click **Create Event**.
5. The new row should appear in the table (if you don't see it, switch
   the date filter to "All Time" — that's how admin pages default).
6. Click the edit button on your new row, change the title, click
   **Update Event**.
7. Click the delete button; confirm the browser dialog. The row should
   disappear.

### C. Cross-mosque authorization (the important bit)

Log in as `admin2@emasjid.pk` (Al-Rahman admin) and try in DevTools
console:

```js
const t = JSON.parse(localStorage.user).token  // adjust to your setup
await fetch('http://127.0.0.1:5000/api/events/admin', {
  headers: { Authorization: 'Bearer ' + t }
}).then(r => r.json()).then(j => console.log(j.data.map(e => e.mosqueId)))
```

You should see **only Al-Rahman's mosqueId** in the response.

```js
// Try a cross-mosque write
await fetch('http://127.0.0.1:5000/api/events', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ' + t, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'cross-mosque hack',
    date: '2027-01-01',
    mosqueId: '<Al-Noor id from /api/mosques/public>'
  })
})
```

Expected: `HTTP 403 — Cannot create events for a different mosque`.

### D. Super-admin scope

Log in as `manager@emasjid.pk`. In the admin Events page, switch the
navbar masjid selector between Al-Noor, Al-Rahman, Al-Falah, and
Al-Taqwa — the table should re-filter to that masjid's events.

In DevTools, try an unmanaged masjid id:

```js
await fetch('http://127.0.0.1:5000/api/events/admin?mosqueId=5f4f4f4f4f4f4f4f4f4f4f4f', {
  headers: { Authorization: 'Bearer ' + t }
})
```

Expected: `HTTP 400 — You can only act on mosques you manage.`

### E. Public event registration

1. While logged out, visit `http://127.0.0.1:5174/events`.
2. Click an event, then **Register**.
3. Sign in as `user@emasjid.pk`.
4. Submit the registration form.
5. Try to register for the same event again — you should get a 400
   "Already registered".

## Notes

- Admin pages default the date filter to "This Month". If you create an
  event outside the current month, switch the filter to "All Time" to
  see it.
- The `endTime` and `registrationRequired` fields are stored but not
  surfaced on the public page in Phase 7 — these are for future
  expansion and are already wired through the API.