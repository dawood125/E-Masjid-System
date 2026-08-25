# 04.5 Marketing Content Management — Bugs Found

> Phase 4.5 verification: 2026-06-24 (initial pass)
> Phase 4.5 re-verification: 2026-08-24 (live API + Playwright against running backend + MongoDB)

---

## BUG-PHASE4.5-001 — Stats section used hardcoded values that admins couldn't change

- **Severity:** High (data correctness, FYP presentation)
- **Location:** `frontend/src/components/Marketing/StatsSection.jsx` (pre-Phase 4.5)
- **Root cause:** Stats array was hardcoded inline:
  ```js
  const STATS = [
    { key: 'mosques', value: 2 },
    { key: 'donations', value: 1250 },
    ...
  ]
  ```
- **Impact:** Admin couldn't change values without code editing. Couldn't be defended to supervisor.
- **Status:** FIXED (FIX-PHASE4.5-001). Now fetched from `GET /api/marketing/stats` which auto-computes values from the DB:
  - `yearsServing` ← years since oldest active mosque was created
  - `totalDonationsPKR` ← sum of confirmed/completed donations
  - `activeRequests` ← count of FundRequest with status='pending'
  - `familiesHelped` ← count of FundRequest with status='approved'/'fulfilled'
- **Bonus fix:** Removed the "Mosques Served" card (per partner feedback — single-mosque focus), replaced with "Years Serving" (more meaningful).

## BUG-PHASE4.5-002 — Impact counters also hardcoded

- **Same root cause as BUG-PHASE4.5-001.**
- **Status:** FIXED. Now fetched from `GET /api/marketing/impact`.

## BUG-PHASE4.5-003 — Featured Campaign hardcoded in the JSX

- **Severity:** High
- **Location:** `frontend/src/components/Marketing/FeaturedCampaign.jsx` (pre-Phase 4.5)
- **Root cause:** All campaign data (title, subtitle, raised, goal, donor count, days left) was hardcoded in a `const FEATURED = {...}` object.
- **Impact:** Admin couldn't change the active campaign without editing code.
- **Status:** FIXED. Now fetched from `GET /api/marketing/featured-campaign` which returns the Campaign document where `isFeatured: true`. Admin creates/edits campaigns via the new admin panel.

## BUG-PHASE4.5-004 — Testimonials hardcoded in the JSX

- **Same root cause as 003.**
- **Status:** FIXED. Now fetched from `GET /api/marketing/testimonials` (admin-managed). Falls back to a placeholder when the DB is empty.

## BUG-PHASE4.5-005 — ImageCarousel used hardcoded image paths

- **Same root cause.**
- **Status:** FIXED. Now fetched from `GET /api/marketing/hero-slides` (admin-managed). Falls back to the 6 default Gemini images as a graceful default.

## BUG-PHASE4.5-006 — No admin UI to manage marketing content

- **Severity:** High (FYP critical feature)
- **Status:** FIXED. Created `frontend/src/components/Admin/Pages/Marketing.jsx` with 3 tabs:
  - Campaigns (CRUD, with auto-unfeature when another is set as featured)
  - Testimonials (CRUD)
  - Hero slides (CRUD)
- The page is mounted at `/admin/marketing` and added to the admin sidebar.

## BUG-PHASE4.5-007 (build-time) — `setState` synchronously in effect + unescaped quotes in admin page

- **Severity:** Low (build / lint only, no runtime impact)
- **Location:** `frontend/src/components/Admin/Pages/Marketing.jsx`
- **Root cause:** Initial implementation called `setLoading(true)` at the top of the `load()` function (executed inside `useEffect`), which the React 18 lint rules flag as a cascading-render risk. Also had unescaped `"` characters in JSX text nodes.
- **Status:** FIXED. Wrapped `load()` in `useCallback(..., [showToast])` (so it has a stable identity across renders) and removed the unnecessary `setLoading(true)` since the initial `useState(true)` already provides the loading state. Replaced all unescaped `"` with `&ldquo;` and `&rdquo;` in JSX text content.
- **Verification:** `npm run lint` → 0 errors, 0 warnings. `npm run build` → 522 kB bundle, success. `npm test` (backend) → 10/10 passing.

## NOT FOUND (Confirmed Absent)
- No SQL injection risks (using Mongoose ODM + express-validator)
- No XSS risks (admin form values pass through express-validator and are sanitized before storage)
- No file upload vulnerabilities (admin can only paste image URLs, not upload files — keeps the threat model simple)
- No auth bypass: all admin routes use `protect + authorize('admin')` middleware

## Out of Scope (not addressed in this phase, planned for later)
- **Admin image upload (file picker instead of URL paste):** would require a `multer` setup, `uploads/` directory, and an `express.static` mount. Skipped for FYP scope.
- **Email notification when a new testimonial is added:** would use the existing SendGrid integration. Skipped per partner's earlier decision (only forgot-password emails).
- **Image optimization (auto-resize on upload):** not relevant since we only accept URLs.

---

## BUG-PHASE4.5-008 — Multi-tenant scope leak: Campaign/Testimonial/HeroSlide not scoped to a masjid (found during 2026-08-24 re-verification)

- **Severity:** High — multi-tenant isolation violation. A co-masjid admin could see, edit, and delete marketing content belonging to a different masjid. The whole platform promise ("each masjid is isolated under the super admin") is broken for the marketing module.
- **Locations:**
  - `backend/models/Campaign.js` — schema had no `mosqueId` field
  - `backend/models/Testimonial.js` — schema had no `mosqueId` field
  - `backend/models/HeroSlide.js` — schema had no `mosqueId` field
  - `backend/services/adminMarketingService.js` — every list/create/update/delete ran `find({})` with no mosque filter
  - `backend/controllers/adminMarketingController.js` — passed `req.user` to create but ignored it on update/delete/list
  - `backend/services/marketingService.js` — public list/featured queries ran `find({ isActive: true })` with no mosque filter
  - `frontend/src/components/Marketing/FeaturedCampaign.jsx`, `Testimonials.jsx`, `ImageCarousel.jsx` — all called the public marketing API without `?mosqueId=`, so the homepage always showed the same content regardless of which masjid was selected in the navbar
  - `frontend/src/utils/api.js` — marketing helpers had no `mosqueId` parameter
- **Live API reproduction (run 2026-08-24, before the fix):**
  - Logged in as `admin@emasjid.pk` (Al-Noor), `POST /api/admin/marketing/campaigns` with `title: 'PHASE4.5-LEAK-PROBE'` → `201 Created`, id returned.
  - Logged in as `admin2@emasjid.pk` (Al-Rahman), `GET /api/admin/marketing/campaigns` → `200 OK` count=2 — **Al-Rahman admin saw Al-Noor's probe**.
  - `PUT /api/admin/marketing/campaigns/<probe-id>` as Al-Rahman → `200 OK` (cross-mosque edit succeeded).
  - `DELETE /api/admin/marketing/campaigns/<probe-id>` as Al-Rahman → `200 OK` (cross-mosque delete succeeded).
  - Same probe with hero-slides: `GET` saw it, `PUT` 200, `DELETE` 200.
  - Public `GET /api/marketing/campaigns` (no token) returned the global pool regardless of which masjid the homepage was supposed to be showing.
- **Impact:**
  - Admin of Masjid Al-Rahman could delete Masjid Al-Noor's featured campaign, testimonials, or hero slides — which is a real-world outage for Al-Noor's homepage.
  - Selecting Al-Rahman in the navbar did NOT change which campaigns/testimonials/slides appeared on the homepage, so the homepage was misleading about which masjid the visitor was looking at.
  - This is the same shape of bug fixed earlier for `FundRequest` (Phase 14) and `Committee` (Phase 13); the marketing module had been missed.
## BUG-MKT-1 — Hero Slide "Link URL" not clickable on homepage (found during 2026-08-25 manual QA)

- **Severity:** Medium — admin sets a CTA link on a hero slide (e.g. `/donate`, `/events`) but the homepage carousel image is not clickable.
- **Location:** `frontend/src/components/Marketing/ImageCarousel.jsx` (line 95 — original `<img>` had no wrapper)
- **Root cause:** The `link` field on each `HeroSlide` document was stored in the DB and listed in the admin form, but the homepage component rendered every slide as a bare `<img>`. The link value was never wired to a wrapping `<a>` element.
- **Live reproduction (2026-08-25):** admin opened `/admin/marketing`, opened Hero Slides tab, edited the first slide, entered `/donate` in the "Link URL (optional)" field, saved. Refreshed the homepage — the carousel showed the same image but clicking it did nothing (no link behaviour, no cursor change).
- **Status:** FIXED. Each slide is now wrapped in an `<a href={link}>` when `link` is non-empty (external links open in a new tab with `target="_blank" rel="noopener noreferrer"`). An extra "Click to learn more" indicator appears below the caption when a link is set.
- **Verification:** `Testing/04.5_Marketing_Content_Management/mkt_fixes_test.js` Section 1 sets a hero slide's link to `/donate`, reloads the homepage, finds the `<a href="/donate">` wrapping the slide image → PASS.

## BUG-MKT-2 — Testimonials overflow: only first 3 ever visible (found during 2026-08-25 manual QA)

