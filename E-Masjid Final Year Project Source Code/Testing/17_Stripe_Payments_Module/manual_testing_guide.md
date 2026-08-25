# 17 Stripe Payments Module — Manual Testing Guide

> **For the project partner / FYP examiner.** No technical knowledge required. All tests run in the browser using real Stripe test cards. Estimated time: ~20 minutes.

**Test environment setup:**
- Backend running on `http://localhost:5000`
- Frontend running on `http://localhost:5174`
- Stripe is in **TEST mode** — no real money moves. You can use the test cards below freely.

---

## Test 1 — Happy path: donation succeeds (5 min)

**What we're testing:** A donor picks a masjid, enters details, pays with a valid test card, lands back on the site, and sees a "JazakAllah Khair!" confirmation.

### Steps

1. Open `http://localhost:5174` in your browser.
2. Click the **"Services"** dropdown in the top navigation, then **"Donate"**.
3. In the navbar, **pick a masjid** (e.g. **Masjid Al-Noor**) from the masjid dropdown at the top.
4. On the donation form:
   - **Type:** Sadaqah (already selected)
   - **Amount:** Click the **PKR 1,000** preset button (or type any amount ≥ PKR 100)
   - **Full Name:** type `Test Donor`
   - **Phone Number:** type `03001234567`
   - **Email:** type `testdonor@example.com`
   - **Leave "Donate Anonymously" unchecked**
5. Click **"Donate PKR 1,000"**.
6. You will be redirected to **Stripe's hosted checkout page** (URL starts with `https://checkout.stripe.com/`).

### Stripe test card details

On the Stripe checkout page, fill in:
- **Card number:** `4242 4242 4242 4242`
- **Expiry:** any future date (e.g. `12/30`)
- **CVC:** any 3 digits (e.g. `123`)
- **ZIP / Postcode:** any 5 digits (e.g. `12345`)
- **Name on card:** any name

7. Click **"Pay PKR 1,000"** (or whatever amount).

### Expected result

- Stripe shows a "Payment successful" green confirmation.
- You're redirected back to `http://localhost:5174/donate?success=1`.
- A green popup appears saying **"JazakAllah Khair!"**.
- The transaction ID shows **"Stripe Payment Completed"**.

### Verification

8. Open a new tab and go to `http://localhost:5174/transparency`.
9. Scroll to the **Donations** table.
10. **You should see your test donation in the list** with:
    - Donor Name: `Test Donor`
    - Amount: `PKR 1,000`
    - Type: `Sadaqah`
    - Payment Method: `Online`
    - Date: today

✅ **Pass:** Donation appears in the transparency report within a few seconds.

❌ **Fail:** Donation doesn't appear OR appears with wrong masjid → flag for dev investigation.

---

## Test 2 — Decline path: declined card does not create a donation (3 min)

**What we're testing:** If the donor's card is declined, no Donation row is created and the user sees a "canceled" toast.

### Steps

1. Repeat Steps 1-5 from Test 1 (go to `/donate`, pick masjid, fill form, click Donate).
2. On the Stripe checkout page, use the **declined test card**:
   - **Card number:** `4000 0000 0000 0002` (this card is auto-declined by Stripe in test mode)
   - **Expiry / CVC / ZIP:** anything
3. Click **"Pay"**.
4. Stripe shows a red error: **"Your card was declined."**

### Expected result

- You're NOT redirected back to `/donate?success=1`.
- You stay on the Stripe checkout page (or Stripe shows an error).
- If you manually go back to `/donate`, no "JazakAllah Khair!" popup appears.

### Verification

5. Go to `http://localhost:5174/transparency`.
6. **No donation should appear** from this test attempt (since the card was declined, Stripe never fired the webhook).

✅ **Pass:** No donation appears.

❌ **Fail:** A donation DOES appear → money-loss bug, flag immediately.

---

## Test 3 — Anonymous donation: name is masked on public list (2 min)

**What we're testing:** When the donor checks "Donate Anonymously", their name is hidden on the public Transparency page (but still visible to admins).

### Steps

1. Repeat Steps 1-4 from Test 1, but this time **check the "Donate Anonymously" checkbox**.
2. Fill donor name as `Secret Donor`.
3. Click **"Donate PKR 1,000"**.
4. Use the happy-path card `4242 4242 4242 4242` on Stripe checkout.
5. After payment, you're redirected back.

