# 20 Responsive + UI Module — Questions Asked

> Step A — 2026-08-25

---

## Scope

**Module:** Responsive design + UI quality across all roles (public, user, admin, committee, scholar, manager) on mobile (≤640px), tablet (768–1023px), and desktop (≥1024px).

**Per the user's standing rules:**
- "we should not increase features or scope because we already have lot of features for our FYP" — **no new features**, only re-verify what's already there
- "We have to build every feature end to end working perfectly fine" — fix bugs found, don't ship known broken UI
- "test them with all types of testing like a professional QA" — full code-path audit + live probes where possible

---

## Assumptions (proceeding without explicit Q&A to keep the cadence)

Per the master plan workflow, I normally ask 4 questions before each phase (depth, scope, edge cases, data source). The user has been consistent across Phases 17, 18, 19 on these answers. For Phase 20 I am proceeding with the same defaults rather than blocking on questions:

| # | Question | Default | Why |
|---|---|---|---|
| Q1 | How deep should the audit go? | **(C) All public + role-protected pages, every role** | Phase 20 is UI quality, not a single feature. Need full surface area. |
| Q2 | What test methods? | **(D) Code-path audit + viewport screenshots + live API checks for destructive actions** | CSS/responsive issues need code review + actual screenshot at breakpoints. Destructive actions hit the API, so probe them too. |
| Q3 | Which edge cases? | **(D) Mobile + tablet + desktop + tiny viewport (≤360px) + landscape mobile + high-DPI** | Responsive design fails at extremes, not on a typical laptop. |
| Q4 | Test data? | **(D) Live MongoDB + Playwright/Chrome devtools for viewport simulation** | UI quality can't be tested with mocked data — actual layout reflow is the test. |

If any of these defaults are wrong, flag during Step D (review of `bugs_found.md`) and I will re-scope.

---

## What Phase 20 will audit

### 1. Responsive design across breakpoints
- Every page renders without horizontal scroll at 320, 375, 414, 768, 1024, 1280, 1920px widths
- Tables collapse or scroll on mobile
- Sidebars become drawers / hidden behind hamburger on mobile
- Forms stack vertically on mobile (no side-by-side inputs that overflow)
- Modals fit within viewport (no overflow on mobile)
- Hero/marketing pages don't overflow on small screens

### 2. Layout integrity
- Sidebar doesn't overlap content on mobile/tablet
- Headers stay sticky on scroll without breaking
- Modals close properly (backdrop click, Esc key, X button)
- Dropdowns/menus don't overflow viewport edges
- Sticky tables maintain header visibility

### 3. Form behavior
- Required fields show validation errors inline (not just on submit)
- Password fields have show/hide toggle (where missing)
- Date/time pickers work on mobile (no desktop-only widgets)
- Number/amount inputs accept the right keyboard on mobile
- Forms disable submit button during loading (no double-submit)

### 4. Destructive-action confirmation (HIGH priority)
- Delete buttons show a confirmation modal before action
- Deactivate/Activate confirm before mutating state
- Approve/Reject on financial requests confirms the outcome
- Pattern consistency: existing good patterns (Announcements "type title to confirm", Marketing "Are you sure") should be the standard

### 5. Accessibility basics
- Buttons have `aria-label` or visible text (not just icons)
- Form inputs have associated `<label>` elements (not just placeholders)
- Color is not the only signal (errors have text + icon + color)
- Touch targets ≥44px on mobile
- Focus rings visible (not removed by `outline-none` without replacement)

### 6. Empty/loading/error states
- Lists show skeletons or "No items yet" placeholders, not blank pages
- API errors show toast or inline error, not silent failure
- Loading spinners visible on async operations
- Network failures don't leave buttons stuck in "loading" state

### 7. Honest UI (no fake labels — carryover from Phase 19)
- No hardcoded "+12% this month" or other fake trend percentages
- No fake "Active users: 1,234" numbers
- No placeholder images that look real
- No "Coming soon" buttons that go nowhere

---

## Out of scope (intentionally)

Per user's no-scope-creep rule:
- New elderly mode / font-size toggle (no feature creep)
- Dark mode toggle (not in scope)
- Internationalization (i18n) beyond what's there
- New accessibility features beyond fixing existing gaps
- Performance optimization (Phase 21 NFR territory)
- New chart/graph components (only fix broken existing ones)

---

## Methodology

1. **Code-path audit** — Grep + Read for every page, looking for the patterns above
2. **Viewport simulation** — Playwright (already in devDeps) at 5 widths
3. **Live API probe** — destructive actions must hit the real backend to verify scope
4. **Regression check** — existing backend tests + frontend lint must not regress

---

## Files to be created during Phase 20

| File | Purpose |
|---|---|
| `questions_asked.md` | (this file) |
| `bugs_found.md` | Step C — list of bugs found |
| `my_test_results.md` | Step B — audit results |
| `manual_testing_guide.md` | Step F — for the partner |