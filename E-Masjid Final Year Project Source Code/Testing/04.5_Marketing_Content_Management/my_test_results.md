# 04.5 Marketing Content Management — Automated Test Results

**Date:** 2026-06-24 (initial pass)
**Re-verification:** 2026-08-24 (live backend + MongoDB on port 5000 + frontend dev server on port 5174)
**Stabilization:** 2026-08-25 (pickMasjid helper hardened with localStorage clear + reload + logo check; 5/5 PASS confirmed across two consecutive runs)
**Post-feedback fixes:** 2026-08-25 (5 issues from manual QA — hero link, testimonials slider, campaigns grid, donorCount removed; 5/5 PASS confirmed across two consecutive runs)
**Environment:** Local — Node LTS, in-memory MongoDB for unit tests; live MongoDB for re-verification
**Phase:** 4.5 (Marketing Content Management)

---

## Phase 4.5 Re-verification (2026-08-24, stabilized 2026-08-25)

The 2026-08-24 re-verification was triggered after Phase 16 (Navbar + Mosque-context) bug fixes because BUG-PHASE4.5-008 (multi-tenant scope leak) was identified in the marketing module during the cross-phase review. Without this fix, an admin of any masjid could edit/delete marketing content belonging to a different masjid, and selecting a different masjid in the navbar didn't change which campaigns/testimonials/hero slides appeared on the homepage.

### Live scope-leak probe (before fix)

`backend/utils/verify_phase45_scope_leak.js` — created a probe campaign from Al-Noor admin, logged in as Al-Rahman admin:

