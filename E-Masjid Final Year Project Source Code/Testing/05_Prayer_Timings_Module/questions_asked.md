# 05 Prayer Timings Module - Questions Asked

> Phase 5 - Step A | Date: 2026-08-10 | Module: Prayer Timings (public + admin)

---

## Module Inventory (what we are testing)

**Backend:**
- `backend/routes/prayerTimes.js` — 2 endpoints: `GET /api/prayer-times` (public), `PUT /api/prayer-times` (admin only, upsert by date+mosqueId)
- `backend/models/PrayerTime.js` — fields: date, fajr, zuhr, asr, maghrib, isha, jummah, eidUlFitr, eidUlAdha, mosqueId; unique compound index `(date, mosqueId)`

**Frontend public page** — `frontend/src/components/User/Pages/PrayerTimes.jsx`:
1. Hero with Islamic + Gregorian date
2. Next-Prayer countdown card (HH:MM:SS live timer)
3. Today's 6-card row: Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha (Sunrise hardcoded to 06:45)
4. Special Prayer Timings (Eid) section — only shows if eidUlFitr or eidUlAdha set
5. Weekly Jama'ah table — 7-day strip, "Today" row highlight, Sunrise column hardcoded to 06:45
6. Hadith quote footer

**Frontend admin page** — `frontend/src/components/Admin/Pages/PrayerTimes.jsx`:
1. Live-on-website status pill + current times read-only cards (5 daily + Jummah)
2. Update form: 5 daily prayer time inputs, Jumu'ah input, Eid toggle + 2 Eid time inputs
3. Reset / Update buttons + "View Public Page" link
4. Last-updated timestamp

**Homepage widget** — `frontend/src/components/User/Pages/Home.jsx` (already passed Phase 4 test) uses the same `GET /api/prayer-times?mosqueId=...` endpoint with a 5-card today layout (no Sunrise card, no weekly table). The widget reacts to mosque switching.

---

## Q1 - Sunrise time is hardcoded as "06:45" in 3 places

The public page and the weekly table both display a Sunrise column with the time **hardcoded as `'06:45'`** (in `PrayerTimes.jsx:191` for the today card and `PrayerTimes.jsx:297` for the weekly table). It does NOT vary by mosque, date, or actual sunset calculation.

For the FYP demo, do you want to:
- **(A) Keep it hardcoded** as 06:45 for both seeded mosques (fastest, but technically inaccurate for Lahore vs Sheikhupura)
- **(B) Add a `sunrise` field to the PrayerTime model** + admin input so the admin sets it (proper, takes ~30 min)
- **(C) Compute sunrise** from Maghrib - a fixed offset (e.g., Maghrib minus 12 hours) — fake but consistent

---

## Q2 - "Today" highlight in the weekly table never shows (BUG candidate)

In the weekly table row map, the "Today" badge logic is:
```js
const today = day.date === new Date().toISOString().slice(0, 10)
```
But `day.date` is a full ISO datetime string from Mongoose (e.g., `"2026-08-10T19:00:00.000Z"`) and `new Date().toISOString().slice(0,10)` returns `"2026-08-10"` — **string equality will always be `false`**, so the green "Today" badge never appears on any row of the weekly table.

Should I:
- **(A) Fix it** to compare date parts only (e.g., `new Date(day.date).toDateString() === new Date().toDateString()`)
- **(B) Leave it as-is** (you don't mind the missing badge) — but this is clearly a regression from the seed data update
- **(C) Decide later** if you want me to fix the broader week display

---

## Q3 - Admin PUT request uses UTC date slice — late-night edge case in PKT

The admin update handler computes the date as:
```js
const today = new Date().toISOString().slice(0, 10)
```
At `23:30 PKT` (UTC+5), `new Date().toISOString()` returns a date that's `5 hours ahead` (next day in UTC), so the admin is upserting tomorrow's prayer times when it's still tonight. Same risk on the backend route (`targetDate = new Date(date)`).

Should I:
- **(A) Use local-date slice** `new Date().toLocaleDateString('sv-SE')` to always get the PKT date — fix in 1 line in 2 places
- **(B) Leave it** (you won't demo at 11:30 PM)
- **(C) Defer** — log as minor bug, fix later

---

## Q4 - Next Prayer countdown excludes Jumu'ah (only shows the 5 daily prayers)

The countdown logic in `PrayerTimes.jsx:27-63` walks the 5 daily prayers (fajr, zuhr, asr, maghrib, isha) and shows the next one based on the system clock. On Fridays, **Jumu'ah replaces Zuhr**, but the countdown still shows "Dhuhr" as the next prayer if it's before 12:45, even on Friday.

Should I:
- **(A) Add Jumu'ah to the countdown** — if today is Friday AND current time < jummah time, show "Jumu'ah" instead of "Dhuhr" (logical for the FYP)
- **(B) Leave as-is** (simpler, only 5 daily prayers is "pure")
- **(C) Defer** to v2

---

## Q5 - Multi-mosque admin scope

The PUT endpoint uses `req.user.mosqueId` to scope the upsert. So an Admin of Masjid Al-Rahman only updates Al-Rahman's times, and an Admin of Al-Noor only updates Al-Noor's — **good multi-tenancy**.

The admin page fetches times for `getActiveMosqueId()` from localStorage. If the admin of Al-Rahman has the navbar selector set to Al-Noor (via the modal), they would fetch Al-Noor's times into the form, then submit them back to Al-Rahman (because PUT uses `req.user.mosqueId`).

Should I:
- **(A) Add a mosque-locked warning banner** at the top of the admin page if `getActiveMosqueId() !== req.user.mosqueId`
- **(B) Force the admin page to use the admin's own mosque** always (ignore localStorage for admins)
- **(C) Defer** (acceptable edge case)

---

## Q6 - Cross-mosque public page test (mosque switch reactivity)

Phase 4 already verified the homepage prayer widget reacts to mosque switching. But the **`/prayer-times` page** also has the mosque selector in the navbar — should I verify that this page also reactively updates when the user switches mosques in the navbar (without page reload)?

**(A) Yes — add this to the automated test** (recommended, 5-min addition)
**(B) No — Phase 4 covered it**

---

Waiting for your answers (Q1-Q6) before I proceed to Step B (automated testing).