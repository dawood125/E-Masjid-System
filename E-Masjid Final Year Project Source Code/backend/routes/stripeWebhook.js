const stripeLib = require('stripe');
const Donation = require('../models/Donation');

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
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const meta = session.metadata || {};

      await Donation.create({
        donorName: meta.donorName || 'Online Donor',
        email: meta.email || '',
        phone: meta.phone || '',
        amount: Number(meta.amount || 0),
        type: meta.type || 'Mosque Fund',
        paymentMethod: 'Online',
        isAnonymous: meta.isAnonymous === 'true',
        stripePaymentId: session.payment_intent,
        mosqueId: meta.mosqueId || undefined,
      });
    }
  } catch (err) {
    // If something fails, return 200 so Stripe doesn't retry forever
    console.error('Stripe webhook processing error:', err.message);
  }

  res.json({ received: true });
}

module.exports = { stripeWebhook };