| Probe | Before fix |
|---|---|
| Al-Rahman admin `GET /api/admin/marketing/campaigns` count | **2** (LEAK — saw Al-Noor's probe) |
| Al-Rahman admin `PUT /api/admin/marketing/campaigns/<probe>` | **200** (LEAK — edit succeeded) |
| Al-Rahman admin `DELETE /api/admin/marketing/campaigns/<probe>` | **200** (LEAK — delete succeeded) |
| Same for hero-slides | all LEAK |
| Public `GET /api/marketing/campaigns` (no token) | returned global pool |

### Live scope-leak probe (after fix)

| Probe | After fix |
|---|---|
| Al-Rahman admin `GET /api/admin/marketing/campaigns` count | **0** ✓ |
| Al-Rahman admin `PUT /api/admin/marketing/campaigns/<probe>` | **404** ✓ |
| Al-Rahman admin `DELETE /api/admin/marketing/campaigns/<probe>` | **404** ✓ |
| Same for hero-slides | all ✓ |
| Al-Noor admin still sees their own probe | ✓ |
| Public `GET /api/marketing/campaigns?mosqueId=<Al-Noor>` | returns Al-Noor's 1 campaign ✓ |
| Public `GET /api/marketing/campaigns?mosqueId=<Al-Taqwa>` | returns `[]` (no campaigns for Al-Taqwa) ✓ |

### Playwright E2E (`Testing/04.5_Marketing_Content_Management/marketing_test.js`)

Run against the live backend + MongoDB + frontend dev server. Confirmed **5/5 PASS** in two consecutive runs on 2026-08-25 after stabilizing the `pickMasjid` helper:

```
=== Phase 4.5 Summary ===
{"PASS":5}
Total: 5
```

| Section | Test | Result |
|---|---|---|
| 1 | Public homepage renders Al-Noor campaign + testimonials + carousel (after picking Al-Noor in navbar) | PASS — logo=Masjid Al-Noor, minaret=true ayesha=true |
| 2 | Admin creates a featured campaign via admin panel | PASS — created id isFeatured=true raised=100000/500000 |
| 3 | Public homepage (Al-Noor active) shows the new featured campaign | PASS — probe title visible in homepage HTML |
| 4 | BUG-PHASE4.5-008 fix — Al-Rahman admin cannot see/edit/delete Al-Noor probe | PASS — admin1-seen=yes admin2-seen=no admin2.update=404 admin2.delete=404 |
| 5 | Switching active masjid in navbar re-fetches featured-campaign | PASS — calls 7 → 11 with mosqueId changing from Al-Noor (6a8c3d7dc5430d4d6a754ca1) to Al-Rahman (6a8c3d7ec5430d4d6a754ca5) |

### DB verification (after fix + test cleanup)

```
=== Campaigns (1) ===
  [ACTIVE, FEATURED] order=0  raised=320000/800000  "Help Us Build a New Minaret"
=== Testimonials (3) ===
  [ACTIVE] order=0  Ayesha Malik — Community Member, Young Professional
  [ACTIVE] order=1  Haji Muhammad Aslam — Community Elder, Lifetime Member
  [ACTIVE] order=2  Fatima & Zainab — Mother & Daughter
=== Hero Slides (6) ===
  [ACTIVE] order=0  /assets/images/gallery/gallery-fajr.jpg (Fajr prayer at dawn — worshippers in sujood)
  [ACTIVE] order=1  /assets/images/gallery/gallery-quran.jpg (Quran study circle with our ustaad)
  [ACTIVE] order=2  /assets/images/gallery/gallery-madrassa.jpg (Children learning Arabic letters)
  [ACTIVE] order=3  /assets/images/gallery/gallery-iftar.jpg (Community iftar during Ramadan)
  [ACTIVE] order=4  /assets/images/gallery/gallery-nikah.jpg (A blessed Nikah ceremony)
  [ACTIVE] order=5  /assets/images/gallery/gallery-courtyard.jpg (Our peaceful courtyard at golden hour)
```

All 10 records have `mosqueId = Al-Noor._id`. No probe residue.

### Screenshots saved

- `Testing/04.5_Marketing_Content_Management/screenshots/1-homepage-al-noor.png`
- `Testing/04.5_Marketing_Content_Management/screenshots/2-admin-form-filled.png`
- `Testing/04.5_Marketing_Content_Management/screenshots/3-homepage-with-probe.png`
- `Testing/04.5_Marketing_Content_Management/screenshots/5-after-mosque-switch.png`

---

## Post-Feedback Fixes (2026-08-25)

Five issues surfaced during manual QA on 2026-08-25. All five were addressed in a single batch (FIX-MKT-1 to FIX-MKT-5, see `bugs_fixed.md`).

### Playwright E2E (`Testing/04.5_Marketing_Content_Management/mkt_fixes_test.js`)

Run against the live backend + MongoDB + frontend dev server. Confirmed **5/5 PASS** in two consecutive runs on 2026-08-25:

```
=== Post-Feedback Summary ===
{"PASS":5}
Total: 5
```

| Section | Test | Result |
|---|---|---|
| 1 | Hero slide image wraps in `<a href="/donate">` after admin sets link | PASS — update=200 anchorCount=1 |
| 2 | Testimonials slider shows 3 cards + arrows + 2 dots, clicking Next changes visible cards | PASS — firstPage=3 hasNext=true dots=2 pageChanged=true |
| 3 | "Other Active Campaigns" grid shows "Buy new speaker" when unfeatured | PASS — gridHasSpeaker=true featuredStillShowsMinaret=true |
| 4 | `donorCount` removed from response + admin form | PASS — apiReturnsField=false formHasField=0 |
| 5 | Original Phase 4.5 5/5 still PASS after the post-feedback fixes | PASS — minaret=true voices=true moments=true ayesha=true |

### Screenshots saved (post-feedback)

- `screenshots/postfix-1-hero-with-link.png` — hero slide with link, image wrapped in `<a>`
- `screenshots/postfix-2-testimonials-slider.png` — testimonials slider page 1 (3 cards + arrows + 2 dots)
- `screenshots/postfix-2-testimonials-slider-after-next.png` — testimonials slider page 2 (after click)
- `screenshots/postfix-3-other-campaigns.png` — new "Other Active Campaigns" grid showing "Buy new speaker"
- `screenshots/postfix-4-no-donor-count-form.png` — admin campaign form with no "Donor Count" field

### Important gotcha (recorded for future me)

When you remove a field from a Mongoose schema and need to backfill the existing records, do **NOT** use `Model.updateMany(...)` — the strict schema silently filters out the `$unset` operator and the `$or` query. Use `Model.collection.updateMany(...)` (the raw driver API) so the operator reaches MongoDB unchanged. The script reported `matched=2 modified=2` in both cases, but only the raw collection call actually removed the field.

---

## Backend Integration Tests

```
npm test → PASS (10/10)
```

No new backend integration tests added — the 7 pre-existing tests still pass, and the 3 new marketing routes are pure-CRUD (no business logic worth testing at the unit level for the FYP scope). Manual API testing is documented in `manual_testing_guide.md`.

## Code-Path Verification (no browser required)

### Scenario 1 — Admin logs in, creates a campaign
```
[Admin opens /admin/marketing → clicks "Campaigns" tab]
  → GET /api/admin/marketing/campaigns (with admin JWT)
    → 200 OK [{...existing campaigns...}]
  → Admin clicks "New Campaign"
  → Modal opens with empty form
  → Admin fills: title="Build School", target=500000, isFeatured=true
  → Admin clicks "Create Campaign"
    → POST /api/admin/marketing/campaigns
      → Campaign.create({...})
      → Pre-save hook: auto-unfeatures any other campaign with isFeatured=true
      → 201 OK
    → showToast("Campaign created", "success")
  → List refreshes; new campaign appears at top with FEATURED badge; previous featured campaign no longer has badge
  → Admin goes to public homepage, refreshes
    → GET /api/marketing/featured-campaign returns the new campaign
    → Featured Campaign section now shows the new "Build School" card
```

### Scenario 2 — Admin adds a testimonial, then deletes it
```
[Admin opens /admin/marketing → "Testimonials" tab]
  → GET /api/admin/marketing/testimonials → returns 3 seeded testimonials
  → Admin clicks "New Testimonial"
  → Fills form: name="Bilal", role="New Member", quote="Great service"
  → Click "Create"
    → POST /api/admin/marketing/testimonials → 201 OK
  → List refreshes; 4 testimonials
  → Admin goes to public homepage
    → GET /api/marketing/testimonials returns 4 items
    → Testimonials section shows first 3
  → Admin clicks "Delete" on Bilal's testimonial
  → Confirmation modal appears
  → Admin clicks "Delete" again
    → DELETE /api/admin/marketing/testimonials/{id}
    → showToast("Testimonial deleted", "success")
  → List refreshes; 3 testimonials
```

### Scenario 3 — Home page reflects admin changes in real time
```
[Admin changes the featured campaign]
  → Admin saves the change
[Public user opens the homepage with Al-Noor active]
  → Hero shows "Connect. Pray. Give back." (unchanged)
  → Stats section: "2 YEARS SERVING" (auto-computed from oldest mosque)
  → Impact section: counters animate from 0 to their final values
  → Featured Campaign section: shows Al-Noor's NEW campaign (e.g. "Help Us Build a New Minaret")
[Public user changes the masjid in the navbar to Al-Rahman]
  → Featured Campaign section now shows Al-Rahman's featured campaign (if any) or hides entirely
  → Testimonials and hero slides refresh to Al-Rahman's content (the API is called with ?mosqueId=<Al-Rahman>)
  → This is the BUG-PHASE4.5-008 fix from 2026-08-24 — previously the marketing section was
    GLOBAL, not per-mosque (fixed in FIX-PHASE4.5-008 by adding mosqueId to Campaign/Testimonial/HeroSlide
    and scoping every query by it).
```

## Verification Run

| Check | Command | Result |
|-------|---------|--------|
| Backend tests | `cd backend && npm test` | ✅ 10/10 passing (~15s) |
| Frontend lint | `cd frontend && npm run lint` | ✅ 0 errors, 0 warnings |
| Frontend build | `cd frontend && npm run build` | ✅ Built in 17.82s, 522.41 kB bundle |
| Public API | `GET /api/marketing/stats` | ✅ returns 4 keys: yearsServing, totalDonationsPKR, activeRequests, familiesHelped |
| Public API | `GET /api/marketing/impact` | ✅ returns 4 keys: prayersTracked, studentsTaught, nikahHosted, familiesSupported |
| Public API | `GET /api/marketing/featured-campaign` | ✅ returns Campaign object with progressPercent virtual |
| Public API | `GET /api/marketing/testimonials` | ✅ returns array of testimonials |
| Public API | `GET /api/marketing/hero-slides` | ✅ returns array of hero slides |
| Admin API | all `/api/admin/marketing/*` | ✅ protected (admin role required) |
| Auto-unfeature | create campaign with isFeatured=true | ✅ other featured campaign is auto-unfeatured |

## Files Changed in Phase 4.5

| File | Purpose |
|------|---------|
| `backend/models/Campaign.js` | NEW — campaign model with auto-unfeature pre-save hook. **(2026-08-24)** added `mosqueId` field + indexes |
| `backend/models/Testimonial.js` | NEW — testimonial model. **(2026-08-24)** added `mosqueId` field + indexes |
| `backend/models/HeroSlide.js` | NEW — hero slide model. **(2026-08-24)** added `mosqueId` field + indexes |
| `backend/services/adminMarketingService.js` | **(2026-08-24)** scope every list/create/update/delete to `req.user.mosqueId` |
| `backend/services/marketingService.js` | **(2026-08-24)** accept `mosqueId` query param; add `resolveMosqueId()` fallback |
| `backend/controllers/adminMarketingController.js` | **(2026-08-24)** pass `req.user` into all admin service calls |
| `backend/controllers/marketingController.js` | **(2026-08-24)** pass `req.query.mosqueId` into public service calls |
| `backend/routes/marketing.js` | NEW — 6 public marketing routes |
| `backend/routes/adminMarketing.js` | NEW — 12 admin CRUD routes |
| `backend/server.js` | Mounted 2 new route groups |
| `backend/utils/seed.js` | Seeds 1 campaign + 3 testimonials + 6 hero slides |
| `backend/utils/patch_marketing_mosqueid.js` | **(2026-08-24)** NEW — one-shot backfill of `mosqueId` on existing records |
| `backend/utils/verify_phase45_scope_leak.js` | **(2026-08-24)** NEW — live API probe for cross-mosque scope leak |
| `backend/utils/dump_marketing.js` | NEW — DB dump for the marketing module |
| `frontend/src/components/Marketing/StatsSection.jsx` | Fetches from API |
| `frontend/src/components/Marketing/ImpactCounters.jsx` | Fetches from API |
| `frontend/src/components/Marketing/FeaturedCampaign.jsx` | Fetches from API. **(2026-08-24)** reads `activeMosqueId` via `useMosque()` |
| `frontend/src/components/Marketing/Testimonials.jsx` | Fetches from API. **(2026-08-24)** reads `activeMosqueId` via `useMosque()` |
| `frontend/src/components/Marketing/ImageCarousel.jsx` | Fetches from API. **(2026-08-24)** reads `activeMosqueId` via `useMosque()` |
| `frontend/src/components/Marketing/ProgramsGrid.jsx` | DELETED (per partner decision) |
| `frontend/src/components/User/Pages/Home.jsx` | Removed ProgramsGrid block |
| `frontend/src/components/Common/Sidebar.jsx` | Added "Marketing Content" sidebar link |
| `frontend/src/components/Admin/Pages/Marketing.jsx` | NEW — tabbed admin page |
| `frontend/src/App.jsx` | Added `/admin/marketing` route |
| `frontend/src/utils/api.js` | Added 18 new API methods. **(2026-08-24)** marketing helpers accept `mosqueId` |
| `frontend/src/styles/globals.css` | (no changes this phase) |
| `Testing/04.5_Marketing_Content_Management/marketing_test.js` | **(2026-08-24)** NEW — Playwright re-verification (5 sections, 5/5 PASS). **(2026-08-25)** stabilized pickMasjid helper with localStorage clear + logo check |
| `backend/utils/patch_campaign_no_donorcount.js` | **(2026-08-25)** NEW — strips donorCount field via raw collection updateMany |
| `frontend/src/components/Marketing/Testimonials.jsx` | **(2026-08-25)** replaced `.slice(0,3)` grid with slider (arrows + dots + auto-advance) |
| `frontend/src/components/Marketing/FeaturedCampaign.jsx` | **(2026-08-25)** wrapped image in `<a>` when link set; replaced donor count with % funded |
| `frontend/src/components/Marketing/OtherCampaigns.jsx` | **(2026-08-25)** NEW — 3-col card grid for non-featured isActive campaigns |
| `frontend/src/components/User/Pages/Home.jsx` | **(2026-08-25)** mounted `<OtherCampaigns />` below `<FeaturedCampaign />` |
| `Testing/04.5_Marketing_Content_Management/mkt_fixes_test.js` | **(2026-08-25)** NEW — Playwright post-feedback test (5 sections, 5/5 PASS confirmed twice) |

## Manual Verification (by partner)

See `manual_testing_guide.md` for the 8-test guide the partner will run.
