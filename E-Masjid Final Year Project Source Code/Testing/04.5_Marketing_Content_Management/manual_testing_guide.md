# 04.5 Marketing Content Management — Manual Testing Guide

## For: My Partner (Non-Technical)

This guide walks you through the new admin panel for managing homepage marketing content. After running `node utils/seed.js`, you'll have 1 campaign, 3 testimonials, and 6 hero slides pre-loaded. The guide has you create more, edit them, delete them, and watch the public homepage reflect the changes in real time.

---

## How To Start Testing

**Step 1:** Re-seed the database (now seeds 1 campaign + 3 testimonials + 6 hero slides):
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

**Step 4:** Open the admin panel: `http://localhost:5173/admin/login`
- Email: `admin@emasjid.pk`
- Password: `admin123`

**Step 5:** In the admin sidebar, click **"Marketing Content"** (it's between "Fund Requests" and the bottom of the list).

---

## Test 1: Campaigns tab — view the pre-seeded campaign

### What You're Testing
The pre-seeded "Help Us Build a New Minaret" campaign should appear with all its details (target, raised, percentage, donors, days left, FEATURED badge).

### Steps to Follow
1. Click the "Campaigns" tab
2. Look at the list

### What Should Happen
- 1 campaign card visible: "Help Us Build a New Minaret"
- Has a gold "FEATURED" badge
- Shows: Target PKR 800,000 · Raised PKR 320,000 (40%) · 23d left
- Shows: 142 donors · 23 days left (from the smaller stats line)
- 2 buttons: "Edit" and "Delete" (Delete should be styled red)

### Mark Result
☐ PASS  ☐ FAIL — Notes: _______________

---

## Test 2: Campaigns tab — create a new campaign

### What You're Testing
Clicking "New Campaign" opens a modal where you fill in the form and save.

### Steps to Follow
1. Click the **"+ New Campaign"** button (top right)
2. A modal appears with empty fields
3. Fill in:
   - Title: `Build a new madrassa classroom`
   - Subtitle: `Our children deserve a better learning space. Help us raise funds to expand.`
   - Target Amount: `1500000`
   - Raised Amount: `250000`
   - Donor Count: `45`
   - Days Left: `60`
   - Leave Image URL empty
   - Check **"Active"** ✓
   - Check **"Featured"** ✓ (this will unfeature the existing campaign automatically)
4. Click **"Create Campaign"**

### What Should Happen
- Modal closes
- Success toast: "Campaign created"
- New campaign appears at the TOP of the list
- Has the FEATURED badge
- The OLD campaign (Help Us Build a New Minaret) no longer has the FEATURED badge (auto-unfeature)
- Progress shows 250,000 / 1,500,000 = 17%

### Mark Result
☐ PASS  ☐ FAIL — Notes: _______________

---

## Test 3: Campaigns tab — edit an existing campaign

### Steps to Follow
1. Click the "Edit" button on any campaign
2. Modal opens with the existing values pre-filled
3. Change the "Raised Amount" from `250000` to `500000`
4. Click "Save Changes"

### What Should Happen
- Modal closes
- Success toast: "Campaign updated"
- The campaign shows the new raised amount
- Progress recalculates: 500,000 / 1,500,000 = 33%

### Mark Result
☐ PASS  ☐ FAIL — Notes: _______________

---

## Test 4: Campaigns tab — delete a campaign (with confirmation)

### Steps to Follow
1. Click the "Delete" button (red) on any non-featured campaign
2. A confirmation modal appears: "Are you sure you want to delete [name]? This cannot be undone."
3. Click "Cancel" — nothing happens
4. Click "Delete" again
5. Click "Delete" in the confirmation modal

### What Should Happen
- Cancel: modal closes, no change
- Delete: campaign is removed from the list, success toast "Campaign deleted"

### Mark Result
☐ PASS  ☐ FAIL — Notes: _______________

---

## Test 5: Public homepage reflects admin changes in real time

### What You're Testing
After creating a new campaign, refresh the public homepage and verify the Featured Campaign section shows your new content.

### Steps to Follow
1. Create a new campaign (Test 2) with title "TEST CAMPAIGN - PLEASE IGNORE"
2. Open a new browser tab to `http://localhost:5173` (public homepage, no login)
3. Scroll down to the "Featured Campaign" section (it's the dark green section)
4. Check what's shown

### What Should Happen
- The Featured Campaign section should show "TEST CAMPAIGN - PLEASE IGNORE" as the title
- The progress bar should reflect your target/raised values
- The "Donate Now" and "See Full Transparency Report" buttons work

### Mark Result
☐ PASS  ☐ FAIL — Notes: _______________

---

## Test 6: Testimonials tab — add + edit + verify on homepage

### Steps to Follow
1. Click the "Testimonials" tab (top of the page)
2. You should see 3 pre-seeded testimonials (Ayesha, Haji Aslam, Fatima & Zainab)
3. Click **"+ New Testimonial"**
4. Fill in:
   - Name: `Bilal Ahmed`
   - Role: `New Community Member`
   - Quote: `The new online system made it so easy to register for Nikah. Thank you to the team!`
   - Photo URL: leave default
   - Display Order: `3`
   - Check "Active" ✓
5. Click "Create Testimonial"
6. Open the public homepage in a new tab
7. Scroll to the "What Our Community Says" section

### What Should Happen
- New testimonial card with Bilal's photo + name + role + quote appears as the 4th card
- (The page shows 3 cards at a time on desktop — the order will be based on `order` field)

### Mark Result
☐ PASS  ☐ FAIL — Notes: _______________

---

## Test 7: Hero Slides tab — reorder slides

### Steps to Follow
1. Click the "Hero Slides" tab
2. You should see 6 cards: Fajr, Quran, Madrassa, Iftar, Nikah, Courtyard
3. Click the "Edit" button on the 3rd slide (Madrassa)
4. Change "Display Order" from `2` to `0` (slide jumps to the front)
5. Click "Save Changes"
6. Open the public homepage
7. Watch the carousel — the order should have changed (Madrassa now first)

### What Should Happen
- Madrassa slide now shows first in the carousel
- (You may need to wait ~5 seconds for the auto-rotation to cycle through)

### Mark Result
☐ PASS  ☐ FAIL — Notes: _______________

---

## Test 8: Stats section shows real (not hardcoded) numbers

### What You're Testing
The 4 stats cards on the public homepage should be auto-computed from your actual database, not made-up numbers.

### Steps to Follow
1. Open the public homepage (no login needed)
2. Look at the 4 stat cards below the hero
3. Note the numbers
4. Go to the admin panel, look at the Donations page — count how many donations exist
5. Open the Fund Requests page — count approved ones
6. Compare: the "Total Donations" stat should roughly match the sum of donations
7. The "Families Helped" stat should roughly match approved fund requests

### What Should Happen
- The numbers should be REAL (not hardcoded like "2,500" or "PKR 1,250K")
- If you have 0 donations, the "Total Donations" will be PKR 0 (not fake PKR 1,250K)
- If you add 5 donations of PKR 10,000 each, the stat will show PKR 50,000

### Mark Result
☐ PASS  ☐ FAIL — Notes: _______________

---

## Final Checklist
☐ Test 1-8 all passed
☐ Admin can create campaigns, testimonials, hero slides
☐ Admin can edit/delete them
☐ Public homepage reflects admin changes in real time
☐ Stats show REAL numbers from the database (not hardcoded)
☐ Featured campaign changes work
☐ Testimonials appear on homepage
☐ Hero carousel respects slide order

## What To Send Back
1. List of tests that PASSED
2. List of tests that FAILED (with screenshot or error message)
3. Any other issues you noticed
