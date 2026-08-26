const svc = require('../services/stripeWebhookService');

async function stripeWebhook(req, res, next) {
  try {
    const result = await svc.handleWebhook(req);
    if (!result.verified) {
      return res.status(400).json({ success: false, message: `Webhook Error: ${result.error}` });
    }
    if (result.processed === false) {
      return res.status(500).json({ success: false, message: `Webhook processing failed: ${result.error || 'unknown error'}` });
    }
    res.json({ received: true });
  } catch (e) { next(e); }
}

module.exports = { stripeWebhook };
