# 03 Navbar / Masjid Selection — Manual Testing Guide

## For: My Partner (Non-Technical)

This guide walks you through the public Navbar layout, the mosque selector dropdown, and a 5-role sanity check of the Logout button. The nav was rewritten in Phase 3 to fix a layout bug at common desktop widths and to make the mosque dropdown "live" (data updates immediately when you switch mosques, no page refresh needed).

---

## How To Start Testing

**Step 1:** Re-seed the database (this now creates 2 mosques + 5 primary users + 4 real-email users):
```
cd backend
node utils/seed.js
```
(Wait for "Database seeded successfully".)

**Step 2:** Start the backend:
```
cd backend
npm run dev
```

**Step 3:** Start the frontend (new terminal):
```
cd frontend
npm run dev
```

**Step 4:** Open your browser to `http://localhost:5173`

**Step 5:** Resize the browser to a few widths during testing:
- Desktop ≥1024px (laptop / desktop monitor)
- Tablet 768-1023px
- Phone <768px

---

## Test Accounts (use these exact details)

**Primary accounts** (for module features):
| Role | Email | Password |
|------|-------|----------|
| Community User | `user@emasjid.pk` | `user1234` |
| Religious Scholar | `scholar@emasjid.pk` | `scholar123` |
| Admin | `admin@emasjid.pk` | `admin123` |
| Manager | `manager@emasjid.pk` | `manager123` |
| Committee | `committee@emasjid.pk` | `committee123` |

**Real-email accounts** (for Phase 12 of the Forgot Password module — emails land in your real Gmail):
| Role | Email | Password | Mosque |
|------|-------|----------|--------|
| Admin | `dawood.bhatti8812@gmail.com` | `admin123` | Masjid Al-Noor |
| Manager | `pa672189@gmail.com` | `manager123` | Masjid Al-Rahman |
| Scholar | `dawoodah85@gmail.com` | `scholar123` | Masjid Al-Noor |
| Committee | `wb494929@gmail.com` | `committee123` | Masjid Al-Noor |

**Test-only extra accounts** (added in Phase 3 for the 2nd mosque):
| Role | Email | Password | Mosque |
|------|-------|----------|--------|
| Manager 2 | `manager2@emasjid.pk` | `manager123` | Masjid Al-Rahman |
| Admin 2 | `admin2@emasjid.pk` | `admin123` | Masjid Al-Rahman |

---

## Test 1: Navbar layout on desktop (1280-1440px)

### What You're Testing
All nav items fit on a single line; nothing is clipped, nothing wraps, the mosque name and city are both visible.

### Steps to Follow
1. Open `http://localhost:5173` (logged out is fine for this test)
2. Resize the browser window to about 1280px wide
3. Look at the navbar

### What Should Happen
- Logo on the left (mosque icon + "E-Masjid" + city below it)
- Center: 4 main links (Home, Prayer Times, Events, Donate) + 2 dropdowns (Services, More) — all on one line, none wrapping
- Right: "Mosque" label + dropdown + Login/Register buttons
- Nothing is clipped or wrapped

### Mark Result
☐ PASS  ☐ FAIL — Notes: _______failed________

---

## Test 2: Navbar layout on tablet (768-1023px)

### What You're Testing
At tablet widths, the nav still works — either the desktop nav shrinks or the hamburger menu appears.

### Steps to Follow
1. Resize the browser to about 900px wide
2. Look at the navbar

