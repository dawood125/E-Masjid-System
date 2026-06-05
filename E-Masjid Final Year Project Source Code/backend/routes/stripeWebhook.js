const stripeLib = require('stripe');
const Donation = require('../models/Donation');
const { isValidObjectId } = require('../middleware/validate');

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
  return stripeLib(key);
}

// Stripe webhook handler (expects express.raw body)
async function stripeWebhook(req, res) {
  const stripe = getStripe();
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      return res.status(500).json({ success: false, message: 'Webhook secret is not configured' });
    }
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).json({ success: false, message: `Webhook Error: ${err.message}` });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const meta = session.metadata || {};
      const amount = Number(meta.amount || 0);
      if (!Number.isFinite(amount) || amount <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid amount in webhook payload' });
      }

      await Donation.updateOne(
        { stripePaymentId: session.payment_intent },
        { $setOnInsert: {
        donorName: meta.donorName || 'Online Donor',
        email: meta.email || '',
        phone: meta.phone || '',
        amount,
        type: meta.type || 'Masjid Fund',
        paymentMethod: 'Online',
        isAnonymous: meta.isAnonymous === 'true',
        stripePaymentId: session.payment_intent,
        mosqueId: (meta.mosqueId && isValidObjectId(meta.mosqueId)) ? meta.mosqueId : undefined,
        } },
        { upsert: true }
      );
    }
  } catch (err) {
    // If something fails, return 200 so Stripe doesn't retry forever
    console.error('Stripe webhook processing error:', err.message);
  }

  res.json({ received: true });
}

module.exports = { stripeWebhook };

