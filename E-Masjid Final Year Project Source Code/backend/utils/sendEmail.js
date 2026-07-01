/**
 * E-Masjid email sender.
 *
 * Default provider: SendGrid (https://sendgrid.com) — 100 emails/day free forever,
 * reliable, real Gmail delivery to the recipient. We use the official
 * @sendgrid/mail SDK and the HTTP API (no SMTP, no Nodemailer for SendGrid).
 *
 * Fallback provider: Nodemailer / SMTP — used only if SendGrid is not configured
 * (e.g. local dev sandbox via Mailtrap, or Gmail SMTP). Set EMAIL_PROVIDER=smtp
 * to force the SMTP path, or EMAIL_PROVIDER=sendgrid to force SendGrid.
 *
 * If EMAIL_PROVIDER is unset, we auto-detect: SendGrid if SENDGRID_API_KEY is set,
 * else SMTP if EMAIL_HOST/EMAIL_USER/EMAIL_PASS is set.
 */

const sgMail = require('@sendgrid/mail');
const nodemailer = require('nodemailer');

function resolveProvider() {
  const forced = (process.env.EMAIL_PROVIDER || '').toLowerCase();
  if (forced === 'sendgrid') return 'sendgrid';
  if (forced === 'smtp' || forced === 'nodemailer') return 'smtp';
  if (process.env.SENDGRID_API_KEY) return 'sendgrid';
  if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) return 'smtp';
  throw new Error(
    'Email is not configured. Set SENDGRID_API_KEY + SENDGRID_FROM_EMAIL, ' +
    'or EMAIL_HOST + EMAIL_USER + EMAIL_PASS for SMTP.'
  );
}

function resolveFromAddress() {
  return (
    process.env.SENDGRID_FROM_EMAIL ||
    process.env.EMAIL_FROM ||
    process.env.MAIL_FROM_ADDRESS ||
    null
  );
}

function resolveFromName() {
  return (
    process.env.SENDGRID_FROM_NAME ||
    process.env.EMAIL_FROM_NAME ||
    process.env.MAIL_FROM_NAME ||
    process.env.APP_NAME ||
    'E-Masjid System'
  );
}

// ─── SendGrid provider ─────────────────────────────────────────────
function buildSendGridOptions({ to, subject, html, text }) {
  const fromEmail = resolveFromAddress();
  const fromName = resolveFromName();
  if (!fromEmail) {
    throw new Error('Set SENDGRID_FROM_EMAIL (or EMAIL_FROM) for outgoing mail');
  }
  return {
    to,
    from: { email: fromEmail, name: fromName },
    subject,
    html: html || (text ? `<p>${text}</p>` : undefined),
    text: text || (html ? html.replace(/<[^>]+>/g, '') : undefined),
  };
}

async function sendViaSendGrid({ to, subject, html, text }) {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    throw new Error('SENDGRID_API_KEY is not set');
  }
  sgMail.setApiKey(apiKey);
  const msg = buildSendGridOptions({ to, subject, html, text });
  const [response] = await sgMail.send(msg);
  return { provider: 'sendgrid', messageId: response.headers['x-message-id'] || null, statusCode: response.statusCode };
}

// ─── SMTP / Nodemailer provider (Mailtrap, Gmail, generic) ──────────
function stripMailPassword(raw) {
  if (raw == null || typeof raw !== 'string') return '';
  return raw.trim().replace(/^["']|["']$/g, '').replace(/\s+/g, '');
}

function buildSmtpTransportOptions() {
  const host = process.env.EMAIL_HOST;
  const port = Number(process.env.EMAIL_PORT || 587);
  const user = process.env.EMAIL_USER;
  const pass = stripMailPassword(process.env.EMAIL_PASS);

  if (!host || !user || !pass) {
    throw new Error(
      'SMTP is not configured: set EMAIL_HOST, EMAIL_USER, EMAIL_PASS'
    );
  }
  const secure = port === 465;
  return {
    host,
    port: Number.isFinite(port) && port > 0 ? port : 587,
    secure,
    auth: { user, pass },
    ...(!secure && port === 587 ? { requireTLS: true } : {}),
  };
}

async function sendViaSmtp({ to, subject, html }) {
  const fromEmail = resolveFromAddress();
  const fromName = resolveFromName();
  if (!fromEmail) {
    throw new Error('Set SENDGRID_FROM_EMAIL or EMAIL_FROM for outgoing mail');
  }
  const transporter = nodemailer.createTransport(buildSmtpTransportOptions());
  const info = await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to,
    subject,
    html,
  });
  return { provider: 'smtp', messageId: info.messageId, statusCode: 200 };
}

// ─── Public API ────────────────────────────────────────────────────
const sendEmail = async ({ to, subject, html, text }) => {
  if (!to) throw new Error('sendEmail: `to` is required');
  if (!subject) throw new Error('sendEmail: `subject` is required');
  if (!html && !text) throw new Error('sendEmail: `html` or `text` is required');

  const provider = resolveProvider();
  if (provider === 'sendgrid') {
    return sendViaSendGrid({ to, subject, html, text });
  }
  return sendViaSmtp({ to, subject, html });
};

module.exports = sendEmail;
