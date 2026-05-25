# Stripe E2E Verification Proof

Use this file to capture final proof for viva/demo that Stripe online donations work end-to-end in test mode.

## Preconditions

- Backend running with valid `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`
- Frontend running and connected to backend
- Stripe CLI installed

## Verification Run

- Date:
- Tester:
- Backend URL:
- Frontend URL:

### 1) Webhook Forwarding

Command used:

```bash
stripe listen --forward-to http://localhost:5000/api/donations/webhook
```

Observed webhook secret used in `.env`:

- `whsec_...`

### 2) Checkout Flow

- Donation amount entered:
- Donor type (`anonymous` / named):
- Payment method: Stripe test card
- Test card used:

Expected:

- Checkout session opens
- Payment succeeds
- Redirect returns to frontend success state

Actual:

- PASS / FAIL
- Notes:

### 3) Webhook + Database Confirmation

Expected:

- Webhook log shows successful `checkout.session.completed`
- Donation record stored with paid status / stripe payment id
- Donation appears in admin donations view and transparency/public listing (as applicable)

Actual:

- PASS / FAIL
- Webhook logs summary:
- Admin UI confirmation:
- DB/API confirmation:

## Final Result

- Stripe E2E test status: PASS / FAIL
- If fail, issue summary:
- Follow-up action owner:
