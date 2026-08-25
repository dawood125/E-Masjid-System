# 21 NFRs Module — Questions Asked

> Step A — 2026-08-25

---

## Scope (confirmed by user)

**Module:** Non-functional requirements audit across all 4 NFR areas.

| NFR area | What we'll audit |
|---|---|
| **Performance** | Slow endpoints, missing indexes, N+1 queries, bundle size, missing compression, missing caching, slow React renders |
| **Security** | JWT handling, CORS, Helmet, rate limiting, input validation, auth bypass, scope leaks, Stripe webhook signatures, XSS |
| **Reliability** | Error handling, DB retry, graceful shutdown, health check, transactions for financial flows, email retry |
| **Usability** | Loading/empty/error states, form feedback, touch targets, contrast, keyboard nav, screen reader support |

## Methodology (confirmed by user)

- **Code audit** — Grep + Read for known anti-patterns across backend + frontend
- **Live API probes** — In-process backend probe (like Phase 18/19) on isolated port
- **Load testing** — `autocannon` on hot endpoints (donations list, transparency page, fund request vote)
- **Live MongoDB data** — Real Atlas DB, with synthetic load via concurrent probe requests

## Test data

- **Production-like data** from live MongoDB (current donations, expenses, fund requests)
- **Load generation** via autocannon (e.g., 50 concurrent connections × 30s on `/api/donations?mosqueId=X`)
- **Synthetic users** for security tests (crafted JWTs, malformed payloads, expired tokens)

## Out of scope (per user rule)

- New features / scope creep
- Refactors beyond the bugs we find
- Performance optimizations that aren't bugs (premature optimization)

---

## What Phase 21 will produce

| File | Purpose |
|---|---|
| `questions_asked.md` | (this file) |
| `bugs_found.md` | All bugs found across 4 NFR areas |
| `bugs_fixed.md` | Fixes applied + verification |
| `my_test_results.md` | Audit results, load test numbers |
| `manual_testing_guide.md` | Manual checks for usability + security |

---

## Approach

Phase 21 is the broadest phase yet (4 NFR areas × every module). Running 4 parallel specialist agents — one per NFR area — so each goes deep. Then synthesis into a single `bugs_found.md` and per-area findings.