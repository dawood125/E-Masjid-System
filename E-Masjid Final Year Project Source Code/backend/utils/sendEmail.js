const nodemailer = require('nodemailer');

function stripMailPassword(raw) {
  if (raw == null || typeof raw !== 'string') return '';
  let s = raw.trim().replace(/^["']|["']$/g, '');
  // Gmail app passwords are often shown with spaces; SMTP uses the 16 chars without spaces
  s = s.replace(/\s+/g, '');
  return s;
}

function resolveFromName() {
  const raw = process.env.MAIL_FROM_NAME || process.env.APP_NAME || 'E-Masjid System';
  return String(raw).replace(/\$\{APP_NAME\}/g, process.env.APP_NAME || 'E-Masjid');
}

/**
 * Supports Laravel-style MAIL_* (Gmail, etc.) and legacy EMAIL_* (Mailtrap).
 * MAIL_* takes precedence when set.
 */
function getTransportOptions() {
  const host = process.env.MAIL_HOST || process.env.EMAIL_HOST;
  const port = Number(process.env.MAIL_PORT || process.env.EMAIL_PORT || 587);
  const user = process.env.MAIL_USERNAME || process.env.EMAIL_USER;
  const pass = stripMailPassword(process.env.MAIL_PASSWORD || process.env.EMAIL_PASS);

  if (!host || !user || !pass) {
    throw new Error(
      'Email is not configured: set MAIL_HOST, MAIL_USERNAME, MAIL_PASSWORD (or EMAIL_HOST, EMAIL_USER, EMAIL_PASS)'
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

const sendEmail = async ({ to, subject, html }) => {
  const fromAddress = process.env.MAIL_FROM_ADDRESS || process.env.EMAIL_FROM;
  const fromName = resolveFromName();
  if (!fromAddress) {
    throw new Error('Set MAIL_FROM_ADDRESS or EMAIL_FROM for outgoing mail');
  }

  const transporter = nodemailer.createTransport(getTransportOptions());

  const mailOptions = {
    from: `"${fromName}" <${fromAddress}>`,
    to,
    subject,
    html,
  };

  return transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