- **Severity:** Medium — admin adds a 4th, 5th, 10th testimonial; the homepage silently shows only the first 3 every time. Admin has no idea the others are even in the DB.
- **Location:** `frontend/src/components/Marketing/Testimonials.jsx` line 82 — `display.slice(0, 3).map(...)` literally dropped every testimonial past the 3rd.
- **Root cause:** The homepage rendered testimonials as a single 3-column grid with no pagination, slider, or "show more" affordance. The DB query already returned all active testimonials (`listTestimonials(mosqueId)`), but the UI sliced to the first 3.
- **Live reproduction (2026-08-25):** admin added "Dawood", "Ayesha Malik", "Haji Muhammad Aslam", "Fatima & Zainab" (4 testimonials). Homepage showed only the first 3 names — "Fatima & Zainab" was nowhere on the page even though it was in the DB and marked isActive.
- **Status:** FIXED. Replaced the 3-column hard slice with a slider: shows 3 cards per page on desktop, 1 on mobile (responsive), with left/right arrow buttons + dot indicators + 6-second auto-advance (paused on hover). Total pages = `Math.ceil(items.length / perPage)`.
- **Verification:** `mkt_fixes_test.js` Section 2 confirms: first page has 3 figures, arrows present, 2 dot indicators present, clicking Next changes the visible testimonial names. → PASS.

## BUG-MKT-3 — Campaign "Active (visible on homepage)" toggle did nothing visible (found during 2026-08-25 manual QA)

- **Severity:** Medium — admin toggles isActive on a non-featured campaign; nothing appears on the homepage. The toggle worked (data was persisted) but the UI gave no feedback.
- **Location:** `frontend/src/components/Marketing/FeaturedCampaign.jsx` (only ever rendered the one isFeatured=true campaign) + the public marketing controller (`backend/controllers/marketingController.js`) which correctly filtered `isActive: true` in `listCampaigns`.
- **Root cause:** The homepage only rendered the Featured Campaign section (which requires `isFeatured=true`). Non-featured campaigns were never shown anywhere on the homepage, so toggling their `isActive` flag had no visible effect. The DB and API were correct; the homepage was missing the "other active campaigns" surface.
- **Live reproduction (2026-08-25):** admin created a 2nd campaign "Buy new speaker", set it isActive=true, left isFeatured=false. Saved. Refreshed homepage — only the original "Help Us Build a New Minaret" was visible. Toggling Buy new speaker's isActive checkbox had no observable effect.
- **Status:** FIXED as a side-effect of FEATURE-MKT-4. The new "Other Active Campaigns" grid below the featured section now shows every non-featured `isActive=true` campaign as a card, so the toggle is now meaningful.
- **Verification:** `mkt_fixes_test.js` Section 3 unfeatures "Buy new speaker", reloads homepage, confirms it now appears in the "Other Active Campaigns" grid → PASS.

## FEATURE-MKT-4 — Support multiple campaigns at once (partner-requested 2026-08-25)

- **Decision:** keep ONE featured campaign at the top (big CTA, full progress bar) **plus** an "Other Active Campaigns" 3-column grid below showing every other isActive=true, isFeatured=false campaign as a smaller card. This matches how real masjids operate — one main drive + several smaller ongoing campaigns.
- **Implementation:** new component `frontend/src/components/Marketing/OtherCampaigns.jsx`. Pulls from `GET /api/marketing/campaigns`, filters out the featured one (`!c.isFeatured`), hides itself entirely if the list is empty.
- **Verification:** confirmed live in Section 3 of `mkt_fixes_test.js`. The featured section continues to show "Help Us Build a New Minaret" and the new grid shows "Buy new speaker" right below. PASS.

## FEATURE-MKT-5 — Removed donorCount field from Campaign (partner-requested 2026-08-25)

- **Decision:** `donorCount` was manual bookkeeping — the admin had to keep it up-to-date as donations came in, but there's no automatic source of truth for individual donor tallies. Easy to forget and create a misleading number. Removing it keeps the campaign card honest.
- **Files changed:**
  - `backend/models/Campaign.js` — removed `donorCount` field; updated docstring.
  - `backend/services/adminMarketingService.js` — `sanitizeCampaign()` now does `delete data.donorCount` so a stale client cannot re-introduce the field.
  - `frontend/src/components/Admin/Pages/Marketing.jsx` — removed the "Donor Count" form field, removed from `blankCampaign()`, `openEdit()`, `save()` payload.
  - `frontend/src/components/Marketing/FeaturedCampaign.jsx` — replaced "{campaign.donorCount || 0} donors" with "{pct}% funded" in the meta row.
- **Backfill:** `backend/utils/patch_campaign_no_donorcount.js` — used the raw collection (`Campaign.collection.updateMany`) to strip `donorCount` from every existing Campaign document. Matched=2, modified=2. Important: the first attempt using `Campaign.updateMany` reported success but left the field in the BSON — mongoose's strict schema silently filtered out the `$unset` operator. Always use the raw collection for schema-removal backfills.
- **Verification:** `mkt_fixes_test.js` Section 4 confirms: API response has no `donorCount` key, admin "New Campaign" modal has no "Donor Count" field. PASS.
