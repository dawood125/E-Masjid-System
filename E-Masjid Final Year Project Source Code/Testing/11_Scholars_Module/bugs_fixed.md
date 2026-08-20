# Phase 11 — Scholars Module: bugs fixed

## Fix list

### F1 — Fix `CLIENT_URL` in `backend/.env` to match Vite's port

**Bug:** B1
**Files touched:**
- `backend/.env` (changed
  `CLIENT_URL=http://localhost:5174` →
  `CLIENT_URL=http://localhost:5173`)

**Why:** `backend/server.js` reads `CLIENT_URL` into the
CORS `origin` option. The frontend (`vite.config.js`) is
configured to listen on port 5173, but the env file
pointed CORS at 5174 — so every API call from the browser
was being blocked at the preflight stage. Login forms
never set their tokens; protected pages bounced back to
the community login page.

**Change:**
```diff
- CLIENT_URL=http://localhost:5174
+ CLIENT_URL=http://localhost:5173
```

**Verification:**
- Restart backend (`node server.js` in `backend/`).
- Browser console no longer shows the CORS preflight
  error.
- Playwright: `Auth token persisted after admin login`
  → PASS (token length 191).
- Manual: admin login from `/admin/login` reaches
  `/admin/scholars` correctly.

**Note on staging/prod:** the production deploy uses a
real domain, not `localhost`, so the env value should be
overridden in `.env.production` (or via the hosting
provider's env vars). Out of scope here.

---

## Deferred fixes (not applied)

### B2 — `POST /api/scholars` response missing `tempPassword`

**Status:** Deferred (backend refactor divergence).

The on-disk `backend/routes/scholars.js` includes the
`tempPassword` in the response, but the currently running
backend (started from a controller/service refactor) does
not. Same code in repo, different runtime behavior —
fixing it requires deciding which file is the source of
truth and aligning the other. Tracked for the next
backend cleanup pass.

The frontend (`Scholars.jsx`, line ~97) does have an
`if (res.tempPassword)` branch ready — it just never
fires today. Once the response shape is fixed, the toast
will start showing the temp password to the admin.

### B3 — `AdminLayout` redirects admin to community login

**Status:** Deferred (frontend divergence).

`frontend/src/components/Admin/Layouts/AdminLayout.jsx`
uses `navigate(ROUTES.LOGIN)` (community login) instead of
`navigate(ROUTES.ADMIN_LOGIN)`. Also does not wait for
AuthContext's `loading` to be false before deciding. Fix:

1. Change `ROUTES.LOGIN` → `ROUTES.ADMIN_LOGIN` in the
   guard.
2. Add a `loading` check at the top of the layout:

```js
const { user, isAuthenticated, loading } = useAuth()

useEffect(() => {
  if (loading) return
  if (!isAuthenticated || user?.role !== 'admin') {
    navigate(ROUTES.ADMIN_LOGIN)
  }
}, [isAuthenticated, user, loading, navigate])

if (loading) return <FullPageSpinner />
if (!isAuthenticated || user?.role !== 'admin') return null
```

### B4 — Seeder doesn't include a second masjid

**Status:** Deferred (test-scaffold improvement).

Add a second masjid (`Masjid Al-Rahman`) with its own
admin + scholar + booking so Section 4's cross-mosque
isolation check can actually run. No production impact.
