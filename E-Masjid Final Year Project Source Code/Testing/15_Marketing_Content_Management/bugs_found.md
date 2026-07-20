# 15 Marketing Content Management — Bugs Found

> Phase 4.5 verification: 2026-06-24
> Source: code-path analysis + automated lint/build/test + visual review

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
