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

async function findDonationForSession(session) {
  const donationId = session.metadata && session.metadata.donationId;
  if (donationId && isValidObjectId(donationId)) {
    const existing = await Donation.findById(donationId);
    if (existing) return existing;
  }
  if (session.id) {
    const bySession = await Donation.findOne({ stripeSessionId: session.id });
    if (bySession) return bySession;
  }
  if (session.payment_intent) {
    const byPayment = await Donation.findOne({ stripePaymentId: session.payment_intent });
    if (byPayment) return byPayment;
  }
  return null;
}

async function handleCheckoutCompleted(session) {
  const meta = session.metadata || {};
  const amount = Number(meta.amount || 0);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Invalid amount in webhook payload');
  }
  const mosqueId = (meta.mosqueId && isValidObjectId(meta.mosqueId)) ? meta.mosqueId : undefined;

  const existing = await findDonationForSession(session);
  if (existing) {
    existing.status = 'completed';
    existing.stripeSessionId = session.id;
    if (session.payment_intent) existing.stripePaymentId = session.payment_intent;
    if (session.amount_total && Number.isFinite(session.amount_total)) {
      existing.amount = session.amount_total / 100;
    }
    if (mosqueId) existing.mosqueId = mosqueId;
    await existing.save();
    return existing;
  }

  const created = await Donation.create({
    donorName: meta.donorName || 'Online Donor',
    email: meta.email || '',
    phone: meta.phone || '',
    amount,
    type: meta.type || 'Masjid Fund',
    paymentMethod: 'Online',
    isAnonymous: meta.isAnonymous === 'true',
    status: 'completed',
    stripeSessionId: session.id,
    stripePaymentId: session.payment_intent || undefined,
    ...(mosqueId ? { mosqueId } : {}),
  });
  return created;
}

async function handleChargeRefunded(charge) {
  const paymentIntent = charge.payment_intent;
  const refundedAmount = typeof charge.amount_refunded === 'number' ? charge.amount_refunded / 100 : 0;
  const query = paymentIntent
    ? { stripePaymentId: paymentIntent }
    : { stripeChargeId: charge.id };
  const donation = await Donation.findOne(query);
  if (!donation) {
    console.warn(`[stripe-webhook] refund received but no donation found for charge ${charge.id}`);
    return null;
  }
  donation.status = 'refunded';
  donation.stripeChargeId = charge.id;
  if (charge.refunds && charge.refunds.data && charge.refunds.data.length) {
    donation.stripeRefundId = charge.refunds.data[0].id;
  }
  donation.refundedAmount = refundedAmount;
  await donation.save();
  return donation;
}

async function handlePaymentFailed(paymentIntent) {
  const donation = await Donation.findOne({ stripePaymentId: paymentIntent.id });
  if (!donation) return null;
  donation.status = 'failed';
  donation.stripePaymentId = paymentIntent.id;
  await donation.save();
  return donation;
}

async function processEvent(event) {
  switch (event.type) {
    case 'checkout.session.completed':
      return handleCheckoutCompleted(event.data.object);
    case 'charge.refunded':
      return handleChargeRefunded(event.data.object);
    case 'payment_intent.payment_failed':
      return handlePaymentFailed(event.data.object);
    default:
      return null;
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
    console.error(`[stripe-webhook] error processing ${event.type}: ${err.message}`);
    return { verified: true, processed: false, error: err.message };
  }
  return { verified: true, processed: true };
}

module.exports = { handleWebhook, processEvent };