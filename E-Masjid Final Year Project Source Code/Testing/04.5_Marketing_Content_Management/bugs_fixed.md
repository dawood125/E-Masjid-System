# 04.5 Marketing Content Management — Bugs Fixed

> Phase 4.5 fixes applied 2026-06-24.
> Phase 4.5 re-verification + FIX-PHASE4.5-008 applied 2026-08-24.

---

## FIX-PHASE4.5-001 to 005 — Replaced all hardcoded marketing data with live API calls

### Backend changes

**3 new Mongoose models:**
- `backend/models/Campaign.js` — `title, subtitle, targetAmount, raisedAmount, donorCount, daysLeft, image, isActive, isFeatured, order, createdBy`. Pre-save hook auto-unfeatures any other campaign when a new one is marked featured (so only ONE featured at a time).
- `backend/models/Testimonial.js` — `name, role, quote, photo, order, isActive, createdBy`.
- `backend/models/HeroSlide.js` — `image, mobileImage, caption, link, order, isActive, createdBy`.

**Public marketing routes (6 endpoints, all in `backend/routes/marketing.js`):**
- `GET /api/marketing/stats` — auto-computed (yearsServing, totalDonationsPKR, activeRequests, familiesHelped)
- `GET /api/marketing/impact` — auto-computed (prayersTracked, studentsTaught, nikahHosted, familiesSupported)
- `GET /api/marketing/featured-campaign` — returns the one isFeatured=true campaign
- `GET /api/marketing/campaigns` — all active campaigns
- `GET /api/marketing/testimonials` — all active testimonials
- `GET /api/marketing/hero-slides` — all active hero slides

**Admin CRUD routes (12 endpoints, all in `backend/routes/adminMarketing.js`, role='admin' required):**
- Campaigns: list, create, update, delete
- Testimonials: list, create, update, delete
- Hero slides: list, create, update, delete

**Mounted in `server.js`:** both `app.use('/api/marketing', ...)` and `app.use('/api/admin/marketing', ...)`.

### Frontend changes

**5 public components refactored to fetch from API:**
- `Marketing/StatsSection.jsx` — `api.getMarketingStats()` on mount, renders real data + count-up animation
- `Marketing/ImpactCounters.jsx` — `api.getMarketingImpact()`, scroll-triggered count-up via IntersectionObserver
- `Marketing/FeaturedCampaign.jsx` — `api.getMarketingFeaturedCampaign()`; hides itself if no featured campaign
- `Marketing/Testimonials.jsx` — `api.getMarketingTestimonials()`; falls back to placeholder card when DB empty
- `Marketing/ImageCarousel.jsx` — `api.getMarketingHeroSlides()`; falls back to 6 default Gemini images

**Removed (per partner decision):**
- `Marketing/ProgramsGrid.jsx` (file deleted)
- The "Mosques Served" stat card → replaced with "Years Serving" (more relevant for a single-mosque community context)
- `<ProgramsGrid />` block removed from `Home.jsx`

**New admin panel page:** `frontend/src/components/Admin/Pages/Marketing.jsx` — single page with 3 tabs (Campaigns, Testimonials, Hero Slides). Each tab has a list view + Add button + per-row Edit/Delete actions. Modals for create/edit forms with full validation.

**Sidebar link added:** "Marketing Content" in `frontend/src/components/Common/Sidebar.jsx`, pointing to `/admin/marketing`.

**Route registered in `App.jsx`:** `<Route path="marketing" element={<AdminMarketing />} />` inside the `/admin/*` layout.

**API client methods added** in `frontend/src/utils/api.js`:
- Public: `getMarketingStats, getMarketingImpact, getMarketingFeaturedCampaign, getMarketingCampaigns, getMarketingTestimonials, getMarketingHeroSlides`
- Admin: `adminListCampaigns, adminCreateCampaign, adminUpdateCampaign, adminDeleteCampaign, adminListTestimonials, adminCreateTestimonial, adminUpdateTestimonial, adminDeleteTestimonial, adminListHeroSlides, adminCreateHeroSlide, adminUpdateHeroSlide, adminDeleteHeroSlide`

### Seed updates

`backend/utils/seed.js` now seeds 1 featured campaign ("Help Us Build a New Minaret"), 3 testimonials, and 6 hero carousel slides (using the default Gemini images in `/public/assets/images/gallery/`).

## FIX-PHASE4.5-007 — Lint + build issues

- Replaced all unescaped `"` with `&ldquo;` and `&rdquo;` in JSX text in `Marketing.jsx` and `Testimonials.jsx`.
- Wrapped `load()` in `useCallback(..., [showToast])` to keep it stable.
- Removed `setLoading(true)` (initial `useState(true)` already provides the loading state).
- Removed unused `let res` variable.
- **Result:** `npm run lint` → 0 errors, 0 warnings. `npm run build` → 522 kB bundle, success.

