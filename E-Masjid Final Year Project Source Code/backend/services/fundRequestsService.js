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

function outcomeEmail({ requesterName, amount, category, status, finalNote }) {
  return `
    <div style="font-family: Arial; max-width: 600px; margin: 0 auto;">
      <div style="background: #047857; padding: 20px; text-align: center; color: white;"><h1>E-Masjid System</h1></div>
      <div style="padding: 30px; background: #f9fafb;">
        <h2>Fund Request ${status === 'approved' ? 'Approved ✅' : 'Rejected ❌'}</h2>
        <p>Dear ${sanitizeString(requesterName)},</p>
        <p>Your fund request for <strong>PKR ${Number(amount).toLocaleString()}</strong> (${category}) has been <strong>${status}</strong> by the committee.</p>
        <p><strong>Committee Note:</strong> ${sanitizeString(finalNote || '')}</p>
        ${status === 'approved' ? '<p>Please visit the mosque office to collect your assistance.</p>' : ''}
      </div>
    </div>
  `;
}

async function notifyCommittee(request, html) {
  try {
    const members = await User.find({ role: 'committee', isActive: true, mosqueId: request.mosqueId });
    console.log(`[notifyCommittee] request=${request._id} mosqueId=${request.mosqueId} members=${members.length} emails=${members.map((m) => m.email).join(',')}`);
    const sends = members.map((m) => sendEmail({
      to: m.email,
      subject: `New Fund Request - ${request.category}`,
      html,
      replyTo: process.env.COMMITTEE_REPLY_TO || undefined,
    }));
    const results = await Promise.allSettled(sends);
    const ok = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected');
    console.log(`[notifyCommittee] sent=${ok} failed=${failed.length}`);
    failed.forEach((f, idx) => {
      console.error(`[notifyCommittee] #${idx + 1} send failed:`, f.reason && f.reason.message ? f.reason.message : f.reason);
    });
  } catch (err) {
    console.error('[notifyCommittee] dispatch error:', err.message);
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
        finalNote: request.finalNote,
      }),
    });
  } catch (err) {
    console.error('Failed to send requester notification:', err.message);
  }
}

async function create(input, user) {
  if (input.mosqueId && isValidObjectId(input.mosqueId) && String(input.mosqueId) !== String(user.mosqueId)) {
    throw httpError(400, 'Cannot create a request for another mosque');
  }
  const mosqueId = user.mosqueId;
  if (!mosqueId) throw httpError(400, 'mosqueId is required');

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
    .populate('finalizedBy', 'name')
    .populate('votes.member', 'name email')
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
    finalNote: request.finalNote || request.reviewNote,
  });

  return request;
}

async function castVote(id, body, user) {
  if (!isValidObjectId(id)) throw httpError(400, 'Invalid request id');
  if (user.role !== 'committee') throw httpError(403, 'Only committee members can vote');

  const { vote, note } = body;
  if (!['approve', 'reject'].includes(vote)) throw httpError(400, 'vote must be approve or reject');

  const existing = await FundRequest.findById(id);
  if (!existing) throw httpError(404, 'Request not found');
  if (String(existing.mosqueId) !== String(user.mosqueId)) {
    throw httpError(403, 'Not authorized for this mosque request');
  }
  if (existing.status !== 'pending') {
    throw httpError(409, `Request is already ${existing.status}; cannot vote`);
  }

  const newVote = {
    member: user._id,
    vote,
    note: sanitizeString(note || ''),
    votedAt: new Date(),
  };

  const others = (existing.votes || []).filter((v) => String(v.member) !== String(user._id));
  const updated = await FundRequest.findOneAndUpdate(
    { _id: id, status: 'pending' },
    { $set: { votes: [...others, newVote] } },
    { new: true }
  );

  if (!updated) throw httpError(409, 'Request is no longer pending; cannot vote');

  return FundRequest.findById(id)
    .populate('reviewedBy', 'name')
    .populate('finalizedBy', 'name')
    .populate('votes.member', 'name email');
}

async function tally(votes) {
  let approve = 0;
  let reject = 0;
  (votes || []).forEach((v) => {
    if (v.vote === 'approve') approve += 1;
    else if (v.vote === 'reject') reject += 1;
  });
  return { approve, reject, total: approve + reject };
}

async function finalize(id, body, user) {
  if (!isValidObjectId(id)) throw httpError(400, 'Invalid request id');
  if (user.role !== 'admin') throw httpError(403, 'Only admin can finalize a fund request');

  const existing = await FundRequest.findById(id);
  if (!existing) throw httpError(404, 'Request not found');
  if (String(existing.mosqueId) !== String(user.mosqueId)) {
    throw httpError(403, 'Not authorized for this mosque request');
  }
  if (existing.status !== 'pending') {
    throw httpError(409, `Request is already ${existing.status}; cannot finalize`);
  }

  const { approve, reject } = await tally(existing.votes);
  if (approve + reject === 0) {
    throw httpError(400, 'No committee votes recorded yet; cannot finalize');
  }

  let status;
  if (approve > reject) status = 'approved';
  else if (reject > approve) status = 'rejected';
  else status = body.overrideStatus === 'approved' || body.overrideStatus === 'rejected'
    ? body.overrideStatus
    : null;

  if (!status) {
    throw httpError(409, 'Votes are tied; admin must provide overrideStatus of approved or rejected');
  }

  const finalNote = sanitizeString(body.finalNote || '');

  const updated = await FundRequest.findOneAndUpdate(
    { _id: id, status: 'pending' },
    {
      $set: {
        status,
        finalizedBy: user._id,
        finalizedAt: new Date(),
        finalNote,
      },
    },
    { new: true }
  );

  if (!updated) throw httpError(409, 'Request is already finalized');

  const populated = await FundRequest.findById(id)
    .populate('reviewedBy', 'name')
    .populate('finalizedBy', 'name')
    .populate('votes.member', 'name email');

  await notifyRequester(populated);

  return populated;
}

module.exports = { create, listForCaller, review, castVote, finalize, tally };