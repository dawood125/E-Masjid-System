const express = require('express');
const router = express.Router();
const FundRequest = require('../models/FundRequest');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const { protect, authorize } = require('../middleware/auth');

// POST /api/fund-requests - Submit a fund request (community member)
router.post('/', protect, async (req, res, next) => {
  try {
    const request = await FundRequest.create({
      ...req.body,
      userId: req.user._id,
    });

    // Notify committee members via email
    try {
      const committeeMembers = await User.find({ role: 'committee', isActive: true });
      const emailPromises = committeeMembers.map((member) =>
        sendEmail({
          to: member.email,
          subject: `New Fund Request - ${req.body.category}`,
          html: `
            <div style="font-family: Arial; max-width: 600px; margin: 0 auto;">
              <div style="background: #047857; padding: 20px; text-align: center; color: white;"><h1>E-Masjid System</h1></div>
              <div style="padding: 30px; background: #f9fafb;">
                <h2>New Fund Request</h2>
                <p><strong>Requester:</strong> ${req.body.requesterName}</p>
                <p><strong>Category:</strong> ${req.body.category}</p>
                <p><strong>Amount:</strong> PKR ${req.body.amount?.toLocaleString()}</p>
                <p><strong>Reason:</strong> ${req.body.reason}</p>
                <a href="${process.env.CLIENT_URL}/committee" style="display: inline-block; padding: 12px 24px; background: #047857; color: white; text-decoration: none; border-radius: 8px; margin-top: 16px;">Review Request</a>
              </div>
            </div>
          `,
        })
      );
      await Promise.allSettled(emailPromises);
    } catch (emailError) {
      console.error('Failed to send committee notification emails:', emailError.message);
    }

    res.status(201).json({ success: true, data: request });
  } catch (error) { next(error); }
});

// GET /api/fund-requests - List requests
router.get('/', protect, async (req, res, next) => {
  try {
    let query = {};
    if (req.user.role === 'community') query.userId = req.user._id;
    if (req.query.status && req.query.status !== 'all') query.status = req.query.status;

    const requests = await FundRequest.find(query)
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: requests });
  } catch (error) { next(error); }
});

// PUT /api/fund-requests/:id - Approve/Reject (committee member)
router.put('/:id', protect, authorize('committee', 'admin'), async (req, res, next) => {
  try {
    const { status, reviewNote } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be approved or rejected' });
    }
    if (!reviewNote) {
      return res.status(400).json({ success: false, message: 'Review note is required' });
    }

    const request = await FundRequest.findByIdAndUpdate(
      req.params.id,
      { status, reviewNote, reviewedBy: req.user._id },
      { new: true }
    ).populate('reviewedBy', 'name');

    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    // Notify requester via email
    try {
      await sendEmail({
        to: request.requesterEmail,
        subject: `Fund Request ${status === 'approved' ? 'Approved' : 'Rejected'} - E-Masjid`,
        html: `
          <div style="font-family: Arial; max-width: 600px; margin: 0 auto;">
            <div style="background: #047857; padding: 20px; text-align: center; color: white;"><h1>E-Masjid System</h1></div>
            <div style="padding: 30px; background: #f9fafb;">
              <h2>Fund Request ${status === 'approved' ? 'Approved ✅' : 'Rejected ❌'}</h2>
              <p>Dear ${request.requesterName},</p>
              <p>Your fund request for <strong>PKR ${request.amount?.toLocaleString()}</strong> (${request.category}) has been <strong>${status}</strong>.</p>
              <p><strong>Committee Note:</strong> ${reviewNote}</p>
              ${status === 'approved' ? '<p>Please visit the mosque office to collect your assistance.</p>' : ''}
            </div>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('Failed to send requester notification:', emailError.message);
    }

    res.json({ success: true, data: request });
  } catch (error) { next(error); }
});

module.exports = router;
