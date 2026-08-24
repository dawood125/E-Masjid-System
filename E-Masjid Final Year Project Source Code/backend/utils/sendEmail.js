const nodemailer = require('nodemailer');

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
      'SMTP is not configured. Set EMAIL_HOST, EMAIL_USER, EMAIL_PASS in .env'
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

function resolveFromAddress() {
  return process.env.EMAIL_FROM || process.env.EMAIL_USER || null;
}

function resolveFromName() {
  return process.env.EMAIL_FROM_NAME || process.env.APP_NAME || 'E-Masjid System';
}

const sendEmail = async ({ to, subject, html, text, replyTo }) => {
  if (!to) throw new Error('sendEmail: `to` is required');
  if (!subject) throw new Error('sendEmail: `subject` is required');
  if (!html && !text) throw new Error('sendEmail: `html` or `text` is required');

  const fromEmail = resolveFromAddress();
  if (!fromEmail) {
    throw new Error('Set EMAIL_FROM (or EMAIL_USER) in .env for outgoing mail');
  }
  const fromName = resolveFromName();

  const transporter = nodemailer.createTransport(buildSmtpTransportOptions());
  const mail = {
    from: `"${fromName}" <${fromEmail}>`,
    to,
    subject,
    html: html || (text ? `<p>${text}</p>` : undefined),
    text: text || (html ? html.replace(/<[^>]+>/g, '') : undefined),
  };
  if (replyTo) mail.replyTo = replyTo;
  const info = await transporter.sendMail(mail);
  return { provider: 'smtp', messageId: info.messageId, statusCode: 200 };
};

module.exports = sendEmail;