### Expected result

- The success popup appears.
- Go to `http://localhost:5174/transparency`.
- In the donations list, find your donation. It should show:
  - Donor Name: **`Anonymous`** (not `Secret Donor`)
  - Email: **(empty)**
  - Phone: **(empty)**

✅ **Pass:** Name/email/phone are masked as "Anonymous" + blank.

❌ **Fail:** Real name `Secret Donor` is visible → privacy bug, flag immediately.

### Verify admin still sees the real name

6. Log in as an admin (e.g. `admin@emasjid.pk` / `admin123`).
7. Go to the admin dashboard → Donations list.
8. **Admin should see the real name `Secret Donor`** (admins need it for receipts/audits).

✅ **Pass:** Admin sees real name.

❌ **Fail:** Admin also sees "Anonymous" → over-masking, admins can't trace donations.

---

## Test 4 — Multi-mosque isolation: donate on Masjid A, doesn't show on Masjid B (5 min)

**What we're testing:** A donation made on Masjid Al-Noor's Transparency page should ONLY appear on Masjid Al-Noor's list. Switching the masjid dropdown should change the visible donations.

### Steps

1. Open `http://localhost:5174` and click the **masjid dropdown** at the top.
2. Pick **Masjid Al-Noor**. Note the list of recent donations.
3. Repeat Test 1 (happy path) to donate PKR 1,000 on Al-Noor.
4. After success, return to `/transparency`.
5. **Confirm Masjid Al-Noor is still selected** in the dropdown.
6. **Verify your new donation appears** in the donations list.
7. Now switch the dropdown to **Masjid Al-Rahman**.
8. The donations list reloads — **your donation should NOT be in this list** (it belongs to Al-Noor, not Al-Rahman).

✅ **Pass:** Your donation appears only when Al-Noor is selected, disappears when Al-Rahman is selected.

❌ **Fail:** Donation appears on both masjids' lists → cross-masjid scope leak, flag immediately.

---

## Test 5 — Idempotency (admin-only check): replay the same webhook = only 1 donation (advanced, optional)

**What we're testing:** If Stripe accidentally re-delivers the same webhook event (it does this for retries), only one Donation row should be created.

This test is technical and requires DB access. **Skip this if you don't have MongoDB Compass or mongosh installed.**

### Steps

1. Open a terminal and run:
   ```
   mongosh "mongodb+srv://YOUR_URI/emasjid"
   ```
2. Find the `_id` of your test donation from Test 1:
   ```
   db.donations.find({donorName: "Test Donor"}).sort({createdAt: -1}).limit(1)
   ```
3. Note its `stripePaymentId` (e.g. `pi_3Qxxxxxxxxxxxxxx`).
4. Ask the developer to manually re-fire the Stripe webhook for that event (or use the Stripe Dashboard → Developers → Webhooks → click an event → "Resend").

### Expected result

- Only ONE Donation row with that `stripePaymentId` exists in the DB (not two).

✅ **Pass:** No duplicate donation.

❌ **Fail:** Two donations with the same `stripePaymentId` → duplicate-charge bug, flag immediately.

---

## What to look out for

| Symptom | Likely cause | What to do |
|---|---|---|
| Donate button is disabled | No masjid selected in dropdown | Pick a masjid first |
| Stripe checkout shows "Your card was declined" | You used card `4000 0000 0000 0002` instead of `4242 4242 4242 4242` | Use the happy-path card |
| Donation doesn't appear in Transparency list | Webhook didn't fire (check Stripe Dashboard → Webhooks) | Screenshot and report |
| "Anonymous" name shows the real name | Privacy bug — flag immediately | High severity |
| Donation appears on wrong masjid | Multi-tenant scope leak — flag immediately | Critical severity |
| Popup says "Failed to process donation" | Network error or backend down | Check `localhost:5000` is running |

---

## Reporting

When you've run the tests, report back:

- ✅ All passed → move on to next phase
- ❌ One or more failed → describe what you saw (screenshot if possible), what you expected, and the masjid/amount/card you used

The developer will investigate any failures.