# 17 Stripe Payments Module — Questions Asked

> **Status:** Step A — answers received 2026-08-25. Proceeding to Step B.
> **Context:** Partner already tested Stripe during donation-module testing and reported it was working. This phase is a **focused re-verification**, not a from-scratch test.
> **Date:** 2026-08-25

---

## Partner Answers

| # | Question | Partner Answer |
|---|---|---|
| Q1 | Re-verification depth | **(C) Code-path + real Stripe calls** — read every file, trace flow, confirm signatures + idempotency, then make real test-mode Stripe API calls |
| Q2 | Test card coverage | **(B) Happy + decline** — test card `4242 4242 4242 4242` for happy path + `4000 0000 0000 0002` for `card_declined` |
| Q3 | Multi-tenant scope check | **(B) Standard + invalid-mosqueId edge case** — include the "what if metadata.mosqueId is invalid/empty" test (potential scope leak flagged in Step A) |
| Q4 | PKR currency test | **(A) Trust the existing test key** — don't re-test PKR explicitly; move on to other checks |

---

## Scope summary (so we're aligned before I ask)

**The Stripe module = 3 surfaces:**

1. **Checkout session creation** — `POST /api/donations/online` → returns `session.url` → user redirected to Stripe
2. **Webhook handler** — `POST /api/donations/webhook` → verifies signature → creates Donation row in DB
3. **Public/admin donation views** — Transparency page, admin donation list, top-donors widget (already tested in Phases 9 + 10, **out of scope for Phase 17** — covered in their own phases)

**Re-verification focus:** Checkout + Webhook end-to-end (test mode, real Stripe API calls), plus multi-tenant scope (per-masjid isolation) and money-handling edge cases.

---

## Questions

### Q1 — Re-verification depth

For the Stripe re-verification, how deep should I go?

- **(A)** Full end-to-end with real Stripe API calls in test mode (test card `4242…` → Checkout → webhook → DB row). ~30 min. **Recommended for FYP defense.**
- **(B)** Code-path verification only (read every file, trace the flow, confirm signatures + idempotency without making real Stripe calls). ~15 min.
- **(C)** Both — code-path first, then real Stripe test-mode calls on top.

### Q2 — Test card coverage

Which Stripe test scenarios should I cover?

- **(A)** Happy path only (test card `4242 4242 4242 4242`). ~10 min.
- **(B)** Happy path + decline path (test card `4000 0000 0000 0002` for card_declined). **Recommended for money code.**
- **(C)** Happy + decline + webhook signature tampering (POST a hand-crafted payload without the right `stripe-signature` header → expect 400).

### Q3 — Multi-tenant scope check

The webhook reads `mosqueId` from Stripe metadata and stores it on the Donation row. For the re-verify, should I confirm:

- **(A)** Donation on Masjid A page → Donation row has `mosqueId: A` → appears on Masjid A's Transparency page only. **Recommended — 2-mosque isolation template.**
- **(B)** Same as (A) + also test what happens if `mosqueId` in metadata is invalid/empty (currently the code falls back to "no mosqueId" — possible scope leak).

### Q4 — Currency edge case

Stripe's PKR support has a quirk: the account's settlement currency must include PKR (or you get `currency_not_supported`). I've seen the test key works locally, but:

- **(A)** Trust that the current test key works and don't re-test PKR. Move on. **Recommended for re-verification.**
- **(B)** Test it explicitly by initiating a Checkout session with `currency: 'pkr'` and confirming Stripe accepts it.

---

## My recommendations (short)

| Q | Recommended |
|---|---|
| Q1 | (C) Both — code-path + real test-mode calls |
| Q2 | (B) Happy + decline |
| Q3 | (B) Include the invalid-mosqueId edge case (potential scope leak I already spotted) |
| Q4 | (A) Trust the existing test key |

---

## Pre-flight notes (no questions, just FYI before I run Step B)

I already read these files and found 1 thing I want to flag in Step C (bugs_found.md), not now:

- `backend/services/stripeWebhookService.js#handleWebhook` swallows processing errors (`console.error(...)` then `return { verified: true }`). If Stripe sends a malformed event (e.g. `metadata.amount = 0`), the webhook returns 200, Stripe thinks it succeeded, and **never retries** — the donation is silently lost. This is a money-loss bug. Will document it in Step C as a bug to fix (after your Step A answers).

Waiting for partner answers on Q1–Q4 before proceeding to Step B.