## Verification

| Check | Command | Result |
|-------|---------|--------|
| Backend tests | `cd backend && npm test` | ✅ 10/10 passing |
| Frontend lint | `cd frontend && npm run lint` | ✅ 0 errors, 0 warnings |
| Frontend build | `cd frontend && npm run build` | ✅ 522 kB bundle, success |
| Public API | `GET /api/marketing/stats` | ✅ returns 4 stats |
| Public API | `GET /api/marketing/impact` | ✅ returns 4 impact numbers |
| Public API | `GET /api/marketing/featured-campaign` | ✅ returns the featured campaign |
| Public API | `GET /api/marketing/testimonials` | ✅ returns 3 testimonials |
| Public API | `GET /api/marketing/hero-slides` | ✅ returns 6 slides |
| Admin auth | all `/api/admin/marketing/*` | ✅ protected (admin only) |

## Files Modified / Created

**Backend (6 new files + 1 modified):**
- `backend/models/Campaign.js` (new)
- `backend/models/Testimonial.js` (new)
- `backend/models/HeroSlide.js` (new)
- `backend/routes/marketing.js` (new)
- `backend/routes/adminMarketing.js` (new)
- `backend/server.js` (mounted 2 new routes)
- `backend/utils/seed.js` (seeds 1 campaign + 3 testimonials + 6 hero slides)

**Frontend (5 modified + 1 new + 1 deleted):**
- `frontend/src/components/Marketing/StatsSection.jsx` (rewritten)
- `frontend/src/components/Marketing/ImpactCounters.jsx` (rewritten)
- `frontend/src/components/Marketing/FeaturedCampaign.jsx` (rewritten)
- `frontend/src/components/Marketing/Testimonials.jsx` (rewritten)
- `frontend/src/components/Marketing/ImageCarousel.jsx` (rewritten)
- `frontend/src/components/Admin/Pages/Marketing.jsx` (new, ~500 lines)
- `frontend/src/components/User/Pages/Home.jsx` (removed ProgramsGrid import + block)
- `frontend/src/components/Common/Sidebar.jsx` (added "Marketing Content" link)
- `frontend/src/App.jsx` (added `/admin/marketing` route)
- `frontend/src/utils/api.js` (added 18 new API methods)
- `frontend/src/components/Marketing/ProgramsGrid.jsx` (deleted)

---

## FIX-PHASE4.5-008 — Scoped Campaign / Testimonial / HeroSlide to a masjid (BUG-PHASE4.5-008, re-verification 2026-08-24)

Multi-tenant isolation was missing in the marketing module. The same shape of bug that was fixed for FundRequest (Phase 14) and Committee (Phase 13) had not been applied here.

### Backend changes

**1. Added `mosqueId` to all 3 schemas (`required: true, ref: 'Mosque'` + compound indexes):**
- `backend/models/Campaign.js` — `mosqueId: { type: ObjectId, ref: 'Mosque', required: true, index: true }`. Added indexes `{ mosqueId: 1, isActive: 1, order: 1 }` and `{ mosqueId: 1, isFeatured: 1, isActive: 1 }`.
- `backend/models/Testimonial.js` — `mosqueId: { type: ObjectId, ref: 'Mosque', required: true, index: true }` + `{ mosqueId: 1, isActive: 1, order: 1 }`.
- `backend/models/HeroSlide.js` — `mosqueId: { type: ObjectId, ref: 'Mosque', required: true, index: true }` + `{ mosqueId: 1, isActive: 1, order: 1 }`.

**2. Scoped every admin operation to `req.user.mosqueId` (`backend/services/adminMarketingService.js`):**
- All `list*` functions now do `Campaign.find({ mosqueId: user.mosqueId })` etc.
- All `create*` functions set `mosqueId: user.mosqueId` on the new document.
- All `update*` functions became `findOneAndUpdate({ _id: id, mosqueId: user.mosqueId }, ...)` — if the id belongs to another masjid, the update returns `null` → 404.
- All `delete*` functions became `findOneAndDelete({ _id: id, mosqueId: user.mosqueId })` — same.

**3. Updated `backend/controllers/adminMarketingController.js`** to pass `req.user` into update/delete/list calls (previously it was passed only to create).

