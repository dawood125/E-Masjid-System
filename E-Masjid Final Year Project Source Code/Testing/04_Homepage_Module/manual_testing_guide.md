# 04 Homepage Module - Manual Testing Guide

## For: My Partner (Non-Technical)

This guide walks you through the **public homepage** at `http://localhost:5173`. The page has 11 sections, from the hero at the top to the "Support Your Masjid" footer. The page is the first thing every visitor (including the FYP examiner) will see, so we want to make sure every section looks good and works.

The automated test already passed **57 out of 57 checks**. This manual guide confirms everything looks right with your own eyes.

---

## How To Start Testing

**Step 1:** Re-seed the database (creates 2 mosques + all marketing data + events + announcements for both mosques):
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
- Desktop ≥1024px
- Tablet 768-1023px
- Phone <768px

---

## Test 1: Hero section at the top

### What You're Testing
The very first section of the page — a full-bleed image with a big heading, the mosque name, and two buttons.

### Steps to Follow
1. Open `http://localhost:5173`
2. Look at the top of the page

### What Should Happen
- A big background image of a mosque (or a green gradient if the image is slow to load)
- Heading text: **"Connect. Pray. Give back."**
- A subtitle line: **"Welcome to Masjid Al-Noor · Sheikhupura"** (or whichever mosque is active)
- Two buttons: **"Donate Now"** and **"Submit Fund Request"**
- Buttons are clickable — Donate Now goes to `/donate`, Submit Fund Request goes to `/fund-request`

### Mark Result
☐ PASS  ☐ FAIL — Notes: _______

---

## Test 2: Stats strip (4 cards under the hero)

### What You're Testing
A row of 4 white stat cards that show the platform's auto-computed live numbers.

### Steps to Follow
1. Scroll down just past the hero
2. Look at the 4 cards in a row

### What Should Happen
- **Years Serving** — a number (e.g., "2+")
- **Total Donations** — a PKR amount (e.g., "PKR 56,500+")
- **Active Fund Requests** — a count (e.g., "2")
- **Families Helped** — a count (e.g., "1")
- All 4 cards fit on one line at desktop, stack 2x2 at mobile

### Mark Result
☐ PASS  ☐ FAIL — Notes: _______

---

## Test 3: Today's Prayer Times widget

### What You're Testing
A section showing today's 5 prayers + Jummah, with one of them highlighted as the "Next Prayer."

### Steps to Follow
1. Scroll to the "Today's Prayer Times" section
2. Read the prayers and their times
3. Look for a green/highlighted "Next Prayer" badge on one of them