### What Should Happen
- The hamburger menu icon (☰) appears on the right
- The 4 main links + dropdowns are hidden (they're in the mobile menu now)
- The logo, mosque selector, and hamburger are visible

### Mark Result
☐ PASS  ☐ FAIL — Notes: _______failed________

---

## Test 3: Navbar on mobile (<768px) — hamburger menu

### What You're Testing
On mobile, the hamburger menu opens and shows all the nav links.

### Steps to Follow
1. Resize the browser to about 400px wide (or use DevTools mobile mode)
2. Click the hamburger icon (☰) in the navbar
3. The mobile menu should slide in

### What Should Happen
- A vertical list of all nav links appears: Home, Prayer Times, Events, Donate, Services (Nikah Booking, My Bookings, Transparency), More (Announcements, Fund Request, My Requests)
- A "Select Mosque" dropdown is at the top
- Login / Register / Logout buttons are at the bottom
- Clicking any link closes the menu and navigates

### Mark Result
☐ PASS  ☐ FAIL — Notes: _______________

---

## Test 4: Mosque dropdown shows both mosques

### What You're Testing
After re-seeding, the dropdown should show 2 options (Masjid Al-Noor, Masjid Al-Rahman).

### Steps to Follow
1. Open `http://localhost:5173` (logged out is fine)
2. Click the "Mosque" dropdown in the navbar
3. Read the options

### What Should Happen
- "Mosjid Al-Noor (Sheikhupura)"
- "Masjid Al-Rahman (Lahore)"
- Currently selected one is highlighted

### Mark Result
☐ PASS  ☐ FAIL — Notes: _______________

---

## Test 5: Switching mosque updates the homepage (no refresh)

### What You're Testing
When you change the mosque dropdown while on the homepage, the displayed prayer times / events / announcements update instantly.

### Steps to Follow
1. On the homepage, note the current mosque name in the logo (top-left)
2. Note the prayer times, events, and announcements currently displayed
3. Change the dropdown from "Masjid Al-Noor" to "Masjid Al-Rahman"
4. **Do not refresh the page**

### What Should Happen
- Logo updates to show "Masjid Al-Rahman" + "Lahore" within ~1 second
- If you have data for both mosques seeded, the events/announcements/prayer times should refresh
- No page reload, no flash of white screen

### Mark Result
☐ PASS  ☐ FAIL — Notes: _______________

---

## Test 6: Switching mosque updates the Prayer Times page

### What You're Testing
Same as Test 5 but on the `/prayer-times` page.

### Steps to Follow
1. Go to `http://localhost:5173/prayer-times`
2. Note the current prayer schedule
3. Change the dropdown to the other mosque
4. The schedule should refresh (if the seed has different data for the other mosque, you'll see the difference)

### What Should Happen
- The schedule updates without a page refresh
- If both mosques have the same default times, the page just stays the same — that's OK, the important thing is no error

### Mark Result
☐ PASS  ☐ FAIL — Notes: _______________

---

## Test 7: Switching mosque updates the Events page

### What You're Testing
Same as Test 5 but on the `/events` page.

### Steps to Follow
1. Go to `http://localhost:5173/events`
2. Note the events shown
3. Change the dropdown to the other mosque
4. Events list should refresh

### What Should Happen
- Events list updates without a page refresh
- If you have different events for each mosque, you'll see the switch
- If no events for the new mosque, the empty state ("No events yet") appears

### Mark Result
☐ PASS  ☐ FAIL — Notes: _______________

---

## Test 8: Switching mosque updates the Announcements page

### What You're Testing
Same as Test 5 but on the `/announcements` page.

### Steps to Follow
1. Go to `http://localhost:5173/announcements`
2. Note the announcements shown
3. Change the dropdown to the other mosque
4. Announcements list should refresh

### What Should Happen
- Announcements list updates without a page refresh

### Mark Result
☐ PASS  ☐ FAIL — Notes: _______________

---

## Test 9: Switching mosque updates the Transparency page

### What You're Testing
Same as Test 5 but on the `/transparency` page.

### Steps to Follow
1. Go to `http://localhost:5173/transparency`
2. Note the donations and expenses
3. Change the dropdown to the other mosque
4. Numbers should refresh

### What Should Happen
- Totals and lists update without a page refresh
- The "Top Donors" section updates to the new mosque's donors

### Mark Result
☐ PASS  ☐ FAIL — Notes: _______________

---

## Test 10: Mobile menu mosque dropdown also works

### What You're Testing
On mobile, the mosque dropdown inside the hamburger menu also updates the data.

### Steps to Follow
1. Resize browser to <768px
2. Open the hamburger menu
3. Use the "Select Mosque" dropdown inside the menu to switch mosques
4. The menu should close and the page should refresh with the new mosque's data

### What Should Happen
- Dropdown works
- Menu closes
- The page (e.g. homepage behind the menu) shows the new mosque's data

### Mark Result
☐ PASS  ☐ FAIL — Notes: _______________

---

## Test 11: Navbar Logout — 5-role sanity check (Q5)

### What You're Testing
The public navbar's Logout button works for all 5 roles (no regression from the layout fix in Phase 1).

### Steps to Follow
For each role, log in, then click the "Logout" button in the public navbar.

| # | Role | Email | Password | Login at |
|---|------|-------|----------|----------|
| 1 | User | `user@emasjid.pk` | `user1234` | `/login` |
| 2 | Scholar | `scholar@emasjid.pk` | `scholar123` | `/login` (select Scholar) |
| 3 | Admin | `admin@emasjid.pk` | `admin123` | `/admin/login` |
| 4 | Manager | `manager@emasjid.pk` | `manager123` | `/manager/login` |
| 5 | Committee | `committee@emasjid.pk` | `committee123` | `/committee/login` |

For each role, after clicking Logout:
- The button disappears
- A "Login" / "Register" button appears
- The page navigates to the role's specific login page (NOT the homepage)

### Mark Result (one row per role)
- [ ] User → redirects to `/login`, Logout button gone
- [ ] Scholar → redirects to `/login`, Logout button gone
- [ ] Admin → redirects to `/admin/login`, Logout button gone
- [ ] Manager → redirects to `/manager/login`, Logout button gone
- [ ] Committee → redirects to `/committee/login`, Logout button gone

---

## Test 12: Navbar persistence — refresh keeps the selected mosque

### What You're Testing
After selecting a mosque and refreshing the page, the same mosque should still be selected.

### Steps to Follow
1. On the homepage, change dropdown to "Masjid Al-Rahman"
2. Note the logo now shows "Masjid Al-Rahman" + "Lahore"
3. **Refresh the browser (F5)**
4. After the page reloads...

### What Should Happen
- The dropdown still shows "Masjid Al-Rahman (Lahore)" as the selected option
- The logo still shows "Masjid Al-Rahman" + "Lahore"
- The data shown is for Masjid Al-Rahman
- The selection is persisted via `localStorage`

### Mark Result
☐ PASS  ☐ FAIL — Notes: _______________

---

## Final Checklist
☐ All 12 tests passed
☐ No layout issues at desktop / tablet / mobile
☐ Both mosques appear in the dropdown
☐ Switching mosque updates the homepage, prayer times, events, announcements, and transparency without page refresh
☐ Mobile menu also has a working mosque dropdown
☐ Logout works for all 5 roles
☐ Selected mosque persists across page refreshes

## What To Send Back
1. List of tests that PASSED
2. List of tests that FAILED with exact error text / screenshot
3. Any layout issues you noticed (please include the browser width when reporting)
