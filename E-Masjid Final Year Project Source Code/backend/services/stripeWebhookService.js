const stripeLib = require('stripe');
const Donation = require('../models/Donation');
const { isValidObjectId } = require('../middleware/validate');

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
  return stripeLib(key);
}

function verifySignature(req, stripe) {
  const sig = req.headers['stripe-signature'];
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error('Webhook secret is not configured');
  }
  return stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
}

async function handleCheckoutCompleted(session) {
  const meta = session.metadata || {};
  const amount = Number(meta.amount || 0);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Invalid amount in webhook payload');
  }

  const mosqueId = (meta.mosqueId && isValidObjectId(meta.mosqueId)) ? meta.mosqueId : undefined;

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
      ...(mosqueId ? { mosqueId } : {}),
    } },
    { upsert: true }
  );
}

async function processEvent(event) {
  if (event.type === 'checkout.session.completed') {
    await handleCheckoutCompleted(event.data.object);
  }
}

async function handleWebhook(req) {
  const stripe = getStripe();
  let event;
  try {
    event = verifySignature(req, stripe);
  } catch (err) {
    return { verified: false, error: err.message };
  }
  try {
    await processEvent(event);
  } catch (err) {
    console.error('Stripe webhook processing error:', err.message);
  }
  return { verified: true };
}

module.exports = { handleWebhook };