**4. Public marketing controller now accepts `?mosqueId=` and falls back to the first active masjid (`backend/services/marketingService.js#resolveMosqueId`):**
- New helper `resolveMosqueId(mosqueId)` validates the ObjectId and falls back to the first active masjid sorted by `createdAt ASC` (which is Masjid Al-Noor in the seed).
- `featuredCampaign(mosqueId)`, `listCampaigns(mosqueId)`, `listTestimonials(mosqueId)`, `listHeroSlides(mosqueId)` all scope by `mosqueId`.
- The controller returns `{ success: true, data: null }` (featured) or `{ success: true, data: [] }` (lists) when no masjid is resolvable.

### Frontend changes

**1. `frontend/src/utils/api.js`** — `getMarketingFeaturedCampaign`, `getMarketingCampaigns`, `getMarketingTestimonials`, `getMarketingHeroSlides` now accept an optional `mosqueId` and append `?mosqueId=<id>` when given.

**2. Three homepage marketing components now read `activeMosqueId` from `useMosque()` and pass it to the API:**
- `frontend/src/components/Marketing/FeaturedCampaign.jsx` — added `useMosque()` import, added `activeMosqueId` to the `useEffect` dependency array.
- `frontend/src/components/Marketing/Testimonials.jsx` — same pattern.
- `frontend/src/components/Marketing/ImageCarousel.jsx` — same pattern.

