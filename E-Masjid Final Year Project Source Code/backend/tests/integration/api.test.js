jest.mock('../../utils/sendEmail', () => jest.fn().mockResolvedValue({ messageId: 'test-mock' }));

const request = require('supertest');
const mongoose = require('mongoose');

const app = require('../../server');
const User = require('../../models/User');
const Mosque = require('../../models/Mosque');
const Donation = require('../../models/Donation');
const FundRequest = require('../../models/FundRequest');
const NikahBooking = require('../../models/NikahBooking');

jest.setTimeout(30000);

describe('E-Masjid API (integration)', () => {
  let mongod;
  let mosque;
  let adminToken;
  let committeeToken;
  let communityToken;
  let scholarToken;
  let committeeUser;
  let scholarUser;

  beforeAll(async () => {
    await mongoose.disconnect().catch(() => {});
    const { MongoMemoryServer } = require('mongodb-memory-server');
    try {
      mongod = await MongoMemoryServer.create();
    } catch (err) {
      throw new Error(
        `mongodb-memory-server failed to start (refusing MONGODB_URI so tests never wipe a real database): ${err.message}`
      );
    }
    await mongoose.connect(mongod.getUri());

    await Promise.all([
      User.deleteMany({}),
      Mosque.deleteMany({}),
      Donation.deleteMany({}),
      FundRequest.deleteMany({}),
      NikahBooking.deleteMany({}),
    ]);

    const manager = await User.create({ name: 'Manager', email: 'm@test.com', password: 'pass1234', role: 'manager' });
    const admin = await User.create({ name: 'Admin', email: 'a@test.com', password: 'pass1234', role: 'admin' });
    committeeUser = await User.create({ name: 'Committee', email: 'c@test.com', password: 'pass1234', role: 'committee' });
    scholarUser = await User.create({ name: 'Scholar', email: 's@test.com', password: 'pass1234', role: 'scholar' });
    const community = await User.create({ name: 'User', email: 'u@test.com', password: 'pass1234', role: 'community' });

    mosque = await Mosque.create({
      name: 'Masjid Test',
      city: 'TestCity',
      managerId: manager._id,
      admins: [admin._id],
      enabledModules: ['donations', 'fundRequests', 'announcements', 'prayerTimes'],
      isActive: true,
    });

    await User.updateMany(
      { _id: { $in: [admin._id, committeeUser._id, scholarUser._id, community._id] } },
      { mosqueId: mosque._id }
    );

    // Login to get tokens
    const loginAdmin = await request(app).post('/api/auth/login').send({ email: 'a@test.com', password: 'pass1234' });
    adminToken = loginAdmin.body.token;
    const loginCommittee = await request(app).post('/api/auth/login').send({ email: 'c@test.com', password: 'pass1234' });
    committeeToken = loginCommittee.body.token;
    const loginUser = await request(app).post('/api/auth/login').send({ email: 'u@test.com', password: 'pass1234' });
    communityToken = loginUser.body.token;
    const loginScholar = await request(app).post('/api/auth/login').send({ email: 's@test.com', password: 'pass1234' });
    scholarToken = loginScholar.body.token;
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
  });

  test('GET /api/mosques/public lists active mosques', async () => {
    const res = await request(app).get('/api/mosques/public');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.some((m) => String(m._id) === String(mosque._id))).toBe(true);
  });

  test('auth /me works with token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user).toBeTruthy();
  });

  test('donations: admin can create cash donation (mosque scoped)', async () => {
    const res = await request(app)
      .post('/api/donations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ donorName: 'X', amount: 500, type: 'Zakat', paymentMethod: 'Cash' });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.mosqueId).toBe(String(mosque._id));
  });

  test('donations: top donors excludes anonymous', async () => {
    await Donation.create({ donorName: 'Anon', amount: 1000, type: 'Zakat', isAnonymous: true, mosqueId: mosque._id });
    await Donation.create({ donorName: 'Named', amount: 2000, type: 'Zakat', isAnonymous: false, mosqueId: mosque._id });

    const res = await request(app).get(`/api/donations/top-donors?mosqueId=${mosque._id}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.find((d) => d.name === 'Anon')).toBeFalsy();
    expect(res.body.data.find((d) => d.name === 'Named')).toBeTruthy();
  });

  test('fund request flow: community submit -> committee approve', async () => {
    const create = await request(app)
      .post('/api/fund-requests')
      .set('Authorization', `Bearer ${communityToken}`)
      .send({
        requesterName: 'Need Help',
        requesterEmail: 'need@test.com',
        requesterPhone: '0300',
        amount: 1000,
        category: 'Medical',
        reason: 'Need help for medical treatment and bills are too high for my family.',
        mosqueId: String(mosque._id),
      });
    expect(create.status).toBe(201);
    const id = create.body.data._id;

    const listForCommittee = await request(app)
      .get('/api/fund-requests')
      .set('Authorization', `Bearer ${committeeToken}`);
    expect(listForCommittee.status).toBe(200);
    expect(listForCommittee.body.data.find((r) => r._id === id)).toBeTruthy();

    const approve = await request(app)
      .put(`/api/fund-requests/${id}`)
      .set('Authorization', `Bearer ${committeeToken}`)
      .send({ status: 'approved', reviewNote: 'Verified' });
    expect(approve.status).toBe(200);
    expect(approve.body.data.status).toBe('approved');
    expect(approve.body.data.reviewedBy.name).toBe(committeeUser.name);
  });

  test('committee CRUD: admin can create, update and delete member', async () => {
    const create = await request(app)
      .post('/api/committee')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'New Committee', email: 'newcommittee@test.com', phone: '03001234567' });
    expect(create.status).toBe(201);
    expect(create.body.success).toBe(true);
    const memberId = create.body.data.id;

    const update = await request(app)
      .put(`/api/committee/${memberId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false });
    expect(update.status).toBe(200);
    expect(update.body.data.isActive).toBe(false);

    const remove = await request(app)
      .delete(`/api/committee/${memberId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(remove.status).toBe(200);
    expect(remove.body.success).toBe(true);
  });

  test('nikah flow: community creates and scholar accepts booking', async () => {
    const create = await request(app)
      .post('/api/nikah-bookings')
      .set('Authorization', `Bearer ${communityToken}`)
      .send({
        groomName: 'Imran',
        brideName: 'Aisha',
        preferredDate: new Date().toISOString(),
        preferredTime: '16:00',
        contact: '03009998877',
      });
    expect(create.status).toBe(201);
    const bookingId = create.body.data._id;

    const scholarList = await request(app)
      .get('/api/nikah-bookings')
      .set('Authorization', `Bearer ${scholarToken}`);
    expect(scholarList.status).toBe(200);
    expect(scholarList.body.data.some((b) => String(b._id) === String(bookingId))).toBe(true);

    const accept = await request(app)
      .put(`/api/nikah-bookings/${bookingId}`)
      .set('Authorization', `Bearer ${scholarToken}`)
      .send({
        status: 'accepted',
        confirmedDate: create.body.data.preferredDate,
        confirmedTime: create.body.data.preferredTime,
      });
    expect(accept.status).toBe(200);
    expect(accept.body.data.status).toBe('accepted');
    expect(String(accept.body.data.scholarId)).toBe(String(scholarUser._id));
  });

  // ─── Forgot / Reset Password flow (FR-9) ─────────────────────────
  const TEST_COMMUNITY_EMAIL = 'u@test.com'

  test('forgot-password returns neutral message for unknown email (no enumeration)', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'nonexistent@example.com' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/if the email exists/i);
  });

  test('forgot-password returns neutral message for known email and stores hashed token + 24h expiry', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: TEST_COMMUNITY_EMAIL });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/if the email exists/i);

    const stored = await User.findOne({ email: TEST_COMMUNITY_EMAIL }).select('+resetPasswordToken +resetPasswordExpire');
    expect(stored).toBeTruthy();
    expect(stored.resetPasswordToken).toBeTruthy();
    expect(stored.resetPasswordToken).toMatch(/^[a-f0-9]{64}$/); // sha256 hex
    const expiresIn = stored.resetPasswordExpire.getTime() - Date.now();
    // Should be ~24 hours (allow a 60-second window for test execution time)
    expect(expiresIn).toBeGreaterThan(24 * 60 * 60 * 1000 - 60_000);
    expect(expiresIn).toBeLessThanOrEqual(24 * 60 * 60 * 1000);
  });

  test('reset-password: wrong/missing token rejected; one-time use; matches new password rules', async () => {
    const crypto = require('crypto');
    // Set a known token + expiry on the community test user
    const rawToken = crypto.randomBytes(20).toString('hex');
    const hashed = crypto.createHash('sha256').update(rawToken).digest('hex');
    await User.updateOne(
      { email: TEST_COMMUNITY_EMAIL },
      { resetPasswordToken: hashed, resetPasswordExpire: new Date(Date.now() + 24 * 60 * 60 * 1000) }
    );

    // Invalid token -> 400
    const badToken = await request(app)
      .post(`/api/auth/reset-password/${'a'.repeat(40)}`)
      .send({ password: 'NewPass1234' });
    expect(badToken.status).toBe(400);
    expect(badToken.body.success).toBe(false);

    // Weak password -> 400 (PASSWORD_RULE) - server returns { message: 'Validation failed', errors: [{ field, message }] }
    const weak = await request(app)
      .post(`/api/auth/reset-password/${rawToken}`)
      .send({ password: 'short' });
    expect(weak.status).toBe(400);
    expect(weak.body.message).toBe('Validation failed');
    expect(Array.isArray(weak.body.errors)).toBe(true);
    const passwordErr = weak.body.errors.find((e) => e.field === 'password');
    expect(passwordErr).toBeTruthy();
    expect(passwordErr.message).toMatch(/at least 8 characters/i);

    // Mismatched confirmPassword -> 400 (server-side defense in depth)
    const mismatch = await request(app)
      .post(`/api/auth/reset-password/${rawToken}`)
      .send({ password: 'NewPass1234', confirmPassword: 'DifferentPass1234' });
    expect(mismatch.status).toBe(400);
    expect(mismatch.body.success).toBe(false);
    // The custom validator's error message is surfaced via errors[] (handleValidation uses generic message)
    const confirmErr = (mismatch.body.errors || []).find((e) => e.field === 'confirmPassword' || /passwords do not match/i.test(e.message));
    expect(confirmErr).toBeTruthy();
    expect(confirmErr.message).toMatch(/passwords do not match/i);

    // Valid -> 200, token cleared, login works with new password
    const ok = await request(app)
      .post(`/api/auth/reset-password/${rawToken}`)
      .send({ password: 'NewPass1234', confirmPassword: 'NewPass1234' });
    expect(ok.status).toBe(200);
    expect(ok.body.success).toBe(true);

    const cleared = await User.findOne({ email: TEST_COMMUNITY_EMAIL }).select('+resetPasswordToken +resetPasswordExpire');
    expect(cleared.resetPasswordToken).toBeUndefined();
    expect(cleared.resetPasswordExpire).toBeUndefined();

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_COMMUNITY_EMAIL, password: 'NewPass1234' });
    expect(login.status).toBe(200);
    expect(login.body.token).toBeTruthy();

    // One-time use: same token again -> 400
    const replay = await request(app)
      .post(`/api/auth/reset-password/${rawToken}`)
      .send({ password: 'AnotherPass1234', confirmPassword: 'AnotherPass1234' });
    expect(replay.status).toBe(400);
  });
});

