const FundRequest = require('../models/FundRequest');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const { sanitizeString, isValidObjectId } = require('../middleware/validate');
const httpError = require('../middleware/httpError');

function newRequestEmail({ requesterName, category, amount, reason }) {
  return `
    <div style="font-family: Arial; max-width: 600px; margin: 0 auto;">
      <div style="background: #047857; padding: 20px; text-align: center; color: white;"><h1>E-Masjid System</h1></div>
      <div style="padding: 30px; background: #f9fafb;">
        <h2>New Fund Request</h2>
        <p><strong>Requester:</strong> ${sanitizeString(requesterName)}</p>
        <p><strong>Category:</strong> ${sanitizeString(category)}</p>
        <p><strong>Amount:</strong> PKR ${Number(amount).toLocaleString()}</p>
        <p><strong>Reason:</strong> ${sanitizeString(reason)}</p>
        <a href="${process.env.CLIENT_URL}/committee" style="display: inline-block; padding: 12px 24px; background: #047857; color: white; text-decoration: none; border-radius: 8px; margin-top: 16px;">Review Request</a>
      </div>
    </div>
  `;
}

function outcomeEmail({ requesterName, amount, category, status, reviewNote }) {
  return `
    <div style="font-family: Arial; max-width: 600px; margin: 0 auto;">
      <div style="background: #047857; padding: 20px; text-align: center; color: white;"><h1>E-Masjid System</h1></div>
      <div style="padding: 30px; background: #f9fafb;">
        <h2>Fund Request ${status === 'approved' ? 'Approved ✅' : 'Rejected ❌'}</h2>
        <p>Dear ${sanitizeString(requesterName)},</p>
        <p>Your fund request for <strong>PKR ${Number(amount).toLocaleString()}</strong> (${category}) has been <strong>${status}</strong>.</p>
        <p><strong>Committee Note:</strong> ${sanitizeString(reviewNote)}</p>
        ${status === 'approved' ? '<p>Please visit the mosque office to collect your assistance.</p>' : ''}
      </div>
    </div>
  `;
}

async function notifyCommittee(request, html) {
  try {
    const members = await User.find({ role: 'committee', isActive: true, mosqueId: request.mosqueId });
    const sends = members.map((m) => sendEmail({
      to: m.email,
      subject: `New Fund Request - ${request.category}`,
      html,
    }));
    await Promise.allSettled(sends);
  } catch (err) {
    console.error('Failed to send committee notification emails:', err.message);
  }
}

async function notifyRequester(request) {
  try {
    await sendEmail({
      to: request.requesterEmail,
      subject: `Fund Request ${request.status === 'approved' ? 'Approved' : 'Rejected'} - E-Masjid`,
      html: outcomeEmail({
        requesterName: request.requesterName,
        amount: request.amount,
        category: request.category,
        status: request.status,
        reviewNote: request.reviewNote,
      }),
    });
  } catch (err) {
    console.error('Failed to send requester notification:', err.message);
  }
}

async function create(input, user) {
  const mosqueId = input.mosqueId || user.mosqueId;
  if (!mosqueId) throw httpError(400, 'mosqueId is required');
  if (!isValidObjectId(mosqueId)) throw httpError(400, 'Invalid mosqueId');

  const request = await FundRequest.create({
    ...input,
    requesterName: sanitizeString(input.requesterName),
    requesterEmail: sanitizeString(input.requesterEmail).toLowerCase(),
    requesterPhone: sanitizeString(input.requesterPhone),
    reason: sanitizeString(input.reason),
    userId: user._id,
    mosqueId,
  });

  await notifyCommittee(request, newRequestEmail({
    requesterName: request.requesterName,
    category: request.category,
    amount: request.amount,
    reason: request.reason,
  }));

  return request;
}

async function listForCaller(user, statusFilter) {
  let query = {};
  if (user.role === 'community') query.userId = user._id;
  if (user.role === 'committee' || user.role === 'admin' || user.role === 'scholar') {
    query.mosqueId = user.mosqueId;
  }
  if (statusFilter && statusFilter !== 'all') query.status = statusFilter;
  return FundRequest.find(query)
    .populate('reviewedBy', 'name')
    .sort({ createdAt: -1 });
}

async function review(id, body, user) {
  if (!isValidObjectId(id)) throw httpError(400, 'Invalid request id');

  const { status, reviewNote } = body;
  if (!['approved', 'rejected'].includes(status)) throw httpError(400, 'Status must be approved or rejected');
  if (!reviewNote) throw httpError(400, 'Review note is required');

  const existing = await FundRequest.findById(id);
  if (!existing) throw httpError(404, 'Request not found');
  if (String(existing.mosqueId) !== String(user.mosqueId)) {
    throw httpError(403, 'Not authorized for this mosque request');
  }

  const request = await FundRequest.findByIdAndUpdate(
    id,
    { status, reviewNote, reviewedBy: user._id },
    { new: true }
  ).populate('reviewedBy', 'name');

  if (!request) throw httpError(404, 'Request not found');

  await notifyRequester({
    requesterName: request.requesterName,
    requesterEmail: request.requesterEmail,
    amount: request.amount,
    category: request.category,
    status: request.status,
    reviewNote: request.reviewNote,
  });

  return request;
}

module.exports = { create, listForCaller, review };