### What Should Happen
- 5 prayers: **Fajr, Dhuhr, Asr, Maghrib, Isha** + **Jumu'ah** (Friday special)
- Each has a time (e.g., 05:30, 12:45, 15:45, 18:25, 19:45, 13:00 for Jumu'ah)
- The prayer whose time is next (compared to your system clock) has a green "Next Prayer" badge
- An Islamic date line is shown (e.g., "1 Muharram 1447 AH" or similar)
- Today's Gregorian date is also shown

### Mark Result
☐ PASS  ☐ FAIL — Notes: _______

---

## Test 4: "Our Impact in Numbers" — 4 big animated counters

### What You're Testing
Four large numbers that count up from 0 when you scroll into view.

### Steps to Follow
1. Scroll down to the "Our Impact in Numbers" section
2. Watch the numbers animate from 0 to their final value

### What Should Happen
- 4 big numbers in a row: **Prayers Tracked, Students Taught, Nikah Ceremonies Hosted, Families Supported**
- Each number animates up from 0 over ~1.5 seconds
- All 4 numbers are large and easy to read
- On mobile, they stack 2x2 or in a single column

### Mark Result
☐ PASS  ☐ FAIL — Notes: _______

---

## Test 5: "Moments from Our Community" image carousel

### What You're Testing
A rotating image carousel with 6 photos of life at the masjid.

### Steps to Follow
1. Scroll to the "Moments from Our Community" section
2. Wait ~5 seconds — the carousel should auto-rotate
3. Click the **next arrow (›)** to manually advance
4. Click any **dot** at the bottom to jump to a specific slide
5. Click the **previous arrow (‹)** to go back

### What Should Happen
- A large image fills the carousel
- 6 dots at the bottom — the active one is highlighted
- Caption below the image describes the photo
- Auto-rotates every 5 seconds
- Prev/next arrows work
- Clicking a dot jumps to that slide

### Mark Result
☐ PASS  ☐ FAIL — Notes: _______

---

## Test 6: "Latest Announcements" — 3 cards

### What You're Testing
A section showing the 3 most recent announcements with category tags.

### Steps to Follow
1. Scroll to "Latest Announcements"
2. Read the 3 announcement cards
3. Click **"View All →"** to navigate to the full announcements page

### What Should Happen
- 3 announcement cards, each with a title, short content, and a small tag (e.g., "Urgent" in red)
- "View All →" link in the top-right goes to `/announcements`
- Each card is clickable to read the full announcement

### Mark Result
☐ PASS  ☐ FAIL — Notes: _______

---

## Test 7: "Featured Campaign" — donation progress card

### What You're Testing
A single featured campaign with a progress bar and a "Donate Now" button.

### Steps to Follow
1. Scroll to the "Featured Campaign" section
2. Read the campaign title and description
3. Look at the progress bar
4. Click the **"Donate Now"** button

### What Should Happen
- Title like **"Help Us Build a New Minaret"**
- A short subtitle explaining the cause
- A progress bar showing the percentage raised (e.g., "PKR 320,000 / PKR 800,000" = 40%)
- A "days left" indicator
- A green **"Donate Now"** button that goes to `/donate`

### Mark Result
☐ PASS  ☐ FAIL — Notes: _______

---

## Test 8: "What Our Community Says" — 3 testimonials

### What You're Testing
Three community member testimonial cards with photos and quotes.

### Steps to Follow
1. Scroll to "What Our Community Says"
2. Read the 3 testimonials

### What Should Happen
- 3 testimonial cards, each with a circular photo, name, role, and quote
- Cards are nicely laid out in a row on desktop, stack on mobile
- Testimonials feel personal and authentic

### Mark Result
☐ PASS  ☐ FAIL — Notes: _______

---

## Test 9: "Upcoming Events" + "Hadith of the Day" sidebar

### What You're Testing
A two-column section: events on the left, hadith sidebar on the right.

### Steps to Follow
1. Scroll to "Upcoming Events"
2. Read the 2 upcoming event cards (each has a countdown timer)
3. Look at the green "Hadith of the Day" sidebar on the right
4. Click **"View All →"** to see all events

### What Should Happen
- 2 upcoming event cards, each with title, date, time, location
- A countdown timer (e.g., "in 5 days")
- Green sidebar showing a hadith and its source (Sahih Bukhari)
- Different days may show different hadiths (it rotates)
- "View All" link goes to `/events`

### Mark Result
☐ PASS  ☐ FAIL — Notes: _______

---

## Test 10: "Need Financial Assistance?" CTA banner

### What You're Testing
A yellow/gold banner encouraging people to submit a Zakat/Sadaqah fund request.

### Steps to Follow
1. Scroll to the "Need Financial Assistance?" banner
2. Click the **"Submit Request"** button

### What Should Happen
- Yellow/gold left side with a handshake icon
- Heading: **"Need Financial Assistance?"**
- Subtitle explaining medical/education/housing help
- A gold **"Submit Request"** button on the right
- Clicking it goes to `/fund-request`

### Mark Result
☐ PASS  ☐ FAIL — Notes: _______

---

## Test 11: "Support Your Masjid" final CTA

### What You're Testing
The very last section of the page — a final big call-to-action.

### Steps to Follow
1. Scroll all the way to the bottom of the homepage
2. Read the heading
3. Click **"Donate Now"** and **"View Transparency Report"**

### What Should Happen
- Heading: **"Support Your Masjid"**
- Subtitle about donations
- Two buttons: green **"Donate Now"** → `/donate` and outlined **"View Transparency Report"** → `/transparency`
- A light green gradient background

### Mark Result
☐ PASS  ☐ FAIL — Notes: _______

---

## Test 12: Mosque switch on the homepage (the key reactivity test)

### What You're Testing
When you switch mosques in the navbar, the entire homepage (hero subtitle, prayer times, events, announcements, campaign) updates without a page reload.

### Steps to Follow
1. On the homepage, note the mosque in the hero: **"Welcome to Masjid Al-Noor · Sheikhupura"**
2. In the navbar, click the **Mosque selector** (right side)
3. A modal opens — pick **"Masjid Al-Rahman (Lahore)"**
4. Click **"Confirm Selection"**
5. **Do not refresh the page**

### What Should Happen
- The modal closes
- Within ~1 second, the hero subtitle changes to **"Welcome to Masjid Al-Rahman · Lahore"**
- The prayer times update to Al-Rahman's times (e.g., Fajr 05:15 instead of 05:30)
- The announcements section now shows Al-Rahman's announcements
- The events section now shows Al-Rahman's events
- No white flash, no page reload

### Mark Result
☐ PASS  ☐ FAIL — Notes: _______

---

## Test 13: Responsive check at mobile width (375px)

### What You're Testing
The homepage works on a phone — nothing overflows, nothing is too small to tap.

### Steps to Follow
1. Resize the browser to 375px wide (or use DevTools mobile mode)
2. Scroll through all 11 sections
3. Check: nothing is cut off, all text is readable, all buttons are tappable

### What Should Happen
- Hero stacks: heading smaller, buttons stack vertically
- Stats: 2x2 grid
- Prayer times: 1 column
- Impact counters: 1 column or 2x2
- Carousel: image fills width, arrows still reachable
- Announcements, Testimonials: stack to 1 column
- Events: 1 column
- All sections have padding on the sides (no edge-to-edge text)
- No horizontal scroll bar appears at the bottom

### Mark Result
☐ PASS  ☐ FAIL — Notes: _______

---

## Test 14: Responsive check at tablet width (768px)

### What You're Testing
At tablet width the layout is between mobile and desktop — 2-column where it makes sense.

### Steps to Follow
1. Resize the browser to 768px wide
2. Check the homepage sections

### What Should Happen
- Hero is full-width with 2 buttons still side-by-side
- Stats: 4 cards on one line (just barely fits)
- Events + Hadith: 2-column layout (events on left, hadith on right)
- Other sections: nicely balanced 2-col where applicable

### Mark Result
☐ PASS  ☐ FAIL — Notes: _______

---

## What To Do If You Find a Bug

If anything looks wrong, please:
1. Take a screenshot
2. Note the section name and what's wrong
3. Note the browser width
4. Send it to me — I'll fix it before the demo

---

## Summary Checklist

- [ ] Test 1 — Hero section
- [ ] Test 2 — Stats strip
- [ ] Test 3 — Prayer times widget
- [ ] Test 4 — Impact counters
- [ ] Test 5 — Image carousel
- [ ] Test 6 — Announcements
- [ ] Test 7 — Featured campaign
- [ ] Test 8 — Testimonials
- [ ] Test 9 — Events + Hadith
- [ ] Test 10 — Fund Request CTA
- [ ] Test 11 — Final CTA
- [ ] Test 12 — Mosque switch reactivity
- [ ] Test 13 — Mobile 375px
- [ ] Test 14 — Tablet 768px

**Total: 14 manual tests** (automated test already passed 57/57 internal checks).
