# 15 Marketing Content Management — Bugs Fixed

> Phase 4.5 fixes applied 2026-06-24.

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