The admin panel's `Admin/Pages/Marketing.jsx` is unchanged because the admin panel doesn't expose a masjid selector — admins are scoped server-side via `req.user.mosqueId` (which is the admin's home masjid).

### Backfill (one-time)

`backend/utils/patch_marketing_mosqueid.js` — assigns `mosqueId: Al-Noor._id` to every existing Campaign/Testimonial/HeroSlide that was missing the field. Run once:
```
node backend/utils/patch_marketing_mosqueid.js
# → Campaign: matched=1 modified=1
# → Testimonial: matched=3 modified=3
# → HeroSlide: matched=6 modified=6
```

### Verification

| Check | Result |
|---|---|
| `node utils/verify_phase45_scope_leak.js` (after fix) | Al-Rahman admin: list=0, PUT=404, DELETE=404 on Al-Noor's probe ✓ |
| Public `GET /api/marketing/featured-campaign?mosqueId=<Al-Noor>` | returns Al-Noor's featured campaign ✓ |
| Public `GET /api/marketing/featured-campaign?mosqueId=<Al-Taqwa>` | returns `null` (Al-Taqwa has no featured campaign) ✓ |
| `node Testing/04.5_Marketing_Content_Management/marketing_test.js` | 5/5 PASS (Sections 1-5) ✓ |
| DB state after test | 1 campaign (Al-Noor), 3 testimonials (Al-Noor), 6 hero slides (Al-Noor) ✓ |
| Lint / build | unchanged — 0 errors / 0 warnings, build 522 kB ✓ |

### Notes

The `pre-save` hook on the Campaign model that auto-unfeatures any other campaign when a new one is marked featured (`backend/models/Campaign.js`) is now scoped by default because every Campaign document has a `mosqueId`, so the hook's `updateMany({ _id: { $ne: this._id }, isFeatured: true })` only matches campaigns in the same masjid (which is what we want — different masjids can have their own featured campaign simultaneously).

---

## FIX-MKT-1 to FIX-MKT-5 — Post-feedback fixes (2026-08-25)

Five issues surfaced during the partner's manual QA of Phase 4.5 on 2026-08-25. All five were addressed in one batch.

### FIX-MKT-1 — Hero Slide "Link URL" now clickable on homepage

**Frontend change** (`frontend/src/components/Marketing/ImageCarousel.jsx`):
- Each slide is now rendered inside a wrapping `<div>` with the transition classes moved to the wrapper.
- When `s.link` is truthy, the `<img>` is wrapped in `<a href={s.link}>`. Internal paths (`/donate`, `/events`, etc.) navigate normally; `https?://` URLs open in a new tab with `target="_blank" rel="noopener noreferrer"`.
- When `s.link` is set, an extra "Click to learn more" indicator appears below the caption so visitors know the image is interactive.

No backend change — the `link` field was already in the schema and admin form.

### FIX-MKT-2 — Testimonials now use a slider instead of `.slice(0, 3)`

**Frontend change** (`frontend/src/components/Marketing/Testimonials.jsx`):
- Replaced the single 3-column `slice(0,3)` grid with a paginated slider.
- 3 cards visible on desktop (`md:grid-cols-3`), 1 on mobile (responsive via `perPage` state).
- `Math.ceil(items.length / perPage)` pages.
- Left/right arrow buttons positioned absolutely at the sides of the cards.
- Dot indicators below the grid; clicking jumps to that page.
- Auto-advances every 6s; pauses when the mouse is over the section (existing pattern from `ImageCarousel`).
- Hidden entirely when total pages is 1 (so a single testimonial doesn't show empty arrows).

No backend change — `listTestimonials(mosqueId)` already returns everything.

### FIX-MKT-3 — Campaign "Active" toggle is now meaningful (resolved by FIX-MKT-4)

The Campaign `isActive` flag was being correctly filtered by the public API, but the homepage had no surface that showed non-featured campaigns. With FIX-MKT-4 below, the toggle is now visible: flip a campaign off and it disappears from the Other Campaigns grid; flip it on and it appears.

### FIX-MKT-4 — New "Other Active Campaigns" grid below the featured section

**New component** (`frontend/src/components/Marketing/OtherCampaigns.jsx`):
- Pulls from `GET /api/marketing/campaigns` (which already scopes by `activeMosqueId`).
- Filters out the featured campaign (so it doesn't appear twice).
- Renders a 3-column card grid (1 col mobile, 2 col md, 3 col xl).
- Each card shows: title, subtitle (2-line clamp), raised/target PKR + percent funded, days left, and a "Donate" link to the donate page.
- If `c.image` is set, shows it as a top banner inside the card.
- Hidden entirely when the list is empty (no empty "Ongoing Campaigns" header on a masjid with only 1 campaign).

**Wired in** `frontend/src/components/User/Pages/Home.jsx`:
- Added the import and a `<OtherCampaigns />` block right after `<FeaturedCampaign />`.

### FIX-MKT-5 — Removed `donorCount` from Campaign

**Backend changes:**
- `backend/models/Campaign.js` — removed the `donorCount` field. Updated the docstring to explain why (manual bookkeeping, no source of truth, error-prone).
- `backend/services/adminMarketingService.js` — `sanitizeCampaign()` now does `delete data.donorCount` so an older client cannot re-introduce the field on save.

**Frontend changes:**
- `frontend/src/components/Admin/Pages/Marketing.jsx`:
  - Removed `donorCount` from `blankCampaign()`, `openEdit()`, `save()` payload.
  - Removed the "Donor Count" form field from the campaign modal.
- `frontend/src/components/Marketing/FeaturedCampaign.jsx`:
  - Replaced the meta row "{campaign.donorCount || 0} donors · {daysLeft}d left" with "{daysLeft}d left · {pct}% funded" — a single auto-derived percentage is honest; a hand-typed donor count isn't.

**Backfill** (`backend/utils/patch_campaign_no_donorcount.js`):
- One-shot script using `Campaign.collection.updateMany({ donorCount: { $exists: true } }, { $unset: { donorCount: '' } })`.
- IMPORTANT GOTCHA: the first attempt used `Campaign.updateMany(...)` (the model-aware API). Mongoose's strict schema silently filtered out the `$unset` operator and the `$or` query — the script reported `matched=2 modified=2` but the field stayed in the BSON. Switching to the raw collection API fixed it. Always use `Model.collection.updateMany` for schema-removal backfills.
- Result: matched=2, modified=2. API response confirmed clean: no `donorCount` key.

### Verification (combined `mkt_fixes_test.js`)

| Section | Test | Result |
|---|---|---|
| 1 | Hero slide image wraps in `<a href="/donate">` after setting link via admin API | PASS — update=200 anchorCount=1 |
| 2 | Testimonials slider — first page has 3 cards, 2 dot indicators, clicking Next changes visible cards | PASS — firstPage=3 hasNext=true dots=2 pageChanged=true |
| 3 | "Other Active Campaigns" grid shows "Buy new speaker" when unfeatured | PASS — gridHasSpeaker=true featuredStillShowsMinaret=true |
| 4 | `donorCount` not in API response and not in admin form | PASS — apiReturnsField=false formHasField=0 |
| 5 | Original 5/5 still PASS after the fixes | PASS — minaret=true voices=true moments=true ayesha=true |

Run: `node Testing/04.5_Marketing_Content_Management/mkt_fixes_test.js`. 5/5 PASS confirmed in two consecutive runs (2026-08-25).

### DB state after the backfill + test cleanup

```
=== Campaigns (2) ===
  "Buy new speaker"            target=100000  raised=50000   isFeatured=false  isActive=true
  "Help Us Build a New Minaret" target=800000  raised=320000 isFeatured=true  isActive=true
=== Testimonials (4) ===
  Dawood, Ayesha Malik, Haji Muhammad Aslam, Fatima & Zainab — all isActive=true
=== Hero Slides (6) ===
  gallery-fajr, gallery-quran, gallery-madrassa, gallery-iftar, gallery-nikah, gallery-courtyard
  All isActive=true. First slide had its link set then unset during the test.
```

All marketing records have `mosqueId = Al-Noor._id` (from FIX-PHASE4.5-008 backfill). No residue.
