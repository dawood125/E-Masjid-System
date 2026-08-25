# 16 Manager Multi-Mosque Module — questions asked

**Status:** Awaiting client answers (Step A complete; Step B will start after answers).
**Started:** 2026-08-25.

Before writing the automated test, I mapped the existing Manager code so the questions below are concrete, not abstract. Here is what is already in place (no code changes yet):

**Backend**
- `backend/models/Mosque.js` — fields: `name, address, city, phone, email, image, managerId, admins[], isActive, timestamps`. **No module-toggle / feature-flag field.**
- `backend/routes/mosques.js` + `backend/services/mosquesService.js` — public `GET /api/mosques/public`, `GET /api/mosques/search`; manager-only `GET / POST / PUT` (no DELETE endpoint).
- `backend/routes/superAdmin.js` — `GET /api/super-admin/mosques`, `GET /api/super-admin/admins`, `POST /api/super-admin/mosques/:mosqueId/admin`, `POST /api/super-admin/users`, `GET /api/super-admin/users`.
- `backend/services/scopeService.js` — `getManagedMosqueIds`, `resolveScope`, `findManagedMosqueOrThrow` (already power every other mosque-scoped module).

**Frontend**
- `frontend/src/components/Manager/Layouts/ManagerLayout.jsx` — sidebar with Dashboard, Manage Mosques, Manage Admins; route-guard on `user.role === 'manager'`.
- `frontend/src/components/Manager/Pages/ManagerLogin.jsx` — separate manager login page (uses `useForceLogoutOnMount`).
- `frontend/src/components/Manager/Pages/Dashboard.jsx` — total + active masjid counts, card grid.
- `frontend/src/components/Manager/Pages/Mosques.jsx` — create masjid (name/city required), edit, toggle isActive, inline "Add Admin" modal showing generated password. After creating a new masjid it auto-opens the admin modal so you can onboard the first admin immediately.
- `frontend/src/components/Manager/Pages/Admins.jsx` — read-only table of all admins across managed masjids, search + masjid filter.

**Seed**
- `manager@emasjid.pk` (manages all 4 masjids) + `pa672189@gmail.com` (orphan manager — 0 masjids, used to exercise the empty-masjid error path).

---

## The 5 questions

### Q1. Module-toggle / per-masjid feature flags — in scope or out?

The current `Mosque` model has no `enabledModules` / feature-flag field — every masjid has all modules by default. The original Phase 16 line in the master plan said "Manager create mosque + module toggle + admin-per-mosque". **Is the module-toggle part actually being built**, or should I treat Phase 16 as only the "create mosque + admin-per-mosque" pieces that already exist?

### Q2. Can the manager **delete** a masjid?

There is no `DELETE /api/mosques/:id` route and no delete button on the Manage Mosques page. Today the only way to "remove" a masjid is `isActive: false` via the Active/Inactive pill. **Is that intentional?** If yes, I'll test the toggle thoroughly (does an inactive masjid still appear in public lists? does the navbar dropdown hide it? do admins of an inactive masjid get blocked from login?). If no, I'll add a soft-delete with confirmation.

### Q3. When the manager creates a new masjid, should it be auto-published to the public homepage?

Today `POST /api/mosques` stores `isActive: true` by default (the React form passes `isActive: true` in `handleCreateMosque`). That means a brand-new masjid becomes immediately visible on `GET /api/mosques/public` and in the homepage navbar dropdown. **Is that the right behaviour for a production-style platform**, or should newly-created masjids start as `isActive: false` so the manager can finish configuration (logo, admins, content) before publishing them? (My recommendation: default to `false` and require the manager to flip the toggle to publish.)

### Q4. Should the manager be able to create **scholar / committee / community** accounts scoped to a specific masjid from the same flow?

`POST /api/super-admin/users` already accepts `role: admin|scholar|committee` and a `mosqueId`, and `getSuperAdminUsers(role)` already filters by role. But the Manager UI only ever calls `createSuperAdminAdmin` (admin only) and `getSuperAdminAdmins` (admins only). **Is the scholar/committee/community creation from the manager panel also in scope for Phase 16**, or should those remain admin-only?

### Q5. What does the manager dashboard need to show besides mosque count?

The current `Dashboard.jsx` shows only two stat cards (Total Mosques, Active Mosques) plus the card grid. **Do you want me to add the same cross-tenant reports / counts that the admin dashboard has** (e.g. total donations across all masjids, total admins, pending fund requests, recent activity)? Or keep it minimal — the manager's job is to manage masjids + admins, not to do reporting? (I lean minimal: more reports = more scope creep, and the admin dashboard already gives per-masjid detail.)

---

**Reply format:** please answer Q1–Q5 in any form (1 line each is fine). Once I have your answers I'll move to Step B (automated test) without asking further questions unless I find something genuinely ambiguous while testing.
